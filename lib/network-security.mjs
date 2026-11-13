/**
 * Validates whether an IP address belongs to private, loopback, link-local,
 * cloud metadata, or reserved ranges (both IPv4 and IPv6).
 * Used for SSRF defense across metadata extraction and external URL fetches.
 *
 * @param {string} ip
 * @returns {boolean}
 */
export function isPrivateOrReservedIP(ip) {
  if (!ip) return true

  // Standard loopback
  if (ip === 'localhost') return true

  // Standard loopback IPv4
  if (/^127\./.test(ip)) return true

  // RFC 1918 Private ranges
  if (/^10\./.test(ip)) return true
  if (/^192\.168\./.test(ip)) return true
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true

  // Link-local / Cloud Metadata (AWS, GCP, Azure metadata endpoint: 169.254.169.254)
  if (/^169\.254\./.test(ip)) return true

  // Carrier-grade NAT
  if (/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(ip)) return true

  // Current network / Broadcast / Documentation (RFC 5737)
  if (/^0\./.test(ip) || /^255\.255\.255\.255$/.test(ip)) return true
  if (/^192\.0\.2\./.test(ip) || /^198\.51\.100\./.test(ip) || /^203\.0\.113\./.test(ip)) return true

  // IPv6 checks
  const lower = ip.toLowerCase()
  if (lower === '::1' || lower === '::' || lower === '0:0:0:0:0:0:0:1') return true
  if (lower.startsWith('fe80:')) return true // Link-local
  if (lower.startsWith('fc00:') || lower.startsWith('fd00:')) return true // Unique Local Address (ULA)
  if (lower.startsWith('::ffff:')) {
    const mappedIpv4 = lower.slice(7)
    return isPrivateOrReservedIP(mappedIpv4)
  }

  return false
}

// Alias for API route compatibility
export const isRestrictedIP = isPrivateOrReservedIP
