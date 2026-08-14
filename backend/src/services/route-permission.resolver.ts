import { Injectable } from '@nestjs/common';
import {
  ROUTE_PERMISSION_RULES,
  ROUTE_PERMISSION_SKIP,
  type HttpMethod,
  type RoutePermissionRule,
} from '../config/route-permission.rules';

@Injectable()
export class RoutePermissionResolver {
  /**
   * Normalize request path: strip /api prefix, leading slash, query string.
   */
  normalizePath(rawPath: string): string {
    let path = String(rawPath || '').split('?')[0].trim();
    if (path.startsWith('/api/')) path = path.slice(5);
    else if (path.startsWith('/api')) path = path.slice(4);
    if (path.startsWith('/')) path = path.slice(1);
    return path.toLowerCase();
  }

  shouldSkip(path: string): boolean {
    return ROUTE_PERMISSION_SKIP.some((re) => re.test(path));
  }

  resolve(method: string, rawPath: string): string[] | null {
    const path = this.normalizePath(rawPath);
    if (!path || this.shouldSkip(path)) return null;

    const httpMethod = method.toUpperCase() as HttpMethod;

    for (const rule of ROUTE_PERMISSION_RULES) {
      if (!rule.pattern.test(path)) continue;
      if (rule.methods?.length && !rule.methods.includes(httpMethod)) continue;
      return rule.permissions;
    }

    return null;
  }

  /** For tests / diagnostics */
  explain(method: string, rawPath: string): { path: string; permissions: string[] | null; skipped: boolean } {
    const path = this.normalizePath(rawPath);
    if (this.shouldSkip(path)) {
      return { path, permissions: null, skipped: true };
    }
    return { path, permissions: this.resolve(method, rawPath), skipped: false };
  }
}
