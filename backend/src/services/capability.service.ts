import { Injectable, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PermissionService } from './raw-permission.service';
import { FeatureControlScope } from '../entities/feature-control.entity';
import { getRoleFallbackForPermissions, userHasAnyRole } from '../config/permission-role-fallback';

export interface CapabilityDenial {
  code: 'FEATURE_DISABLED' | 'PERMISSION_DENIED' | 'CAPABILITY_UNKNOWN';
  permission: string;
  message: string;
  scope?: 'PLATFORM' | 'TENANT';
}

export interface FeatureControlView {
  id: string | null;
  permissionCode: string;
  permissionId: string | null;
  resource: string;
  action: string;
  category: string | null;
  description: string | null;
  scope: FeatureControlScope;
  tenantId: string | null;
  enabled: boolean;
  isProtected: boolean;
  updatedBy: string | null;
  reason: string | null;
  updatedAt: Date | null;
}

/** Permissions that must never be globally disabled (platform integrity). */
export const PROTECTED_CAPABILITY_CODES = new Set([
  'users:permissions.manage',
  'users:assign_role',
  'users:view',
  'users:activate',
  'tenants:view',
  'tenants:manage',
  'system:settings',
  'system:view',
  'audit:view',
]);

/**
 * CapabilityService
 *
 * Evaluation order (after authentication + tenant isolation):
 * 1. Global (PLATFORM) feature control
 * 2. Tenant feature control (if present; cannot override PLATFORM OFF)
 * 3. Role / user permission (existing RBAC)
 *
 * Fail-closed for protected capability checks when evaluation errors occur.
 */
@Injectable()
export class CapabilityService {
  private readonly logger = new Logger(CapabilityService.name);

