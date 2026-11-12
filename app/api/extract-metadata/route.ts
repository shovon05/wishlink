import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import dns from 'dns/promises'
import net from 'net'

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 25
const MAX_RESPONSE_SIZE = 2 * 1024 * 1024 // 2 MB
const FETCH_TIMEOUT_MS = 6000 // 6 seconds
const MAX_REDIRECTS = 3

const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

/**
 * Validates whether an IP address belongs to private, loopback, link-local,
 * cloud metadata, or reserved ranges (both IPv4 and IPv6).
 */
function isRestrictedIP(ip: string): boolean {
  if (!ip) return true

  // Normalize IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 -> 127.0.0.1)
  const ipv4Mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)
  const checkIP = ipv4Mapped ? ipv4Mapped[1] : ip

  const version = net.isIP(checkIP)
  if (version === 0) return true // Invalid IP address

  if (version === 4) {
    const parts = checkIP.split('.').map(Number)
    const [b0, b1] = parts

    // 0.0.0.0/8 (Current network)
    if (b0 === 0) return true
    // 10.0.0.0/8 (Private)
    if (b0 === 10) return true
    // 127.0.0.0/8 (Loopback)
    if (b0 === 127) return true
    // 100.64.0.0/10 (Carrier-grade NAT)
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true
    // 169.254.0.0/16 (Link-local / Cloud metadata including 169.254.169.254)
    if (b0 === 169 && b1 === 254) return true
    // 172.16.0.0/12 (Private)
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (b0 === 192 && b1 === 0 && parts[2] === 0) return true
    // 192.0.2.0/24 (TEST-NET-1)
    if (b0 === 192 && b1 === 0 && parts[2] === 2) return true
    // 192.168.0.0/16 (Private)
    if (b0 === 192 && b1 === 168) return true
    // 198.51.100.0/24 (TEST-NET-2)
    if (b0 === 198 && b1 === 51 && parts[2] === 100) return true
    // 203.0.113.0/24 (TEST-NET-3)
    if (b0 === 203 && b1 === 0 && parts[2] === 113) return true
    // 224.0.0.0/4 (Multicast)
    if (b0 >= 224 && b0 <= 239) return true
    // 240.0.0.0/4 (Reserved)
    if (b0 >= 240) return true

    return false
  }

  if (version === 6) {
    const lower = checkIP.toLowerCase()
    // ::1 (Loopback)
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true
    // :: (Unspecified)
    if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return true
    // fc00::/7 (Unique local)
    if (/^f[cd][0-9a-f]{2}:/i.test(lower)) return true
    // fe80::/10 (Link-local)
    if (/^fe[89ab][0-9a-f]:/i.test(lower)) return true
    // 2001:db8::/32 (Documentation)
    if (/^2001:db8:/i.test(lower)) return true

    return false
  }

  return true
}

/**
 * Validates a target hostname against DNS rebinding and private IP access.
 */
async function validateHostname(hostname: string): Promise<boolean> {
  const normalized = hostname.toLowerCase().trim()
  if (normalized === 'localhost' || normalized.endsWith('.local') || normalized.endsWith('.internal')) {
    return false
  }

  try {
    const results = await dns.lookup(normalized, { all: true })
    if (!results || results.length === 0) return false

    for (const record of results) {
      if (isRestrictedIP(record.address)) {
        return false
      }
    }
    return true
  } catch {
    return false
  }
}

/**
 * Follows HTTP redirects safely, validating the destination host at every hop.
 */
async function fetchSafeHtml(targetUrl: URL): Promise<string | null> {
  let currentUrl = targetUrl

  for (let hop = 0; hop < MAX_REDIRECTS; hop++) {
    const isValid = await validateHostname(currentUrl.hostname)
    if (!isValid) return null

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(currentUrl.toString(), {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })
    } catch {
      clearTimeout(timer)
      return null
    }

    clearTimeout(timer)

    // Handle redirects manually
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location')
      if (!location) return null

      try {
        currentUrl = new URL(location, currentUrl)
        if (!['http:', 'https:'].includes(currentUrl.protocol)) return null
        continue
      } catch {
        return null
      }
    }

    if (!response.ok) return null

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      return null
    }

    // Stream and enforce response size cap
    if (!response.body) return null
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let receivedBytes = 0

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) {
          receivedBytes += value.length
          if (receivedBytes > MAX_RESPONSE_SIZE) {
            await reader.cancel()
            return null
          }
          chunks.push(value)
        }
      }
    } catch {
      return null
    }

    const totalBuffer = new Uint8Array(receivedBytes)
    let offset = 0
    for (const chunk of chunks) {
      totalBuffer.set(chunk, offset)
      offset += chunk.length
    }

    return new TextDecoder('utf-8').decode(totalBuffer)
  }

  return null
}

/**
 * Extracts product metadata using JSON-LD, OpenGraph, microdata, and heuristic fallbacks.
 */
