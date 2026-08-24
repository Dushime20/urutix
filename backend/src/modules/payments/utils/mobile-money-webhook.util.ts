import { createHmac, timingSafeEqual } from 'crypto';

export type WebhookSignatureTrust = 'signed' | 'unsigned' | 'invalid';

export function parseSignatureHeader(header?: string | string[]): string {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return '';
  return value.trim().replace(/^sha256=/i, '');
}

export function hmacSha256Hex(secret: string, body: string): string {
  return createHmac('sha256', secret).update(body, 'utf8').digest('hex');
}

export function signaturesMatch(provided: string, expectedHex: string): boolean {
  const a = Buffer.from(String(provided).toLowerCase());
  const b = Buffer.from(String(expectedHex).toLowerCase());
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Ishema currently omits a signature header. Unsigned callbacks are accepted
 * as a delivery ACK only — money movement must still be confirmed via GET.
 * A present-but-wrong signature is invalid and must not be applied.
 */
export function evaluateWebhookSignature(input: {
  secret?: string;
  signatureHeader?: string | string[];
  rawBody?: string;
}): WebhookSignatureTrust {
  const provided = parseSignatureHeader(input.signatureHeader);
  if (!provided) return 'unsigned';
  if (!input.secret || input.rawBody == null) return 'invalid';
  const expected = hmacSha256Hex(input.secret, input.rawBody);
  return signaturesMatch(provided, expected) ? 'signed' : 'invalid';
}
