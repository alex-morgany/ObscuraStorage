const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function randomHash(length: number) {
  const bytes = globalThis.crypto?.getRandomValues(new Uint8Array(length)) ?? new Uint8Array(length).fill(21);
  let value = '';
  for (let i = 0; i < length; i += 1) {
    value += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return value;
}

export async function mockIpfsUpload() {
  await new Promise((resolve) => setTimeout(resolve, 800));
  return `bafy${randomHash(52)}`;
}

export function humanReadableSize(file: File | null) {
  if (!file) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = file.size;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