function extractProductData(html: string) {
  const $ = cheerio.load(html)

  let title: string | null = null
  let image: string | null = null
  let description: string | null = null
  let price: string | null = null
  let currency: string = 'USD'

  // Strategy 1: Schema.org Product JSON-LD
  $('script[type="application/ld+json"]').each((_, elem) => {
    try {
      const text = $(elem).text().trim()
      if (!text) return
      const json = JSON.parse(text)
      const graph = Array.isArray(json) ? json : json['@graph'] || [json]

      for (const item of graph) {
        if (item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product'))) {
          if (!title && item.name) title = String(item.name).trim()
          if (!description && item.description) description = String(item.description).trim()
          if (!image) {
            if (typeof item.image === 'string') image = item.image
            else if (Array.isArray(item.image) && item.image[0]) image = typeof item.image[0] === 'string' ? item.image[0] : item.image[0].url
            else if (item.image?.url) image = item.image.url
          }

          const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers
          if (offers && !price) {
            const rawPrice = offers.price ?? offers.lowPrice ?? offers.highPrice
            if (rawPrice !== undefined) {
              price = String(rawPrice).trim()
            }
            if (offers.priceCurrency) {
              currency = String(offers.priceCurrency).toUpperCase().trim()
            }
          }
        }
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  })

  // Strategy 2: OpenGraph & Twitter metadata
  if (!title) {
    title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text().trim() ||
      null
  }

  if (!image) {
    image =
      $('meta[property="og:image:secure_url"]').attr('content') ||
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('link[rel="image_src"]').attr('href') ||
      null
  }

  if (!description) {
    description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      null
  }

  // Strategy 3: OpenGraph & Schema price
  if (!price) {
    const ogPrice =
      $('meta[property="product:price:amount"]').attr('content') ||
      $('meta[property="og:price:amount"]').attr('content') ||
      $('meta[itemprop="price"]').attr('content') ||
      null

    if (ogPrice) {
      price = ogPrice.trim()
    }
  }

  const ogCurrency =
    $('meta[property="product:price:currency"]').attr('content') ||
    $('meta[property="og:price:currency"]').attr('content') ||
    $('meta[itemprop="priceCurrency"]').attr('content') ||
    null

  if (ogCurrency) {
    currency = ogCurrency.toUpperCase().trim()
  }

  // Sanitize title (remove redundant brand suffixes like " - Amazon.com")
  if (title) {
    title = title.replace(/\s*[|–—]\s*(Amazon\.com|Etsy|Target|Walmart|Best Buy|Shopify).*$/i, '').trim()
  }

  // Format display price
  let displayPrice: string | null = null
  if (price) {
    const numeric = parseFloat(price.replace(/[^0-9.]/g, ''))
    if (!isNaN(numeric) && numeric > 0) {
      const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', BDT: '৳', CAD: 'CA$', AUD: 'AU$' }
      const sym = symbols[currency] || `${currency} `
      displayPrice = `${sym}${numeric.toFixed(2)}`
    }
  }

  return {
    title,
    image,
    description: description ? description.slice(0, 300) : null,
    price,
    currency,
    displayPrice,
  }
}

export async function POST(req: Request) {
  try {
    // 1. IP-based rate limiting (protection against spam)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const now = Date.now()
    const rateData = rateLimitMap.get(ip)

    if (rateData) {
      if (now - rateData.timestamp < RATE_LIMIT_WINDOW) {
        if (rateData.count >= MAX_REQUESTS) {
          return NextResponse.json(
            { success: false, error: 'rate_limited', message: 'Too many requests. Please wait a minute.' },
            { status: 429 }
          )
        }
        rateData.count++
      } else {
        rateLimitMap.set(ip, { count: 1, timestamp: now })
      }
    } else {
      rateLimitMap.set(ip, { count: 1, timestamp: now })
    }

    // 2. Parse & validate request URL
    const body = await req.json()
    const { url } = body

    if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({
        success: false,
        error: 'invalid_url',
        message: 'Please provide a valid web URL starting with https:// or http://',
        title: null,
        image: null,
        description: null,
        price: null,
        currency: 'USD',
        displayPrice: null,
      })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({
        success: false,
        error: 'invalid_url',
        message: 'Malformed URL provided.',
        title: null,
        image: null,
        description: null,
        price: null,
        currency: 'USD',
        displayPrice: null,
      })
    }

    // 3. SSRF-safe fetch with streaming size cap
    const html = await fetchSafeHtml(parsedUrl)
    if (!html) {
      return NextResponse.json({
        success: false,
        error: 'scrape_fallback',
        message: 'Unable to auto-extract details from this store. You can enter the product information manually.',
        title: null,
        image: null,
        description: null,
        price: null,
        currency: 'USD',
        displayPrice: null,
      })
    }

    // 4. Extract rich product data
    const extracted = extractProductData(html)

    return NextResponse.json({
      success: true,
      ...extracted,
    })
  } catch {
    return NextResponse.json({
      success: false,
      error: 'server_error',
      message: 'Failed to extract metadata. You can enter details manually.',
      title: null,
      image: null,
      description: null,
      price: null,
      currency: 'USD',
      displayPrice: null,
    })
  }
}
