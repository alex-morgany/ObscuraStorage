const encoder = new TextEncoder();
const decoder = new TextDecoder();

const HEX_TABLE = '0123456789abcdef';

function getDigits(key: string) {
  if (!/^\d{12}$/.test(key)) {
    throw new Error('Secret key must contain exactly 12 digits');
  }
  return key.split('').map((digit) => Number(digit));
}

function toHex(bytes: Uint8Array) {
  let hex = '';
  for (let i = 0; i < bytes.length; i += 1) {
    const value = bytes[i];
    hex += HEX_TABLE[value >> 4];
    hex += HEX_TABLE[value & 15];
  }
  return hex;
}

function fromHex(hex: string) {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid encrypted hash');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export function generateSecretKey() {
  const array = globalThis.crypto?.getRandomValues(new Uint32Array(2)) ?? new Uint32Array([Date.now(), Date.now() * 3]);
  const combined = (BigInt(array[0]) << 32n) | BigInt(array[1]);
  const normalized = (combined % 900000000000n) + 100000000000n;
  return normalized.toString();
}

export function encryptHashWithKey(hash: string, key: string) {
  const digits = getDigits(key);
  const source = encoder.encode(hash);
  const encrypted = new Uint8Array(source.length);

  for (let i = 0; i < source.length; i += 1) {
    encrypted[i] = (source[i] + digits[i % digits.length]) % 256;
  }

  return toHex(encrypted);
}

export function decryptHashWithKey(encryptedHex: string, key: string) {
  const digits = getDigits(key);
  const encrypted = fromHex(encryptedHex);
  const decrypted = new Uint8Array(encrypted.length);

  for (let i = 0; i < encrypted.length; i += 1) {
    const value = encrypted[i] - digits[i % digits.length];
    decrypted[i] = (value + 256) % 256;
  }

  return decoder.decode(decrypted);
}

export function isValidSecretKey(key: string) {
  return /^\d{12}$/.test(key);
}