  /** permissionCode → enabled (platform scope) */
  private platformCache = new Map<string, { enabled: boolean; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 30_000; // 30s — permission changes apply quickly

  constructor(
    private readonly dataSource: DataSource,
    private readonly permissionService: PermissionService,
  ) {}

  normalizeCode(permission: string): string {
    if (!permission) return '';
    if (permission.includes(':')) {
      const [resource, action] = permission.split(':');
      return `${resource.trim()}:${action.trim()}`;
    }
    if (permission.includes('.')) {
      const [resource, action] = permission.split('.');
      return `${resource.trim()}:${action.trim()}`;
    }
    return permission.trim();
  }

  invalidateCache(permissionCode?: string): void {
    if (permissionCode) {
      this.platformCache.delete(this.normalizeCode(permissionCode));
      return;
    }
    this.platformCache.clear();
  }

  isProtectedCode(permissionCode: string): boolean {
    return PROTECTED_CAPABILITY_CODES.has(this.normalizeCode(permissionCode));
  }

  /**
   * Returns true when the feature is allowed by platform (+ optional tenant) controls.
   * Missing rows default to ENABLED.
   */
  async isFeatureEnabled(
    permissionCode: string,
    tenantId?: string | null,
  ): Promise<boolean> {
    const code = this.normalizeCode(permissionCode);
    if (!code) return false;

    const platformEnabled = await this.getPlatformEnabled(code);
    if (!platformEnabled) return false;

    if (tenantId) {
      const tenantEnabled = await this.getTenantEnabled(code, tenantId);
      if (tenantEnabled === false) return false;
    }

    return true;
  }

  /**
   * Full capability check: feature controls + RBAC.
   * Throws ForbiddenException with structured payload on denial.
   */
  async assertCapability(
    userId: string,
    permissionCode: string,
    options?: { tenantId?: string | null; requireAll?: boolean },
  ): Promise<void> {
    const code = this.normalizeCode(permissionCode);
    if (!code) {
      throw this.deny({
        code: 'CAPABILITY_UNKNOWN',
        permission: permissionCode,
        message: 'Unknown capability — access denied.',
      });
    }

    try {
      const platformEnabled = await this.getPlatformEnabled(code);
      if (!platformEnabled) {
        throw this.deny({
          code: 'FEATURE_DISABLED',
          permission: code,
          message: this.userFacingDisabledMessage(code),
          scope: 'PLATFORM',
        });
      }

      if (options?.tenantId) {
        const tenantEnabled = await this.getTenantEnabled(code, options.tenantId);
        if (tenantEnabled === false) {
          throw this.deny({
            code: 'FEATURE_DISABLED',
            permission: code,
            message:
              'This feature has been disabled by the platform administrator for your organization.',
            scope: 'TENANT',
          });
        }
      }

      const hasPerm = await this.permissionService.checkPermission(userId, code);
      if (!hasPerm) {
        throw this.deny({
          code: 'PERMISSION_DENIED',
          permission: code,
          message: `You do not have permission to perform this action (${code}).`,
        });
      }
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      this.logger.error(`Capability evaluation failed for ${code}: ${error?.message || error}`);
      throw this.deny({
        code: 'CAPABILITY_UNKNOWN',
        permission: code,
        message: 'Unable to verify authorization for this action — access denied.',
      });
    }
  }

  async assertAnyCapability(
    userId: string,
    permissionCodes: string[],
    options?: { tenantId?: string | null },
  ): Promise<void> {
    if (!permissionCodes?.length) return;

    const denials: CapabilityDenial[] = [];
    for (const raw of permissionCodes) {
      try {
        await this.assertCapability(userId, raw, options);
        return; // one success is enough
      } catch (error) {
        if (error instanceof ForbiddenException) {
          const payload = error.getResponse() as any;
          const body = typeof payload === 'object' ? payload : { message: payload };
          denials.push({
            code: body.code || 'PERMISSION_DENIED',
            permission: this.normalizeCode(raw),
            message: body.message || String(payload),
            scope: body.scope,
          });
          continue;
        }
        throw error;
      }
    }

    // Prefer FEATURE_DISABLED message if any
    const featureDenial = denials.find((d) => d.code === 'FEATURE_DISABLED');
    const denial = featureDenial || denials[0];
    throw this.deny(denial);
  }

  /**
   * Permission-first with role fallback (legacy safety net).
   * Order: explicit user DENY → feature kill-switch → effective permission → allowed role.
   */
  async assertAnyCapabilityOrRole(
    userId: string,
    permissionCodes: string[],
    options?: {
      tenantId?: string | null;
      userRole?: string;
      decoratorRoles?: string[];
    },
  ): Promise<void> {
    if (!permissionCodes?.length) return;

    const explicitDeny = await this.permissionService.hasExplicitDenyForAny(
      userId,
      permissionCodes,
    );
    if (explicitDeny) {
      throw this.deny({
        code: 'PERMISSION_DENIED',
        permission: this.normalizeCode(explicitDeny),
        message: `This capability was denied for your account (${explicitDeny}).`,
      });
    }

    try {
      await this.assertAnyCapability(userId, permissionCodes, { tenantId: options?.tenantId });
      return;
    } catch (error) {
      if (!(error instanceof ForbiddenException)) throw error;

      const payload = error.getResponse() as Record<string, unknown>;
      const code = payload?.code as string | undefined;
      if (code === 'FEATURE_DISABLED') throw error;

      const fallbackRoles = [
        ...(options?.decoratorRoles || []),
        ...getRoleFallbackForPermissions(permissionCodes),
      ];
      const uniqueRoles = [...new Set(fallbackRoles.map((r) => String(r).toUpperCase()))];

      if (userHasAnyRole(options?.userRole, uniqueRoles)) {
        this.logger.debug(
          `Role fallback allowed ${options?.userRole} for [${permissionCodes.join(', ')}]`,
        );
        return;
      }

      throw error;
    }
  }

  async getDisabledFeatures(tenantId?: string | null): Promise<string[]> {
    try {
      const platformRows: Array<{ permission_code: string }> = await this.dataSource.query(
        `SELECT permission_code FROM feature_controls
         WHERE scope = 'PLATFORM' AND tenant_id IS NULL AND enabled = FALSE`,
      );
      const disabled = new Set(platformRows.map((r) => r.permission_code));

      if (tenantId) {
        const tenantRows: Array<{ permission_code: string }> = await this.dataSource.query(
          `SELECT permission_code FROM feature_controls
           WHERE scope = 'TENANT' AND tenant_id = $1 AND enabled = FALSE`,
          [tenantId],
        );
        tenantRows.forEach((r) => disabled.add(r.permission_code));
      }

      return Array.from(disabled);
    } catch (error) {
      this.logger.warn(`getDisabledFeatures failed: ${error?.message || error}`);
      return [];
    }
  }

  /**
   * List controllable capabilities with current platform (or tenant) status.
   * Defaults missing controls to enabled=true.
   */
  async listFeatureControls(options?: {
    tenantId?: string | null;
    category?: string;
  }): Promise<FeatureControlView[]> {
    const scope = options?.tenantId ? FeatureControlScope.TENANT : FeatureControlScope.PLATFORM;

    const permissions: Array<{
      id: string;
      resource: string;
      action: string;
      category: string | null;
      description: string | null;
    }> = await this.dataSource.query(
      `SELECT id, resource, action, category, description
       FROM permissions
       ${options?.category ? 'WHERE category = $1' : ''}
       ORDER BY category, resource, action`,
      options?.category ? [options.category] : [],
    );

    let controlRows: any[] = [];
    if (scope === FeatureControlScope.PLATFORM) {
      controlRows = await this.dataSource.query(
        `SELECT * FROM feature_controls WHERE scope = 'PLATFORM' AND tenant_id IS NULL`,
      );
    } else {
      controlRows = await this.dataSource.query(
        `SELECT * FROM feature_controls WHERE scope = 'TENANT' AND tenant_id = $1`,
        [options!.tenantId],
      );
    }

    const byCode = new Map<string, any>(
      controlRows.map((r) => [r.permission_code, r]),
    );

    return permissions.map((p) => {
      const code = `${p.resource}:${p.action}`;
      const row = byCode.get(code);
      return {
        id: row?.id ?? null,
        permissionCode: code,
        permissionId: p.id,
        resource: p.resource,
        action: p.action,
        category: p.category,
        description: p.description,
        scope,
        tenantId: options?.tenantId ?? null,
        enabled: row ? Boolean(row.enabled) : true,
        isProtected: this.isProtectedCode(code),
        updatedBy: row?.updated_by ?? null,
        reason: row?.reason ?? null,
        updatedAt: row?.updated_at ?? null,
      };
    });
  }

  async setFeatureControl(params: {
    permissionCode: string;
    enabled: boolean;
    updatedBy: string;
    reason?: string;
    scope?: FeatureControlScope;
    tenantId?: string | null;
  }): Promise<FeatureControlView> {
    const code = this.normalizeCode(params.permissionCode);
    const scope = params.scope || FeatureControlScope.PLATFORM;
    const tenantId =
      scope === FeatureControlScope.TENANT ? params.tenantId || null : null;

    if (scope === FeatureControlScope.TENANT && !tenantId) {
      throw new BadRequestException('tenantId is required for TENANT scope feature controls');
    }

    if (!params.enabled && this.isProtectedCode(code)) {
      throw new BadRequestException(
        `Permission "${code}" is system-critical and cannot be disabled.`,
      );
    }

    // Tenant cannot enable what platform disabled
    if (scope === FeatureControlScope.TENANT && params.enabled) {
      const platformOn = await this.getPlatformEnabled(code);
      if (!platformOn) {
        throw new ForbiddenException({
          code: 'FEATURE_DISABLED',
          permission: code,
          message:
            'This feature is disabled globally by the platform administrator and cannot be enabled for a tenant.',
          scope: 'PLATFORM',
        });
      }
    }

    let permissionId: string | null = null;
    try {
      const rows = await this.dataSource.query(
        `SELECT id FROM permissions WHERE resource = $1 AND action = $2 LIMIT 1`,
        [code.split(':')[0], code.split(':')[1]],
      );
      permissionId = rows[0]?.id ?? null;
    } catch {
      permissionId = null;
    }

    const existing = await this.dataSource.query(
      scope === FeatureControlScope.PLATFORM
        ? `SELECT id, enabled FROM feature_controls
           WHERE permission_code = $1 AND scope = 'PLATFORM' AND tenant_id IS NULL`
        : `SELECT id, enabled FROM feature_controls
           WHERE permission_code = $1 AND scope = 'TENANT' AND tenant_id = $2`,
      scope === FeatureControlScope.PLATFORM ? [code] : [code, tenantId],
    );

    const oldValue = existing[0] ? Boolean(existing[0].enabled) : true;

    if (existing[0]) {
      await this.dataSource.query(
        `UPDATE feature_controls
         SET enabled = $1, updated_by = $2, reason = $3, updated_at = NOW(), permission_id = COALESCE($4, permission_id)
         WHERE id = $5`,
        [params.enabled, params.updatedBy, params.reason || null, permissionId, existing[0].id],
      );
    } else {
      await this.dataSource.query(
        `INSERT INTO feature_controls
           (permission_id, permission_code, scope, tenant_id, enabled, updated_by, reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          permissionId,
          code,
          scope,
          tenantId,
          params.enabled,
          params.updatedBy,
          params.reason || null,
        ],
      );
    }

    await this.logFeatureAudit({
      permissionCode: code,
      oldValue,
      newValue: params.enabled,
      changedBy: params.updatedBy,
      reason: params.reason,
      tenantId,
      scope,
    });

    this.invalidateCache(code);

    const list = await this.listFeatureControls({
      tenantId: scope === FeatureControlScope.TENANT ? tenantId : null,
    });
    return list.find((f) => f.permissionCode === code)!;
  }

  async getFeatureAuditLogs(limit = 50, offset = 0): Promise<any[]> {
    try {
      return await this.dataSource.query(
        `SELECT id, action, entity_type, entity_id, user_id, changes, ip_address, user_agent, created_at
         FROM permission_audit_log
         WHERE entity_type = 'feature_control'
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      );
    } catch (error) {
      this.logger.warn(`getFeatureAuditLogs failed: ${error?.message || error}`);
      return [];
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async getPlatformEnabled(code: string): Promise<boolean> {
    const cached = this.platformCache.get(code);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.enabled;
    }

    try {
      const tableCheck = await this.dataSource.query(
        `SELECT COUNT(*)::int AS count FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'feature_controls'`,
      );
      if (!tableCheck[0]?.count) {
        // Table not migrated yet — treat as enabled (no kill-switch configured)
        this.platformCache.set(code, { enabled: true, expiresAt: Date.now() + this.CACHE_TTL_MS });
        return true;
      }

      const rows = await this.dataSource.query(
        `SELECT enabled FROM feature_controls
         WHERE permission_code = $1 AND scope = 'PLATFORM' AND tenant_id IS NULL
         LIMIT 1`,
        [code],
      );
      const enabled = rows.length === 0 ? true : Boolean(rows[0].enabled);
      this.platformCache.set(code, { enabled, expiresAt: Date.now() + this.CACHE_TTL_MS });
      return enabled;
    } catch (error) {
      this.logger.error(`Platform feature lookup failed for ${code}: ${error?.message || error}`);
      throw error;
    }
  }

  private async getTenantEnabled(code: string, tenantId: string): Promise<boolean | null> {
    try {
      const rows = await this.dataSource.query(
        `SELECT enabled FROM feature_controls
         WHERE permission_code = $1 AND scope = 'TENANT' AND tenant_id = $2
         LIMIT 1`,
        [code, tenantId],
      );
      if (!rows || rows.length === 0) return null;
      return Boolean(rows[0].enabled);
    } catch (error) {
      this.logger.error(`Tenant feature lookup failed for ${code}: ${error?.message || error}`);
      throw error;
    }
  }

  private deny(denial: CapabilityDenial): ForbiddenException {
    return new ForbiddenException({
      statusCode: 403,
      error: 'Forbidden',
      code: denial.code,
      permission: denial.permission,
      message: denial.message,
      scope: denial.scope,
    });
  }

  private userFacingDisabledMessage(code: string): string {
    const labels: Record<string, string> = {
      'bids:create': 'Cargo bidding is currently unavailable. Please contact your administrator for more information.',
      'bids:manage': 'Bid management is currently unavailable. Please contact your administrator for more information.',
      'auctions:create': 'Creating auctions is currently unavailable. Please contact your administrator for more information.',
      'matching:request': 'Smart Matching is currently unavailable. Please contact your administrator for more information.',
      'matching:respond': 'Smart Matching responses are currently unavailable. Please contact your administrator for more information.',
      'matching:view_results': 'Smart Matching is currently unavailable. Please contact your administrator for more information.',
      'cargo:create': 'Cargo creation is currently unavailable. Please contact your administrator for more information.',
      'cargo:edit': 'Cargo updates are currently unavailable. Please contact your administrator for more information.',
      'cargo:delete': 'Cargo deletion is currently unavailable. Please contact your administrator for more information.',
      'cargo:publish': 'Publishing cargo is currently unavailable. Please contact your administrator for more information.',
      'trips:start': 'Starting trips is currently unavailable. Please contact your administrator for more information.',
      'trips:complete': 'Completing trips is currently unavailable. Please contact your administrator for more information.',
      'trips:assign_driver': 'Driver assignment is currently unavailable. Please contact your administrator for more information.',
      'brokers:assign': 'Broker assignment is currently unavailable. Please contact your administrator for more information.',
      'lending:create_request': 'Lender financing is currently unavailable. Please contact your administrator for more information.',
      'lending:approve': 'Loan approval is currently unavailable. Please contact your administrator for more information.',
      'customs:create': 'Customs inspection creation is currently unavailable. Please contact your administrator for more information.',
      'customs:update': 'Customs inspection updates are currently unavailable. Please contact your administrator for more information.',
      'receivers:inspect': 'Cargo inspection is currently unavailable. Please contact your administrator for more information.',
    };
    return (
      labels[code] ||
      'This feature is currently unavailable. Please contact your administrator for more information.'
    );
  }

  private async logFeatureAudit(params: {
    permissionCode: string;
    oldValue: boolean;
    newValue: boolean;
    changedBy: string;
    reason?: string;
    tenantId?: string | null;
    scope: FeatureControlScope;
  }): Promise<void> {
    try {
      await this.dataSource.query(
        `INSERT INTO permission_audit_log
           (action, entity_type, entity_id, user_id, changes)
         VALUES ($1, 'feature_control', $2, $3, $4::jsonb)`,
        [
          params.newValue ? 'enable_feature' : 'disable_feature',
          params.permissionCode,
          params.changedBy,
          JSON.stringify({
            permission: params.permissionCode,
            scope: params.scope,
            tenantId: params.tenantId,
            oldValue: params.oldValue ? 'ENABLED' : 'DISABLED',
            newValue: params.newValue ? 'ENABLED' : 'DISABLED',
            reason: params.reason || null,
          }),
        ],
      );
    } catch (error) {
      this.logger.warn(`Feature audit log failed: ${error?.message || error}`);
    }
  }
}
