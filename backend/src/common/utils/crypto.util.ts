import * as crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended IV length

function getKey(): Buffer {
  const secret = process.env.LENDER_OUTBOUND_KEY_SECRET || '';
  if (secret.length < 32) {
    // Pad or hash to 32 bytes if needed
    return crypto.createHash('sha256').update(secret).digest();
  }
  return Buffer.from(secret).subarray(0, 32);
}

export function encryptString(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decryptString(ciphertextB64: string): string {
  const raw = Buffer.from(ciphertextB64, 'base64');
  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
  const data = raw.subarray(IV_LENGTH + 16);
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}


