import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { isPrivateOrReservedIP } from '../lib/network-security.mjs'
import { resolveTokenFromUrl } from '../lib/token-utils.mjs'

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

    it('should extract token when combined with other hash parameters', () => {
      const token = resolveTokenFromUrl('#view=ticket&token=secret_hex_9988&source=mobile', '')
      assert.equal(token, 'secret_hex_9988')
    })

    it('should properly URL-decode complex or percent-encoded tokens', () => {
      const token = resolveTokenFromUrl('#token=abc%2Bdef%3D123', '')
      assert.equal(token, 'abc+def=123')
    })

    it('should prioritize fragment over query string to prevent log leakage', () => {
      const token = resolveTokenFromUrl('#token=frag_token', '?token=query_token')
      assert.equal(token, 'frag_token')
    })

    it('should fallback to query string for backward compatibility', () => {
      const token = resolveTokenFromUrl('', '?token=legacy_token')
      assert.equal(token, 'legacy_token')
    })

    it('should return null when token is missing or empty', () => {
      assert.equal(resolveTokenFromUrl('', ''), null)
      assert.equal(resolveTokenFromUrl('#other=123', '?foo=bar'), null)
      assert.equal(resolveTokenFromUrl(undefined, undefined), null)
    })
  })

})
