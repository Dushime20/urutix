import {
  evaluateWebhookSignature,
  hmacSha256Hex,
  parseSignatureHeader,
  signaturesMatch,
} from './mobile-money-webhook.util';

describe('mobile-money webhook signature', () => {
  const secret = 'test-webhook-secret';
  const body = '{"referenceId":"PARK-1","status":"success"}';

  it('treats a missing header as unsigned, not valid', () => {
    expect(
      evaluateWebhookSignature({ secret, signatureHeader: undefined, rawBody: body }),
    ).toBe('unsigned');
  });

  it('accepts a matching sha256 signature', () => {
    const digest = hmacSha256Hex(secret, body);
    expect(
      evaluateWebhookSignature({
        secret,
        signatureHeader: `sha256=${digest}`,
        rawBody: body,
      }),
    ).toBe('signed');
    expect(signaturesMatch(digest, digest)).toBe(true);
  });

  it('rejects a present but incorrect signature', () => {
    expect(
      evaluateWebhookSignature({
        secret,
        signatureHeader: 'sha256=deadbeef',
        rawBody: body,
      }),
    ).toBe('invalid');
  });

  it('strips the sha256= prefix', () => {
    expect(parseSignatureHeader('sha256=abc')).toBe('abc');
  });
});
