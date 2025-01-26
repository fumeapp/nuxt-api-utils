import { randomBytes } from 'node:crypto'

/**
 * Generate a unique hash from a string
 * @param payload - The string to hash
 */
export async function hashFromPayload(payload: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(payload)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a unique hash from a file
 * @param file
 */
export async function hashFromFile(file: File) {
  return await crypto.subtle
    .digest('SHA-256', await file.arrayBuffer())
    .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))
}

/**
 * Generates a hash from the content of a URL
 * Returns the hash and the file a Blob
 * @param url
 */

export async function hashFromUrl(url: string): Promise<{ imageHash: string, imageFile: File }> {
  const response = await fetch(url)
  const imageBlob = await response.blob()
  const imageFile = new File([imageBlob], 'avatar', { type: imageBlob.type })
  const imageHash = await hashFromFile(imageFile)
  return { imageHash, imageFile }
}

/**
 * Generates a random hash from a set of characters
 * @param length The length of the hash
 * @param lower Whether to use only lowercase characters
 */
export function hashGenerate(length: number = 32, lower = false): string {
  const charsetAll = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charsetLower = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const charset = lower ? charsetLower : charsetAll
  const bytes = randomBytes(length)
  let result = ''

  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length]
  }

  return result
}
