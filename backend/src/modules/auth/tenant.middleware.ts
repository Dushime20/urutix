import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantService } from './services/tenant.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly tenantService: TenantService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Extract tenant information from various sources
    const tenantId = this.extractTenantId(req);
    const subdomain = this.extractSubdomain(req);
    const domain = this.extractDomain(req);

    // Attach tenant information to request
    req['tenantInfo'] = {
      tenantId,
      subdomain,
      domain,
    };

    // If we have a subdomain, try to resolve the tenant
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      try {
        const tenant =
          await this.tenantService.findTenantBySubdomain(subdomain);
        req['tenantInfo'].resolvedTenant = tenant;
        req['tenantInfo'].tenantId = tenant.id;
      } catch (error) {
        // Tenant not found, continue with default tenant
        console.warn(`Tenant not found for subdomain: ${subdomain}`);
      }
    }

    // If we have a domain, try to resolve the tenant
    if (domain && !req['tenantInfo'].resolvedTenant) {
      try {
        const tenant = await this.tenantService.findTenantByDomain(domain);
        req['tenantInfo'].resolvedTenant = tenant;
        req['tenantInfo'].tenantId = tenant.id;
      } catch (error) {
        // Tenant not found, continue with default tenant
        console.warn(`Tenant not found for domain: ${domain}`);
      }
    }

    next();
  }

  private extractTenantId(req: Request): string | null {
    return (
      (req.headers['x-tenant-id'] as string) ||
      (req.query.tenantId as string) ||
      req.params.tenantId ||
      req.body?.tenantId ||
      null
    );
  }

  private extractSubdomain(req: Request): string | null {
    const hostname = req.hostname;
    if (!hostname) return null;

    const parts = hostname.split('.');
    if (parts.length < 2) return null;

    const subdomain = parts[0];
    return subdomain === 'www' || subdomain === 'api' ? null : subdomain;
  }

  private extractDomain(req: Request): string | null {
    const hostname = req.hostname;
    if (!hostname) return null;

    const parts = hostname.split('.');
    if (parts.length < 2) return null;

    // Remove subdomain and return the main domain
    parts.shift();
    return parts.join('.');
  }
}
