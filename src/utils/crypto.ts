// AES-GCM encryption for API keys using Web Crypto API
const ALGORITHM = 'AES-GCM'
const KEY_USAGE: KeyUsage[] = ['encrypt', 'decrypt']

async function getKey(): Promise<CryptoKey> {
  // Derive a key from a fixed app-level salt + device fingerprint
  const raw = new TextEncoder().encode('niwamiri-key-v1')
  const baseKey = await crypto.subtle.importKey('raw', raw, 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('niwamiri-salt-2024'),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: ALGORITHM, length: 256 },
    false,
    KEY_USAGE
  )
}

export async function encryptApiKey(apiKey: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(apiKey)
  const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded)

  // Combine iv + ciphertext, encode as base64
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptApiKey(encrypted: string): Promise<string> {
  const key = await getKey()
  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  const plaintext = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}
