/**
 * env.config.ts
 *
 * Single source of truth for all environment-derived URLs.
 * Never falls back to hardcoded values — throws clearly at startup
 * so misconfigured deployments fail fast rather than silently
 * serving wrong URLs.
 *
 * Usage:
 *   import { getEnvConfig } from '@/config/env.config';
 *   const { frontendUrl, backendUrl, smtpFrom } = getEnvConfig();
 */

export interface EnvConfig {
  /** Public-facing frontend base URL, e.g. https://urutix.com */
  frontendUrl: string;
  /** Backend API base URL, e.g. https://api.urutix.com */
  backendUrl: string;
  /** Default SMTP "from" address */
  smtpFrom: string;
}

let _cached: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (_cached) return _cached;

  const frontendUrl = process.env.FRONTEND_URL;
  const backendUrl  = process.env.BACKEND_URL || process.env.API_URL;
  const smtpFrom    = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER;

  const missing: string[] = [];
  if (!frontendUrl) missing.push('FRONTEND_URL');
  if (!backendUrl)  missing.push('BACKEND_URL (or API_URL)');
  if (!smtpFrom)    missing.push('EMAIL_FROM_ADDRESS (or SMTP_USER)');

  if (missing.length) {
    throw new Error(
      `[env.config] Missing required environment variables:\n` +
      missing.map(v => `  - ${v}`).join('\n') +
      `\nSet them in your .env file before starting the server.`,
    );
  }

  _cached = {
    frontendUrl: frontendUrl!.replace(/\/$/, ''),
    backendUrl:  backendUrl!.replace(/\/$/, ''),
    smtpFrom:    smtpFrom!,
  };

  return _cached;
}
