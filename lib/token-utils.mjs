/**
 * Safely extracts a gift reservation bearer token from the client URL.
 * Prioritizes URL fragment hash (#token=...) to prevent token leakage in HTTP access logs,
 * reverse proxy logs, and Referer headers (DEC-003).
 *
 * @param {string} [hash] - The window.location.hash value
 * @param {string} [search] - The window.location.search value (fallback)
 * @returns {string | null}
 */
export function resolveTokenFromUrl(hash = '', search = '') {
  // 1. High-priority fragment extraction (Zero HTTP wire transmission)
  if (hash && hash.includes('token=')) {
    const match = hash.match(/token=([^&]+)/)
    if (match && match[1]) {
      return decodeURIComponent(match[1])
    }
  }

  // 2. Backward compatibility fallback for legacy query params
  if (search && search.includes('token=')) {
    const match = search.match(/token=([^&]+)/)
    if (match && match[1]) {
      return decodeURIComponent(match[1])
    }
  }

  return null
}
