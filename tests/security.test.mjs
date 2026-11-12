import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

// Test the exact SSRF private IP validation algorithm used in app/api/extract-metadata/route.ts
function isPrivateOrReservedIP(ip) {
  // IPv4 checks
  if (ip === 'localhost') return true

  // Standard loopback
  if (/^127\./.test(ip)) return true

  // RFC 1918 Private ranges
  if (/^10\./.test(ip)) return true
  if (/^192\.168\./.test(ip)) return true
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true

  // Link-local / Cloud Metadata (AWS, GCP, Azure metadata endpoint: 169.254.169.254)
  if (/^169\.254\./.test(ip)) return true

  // Carrier-grade NAT
  if (/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./.test(ip)) return true

  // Current network / Broadcast / Documentation
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

// Token hash resolver from fragment or query string
function resolveTokenFromUrl(hash, search) {
  if (hash && hash.includes('token=')) {
    const match = hash.match(/token=([^&]+)/)
    if (match && match[1]) {
      return decodeURIComponent(match[1])
    }
  }
  if (search && search.includes('token=')) {
    const match = search.match(/token=([^&]+)/)
    if (match && match[1]) {
      return decodeURIComponent(match[1])
    }
  }
  return null
}

describe('Wishlink Security & Validation Tests', () => {

  describe('SSRF & Private IP Blacklisting', () => {
    it('should block IPv4 loopback addresses', () => {
      assert.equal(isPrivateOrReservedIP('127.0.0.1'), true)
      assert.equal(isPrivateOrReservedIP('127.1.2.3'), true)
    })

    it('should block AWS / Cloud instance metadata endpoints', () => {
      assert.equal(isPrivateOrReservedIP('169.254.169.254'), true)
      assert.equal(isPrivateOrReservedIP('169.254.1.1'), true)
    })

    it('should block RFC 1918 private subnets', () => {
      assert.equal(isPrivateOrReservedIP('10.0.0.1'), true)
      assert.equal(isPrivateOrReservedIP('10.255.255.255'), true)
      assert.equal(isPrivateOrReservedIP('192.168.1.1'), true)
      assert.equal(isPrivateOrReservedIP('172.16.0.1'), true)
      assert.equal(isPrivateOrReservedIP('172.31.255.255'), true)
      // Ensure 172.32 is NOT blocked (public IP)
      assert.equal(isPrivateOrReservedIP('172.32.0.1'), false)
    })

    it('should block IPv6 loopback and link-local', () => {
      assert.equal(isPrivateOrReservedIP('::1'), true)
      assert.equal(isPrivateOrReservedIP('fe80::1'), true)
      assert.equal(isPrivateOrReservedIP('fc00::1'), true)
      assert.equal(isPrivateOrReservedIP('fd00::1'), true)
    })

    it('should block IPv4-mapped IPv6 bypass attempts', () => {
      assert.equal(isPrivateOrReservedIP('::ffff:127.0.0.1'), true)
      assert.equal(isPrivateOrReservedIP('::ffff:169.254.169.254'), true)
      assert.equal(isPrivateOrReservedIP('::ffff:10.0.0.1'), true)
    })

    it('should allow legitimate public internet addresses', () => {
      assert.equal(isPrivateOrReservedIP('8.8.8.8'), false)
      assert.equal(isPrivateOrReservedIP('1.1.1.1'), false)
      assert.equal(isPrivateOrReservedIP('142.250.190.46'), false)
    })
  })

  describe('Reservation Token URL Handling', () => {
    it('should extract token from URL fragment hash', () => {
      const token = resolveTokenFromUrl('#token=abc1234567890abcdef', '')
      assert.equal(token, 'abc1234567890abcdef')
    })

    it('should prioritize fragment over query string to prevent log leakage', () => {
      const token = resolveTokenFromUrl('#token=frag_token', '?token=query_token')
      assert.equal(token, 'frag_token')
    })

    it('should fallback to query string for backward compatibility', () => {
      const token = resolveTokenFromUrl('', '?token=legacy_token')
      assert.equal(token, 'legacy_token')
    })

    it('should return null when token is missing', () => {
      const token = resolveTokenFromUrl('', '')
      assert.equal(token, null)
    })
  })

})
