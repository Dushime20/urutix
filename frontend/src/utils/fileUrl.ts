/**
 * Build a full URL for a backend-served file.
 * Handles absolute URLs (http/https) and relative paths like /uploads/...
 */
export function buildFileUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3005/api')
    .replace(/\/api$/, '')
    .replace(/\/$/, '');
  const filePath = path.replace(/^\/+/, '');
  return `${base}/${filePath}`;
}
