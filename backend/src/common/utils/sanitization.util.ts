import { Transform } from 'class-transformer';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  if (!html) return html;

  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Transform decorator for sanitizing HTML content
 */
export function SanitizeHtml() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return sanitizeHtml(value);
    }
    return value;
  });
}

/**
 * Sanitize object properties recursively
 */
export function sanitizeObject(obj: any): any {
  if (!obj) return obj;

  if (typeof obj === 'string') {
    return sanitizeHtml(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}
