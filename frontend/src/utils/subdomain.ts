/**
 * Subdomain utility functions for multi-tenant support
 */

/**
 * Extract subdomain from current hostname
 * @returns subdomain string or null if not applicable
 */
export function getSubdomain(): string | null {
  const hostname = window.location.hostname;
  
  // Skip for localhost and IP addresses
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  const parts = hostname.split('.');
  
  // Need at least subdomain.domain.tld (3 parts)
  if (parts.length < 3) {
    return null;
  }

  const subdomain = parts[0];
  
  // Reserved subdomains that shouldn't be treated as tenants
  const reserved = ['www', 'api', 'admin', 'app', 'cdn', 'static', 'mail'];
  if (reserved.includes(subdomain)) {
    return null;
  }

  return subdomain;
}

/**
 * Check if current subdomain is the admin subdomain
 */
export function isAdminSubdomain(): boolean {
  const hostname = window.location.hostname;
  return hostname.startsWith('admin.');
}

/**
 * Get tenant identifier from subdomain
 */
export function getTenantFromSubdomain(): string | null {
  return getSubdomain();
}

/**
 * Build URL for a specific tenant subdomain
 */
export function buildTenantUrl(subdomain: string, path: string = ''): string {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // For localhost, use the same hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}${port ? ':' + port : ''}${path}`;
  }

  // Extract main domain (remove subdomain)
  const parts = hostname.split('.');
  const mainDomain = parts.slice(-2).join('.');
  
  return `${protocol}//${subdomain}.${mainDomain}${port ? ':' + port : ''}${path}`;
}

/**
 * Get main domain without subdomain
 */
export function getMainDomain(): string {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return hostname;
  }

  const parts = hostname.split('.');
  return parts.slice(-2).join('.');
}

/**
 * Check if we're on a tenant-specific subdomain
 */
export function isTenantSubdomain(): boolean {
  return getSubdomain() !== null;
}
