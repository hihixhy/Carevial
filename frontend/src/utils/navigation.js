/**
 * Only allow same-origin internal redirects after login.
 * Blocks protocol-relative and external URLs.
 */
export function isSafeInternalPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return false
  if (value.startsWith('//')) return false
  if (value.includes('://')) return false
  return true
}
