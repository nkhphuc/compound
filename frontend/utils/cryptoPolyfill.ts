// Polyfill for crypto.randomUUID() to ensure compatibility
// This function generates a UUID v4 compatible string

declare global {
  interface Crypto {
    randomUUID(): string;
  }
}

function generateUUID(): `${string}-${string}-${string}-${string}-${string}` {
  // Only call native crypto.randomUUID if it exists and is not this polyfill
  if (
    typeof crypto !== 'undefined' &&
    crypto.randomUUID &&
    crypto.randomUUID !== generateUUID
  ) {
    try {
      return crypto.randomUUID() as `${string}-${string}-${string}-${string}-${string}`;
    } catch (error) {
      // Fallback to manual generation if crypto.randomUUID fails
      console.warn('crypto.randomUUID failed, using fallback:', error);
    }
  }

    // Fallback implementation for older browsers or HTTP contexts
    const array = new Uint8Array(16);

    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 16; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }

    array[6] = (array[6] & 0x0f) | 0x40; // Version 4
    array[8] = (array[8] & 0x3f) | 0x80; // Variant 1

    const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}` as `${string}-${string}-${string}-${string}-${string}`;
}

// Export the polyfill function
export const randomUUID = generateUUID;

// Also add it to the global crypto object if it doesn't exist
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  (crypto as Crypto & { randomUUID?: () => string }).randomUUID = generateUUID;
}
