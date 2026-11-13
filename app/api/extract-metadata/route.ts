import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import dns from 'dns/promises'
import { isRestrictedIP } from '@/lib/network-security.mjs'

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 25
const MAX_RESPONSE_SIZE = 2 * 1024 * 1024 // 2 MB
const FETCH_TIMEOUT_MS = 6000 // 6 seconds
const MAX_REDIRECTS = 3

const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

/**
 * Validates a target hostname against DNS rebinding and private IP access.
 */
async function validateHostname(hostname: string): Promise<boolean> {
  const normalized = hostname.toLowerCase().trim()
  if (normalized === 'localhost' || normalized.endsWith('.local') || normalized.endsWith('.internal')) {
    return false
  }

  try {
    const addresses = await dns.lookup(normalized, { all: true })
    if (!addresses || addresses.length === 0) {
      return false
    }

    for (const entry of addresses) {
      if (isRestrictedIP(entry.address)) {
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

/**
 * Validates whether an HTTP/HTTPS URL is safe to fetch (anti-SSRF, DNS resolution, valid protocol).
 */
async function isSafeUrl(rawUrl: string): Promise<{ valid: boolean; error?: string; parsedUrl?: URL }> {
  try {
    const parsed = new URL(rawUrl)

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are supported.' }
    }

    // Direct IP or Hostname checks
    const hostname = parsed.hostname.toLowerCase()

    // Block numeric or local patterns
    if (isRestrictedIP(hostname)) {
      return { valid: false, error: 'Target host is restricted or invalid.' }
    }

    const isDomainSafe = await validateHostname(hostname)
    if (!isDomainSafe) {
      return { valid: false, error: 'Domain resolves to a restricted or private address.' }
    }

    return { valid: true, parsedUrl: parsed }
  } catch {
    return { valid: false, error: 'Malformed URL provided.' }
  }
}

/**
 * Safely fetches HTML while following redirects with full re-validation at each hop.
 */
async function fetchSafeHtml(initialUrl: string): Promise<string> {
  let currentUrl = initialUrl
  let redirectsCount = 0

  while (redirectsCount <= MAX_REDIRECTS) {
    const safety = await isSafeUrl(currentUrl)
    if (!safety.valid || !safety.parsedUrl) {
      throw new Error(safety.error || 'Destination URL failed security validation.')
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual', // Enforce manual redirect handling to re-validate destination IP
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })
    } finally {
      clearTimeout(timer)
    }

    // Handle redirects manually
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) {
        throw new Error('Redirect returned with missing location header.')
      }

      // Resolve relative redirect against base URL
      currentUrl = new URL(location, currentUrl).toString()
      redirectsCount++
      continue
    }

    if (!response.ok) {
      throw new Error(`Failed to load URL (HTTP ${response.status})`)
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new Error('Target URL did not return HTML content.')
    }

    // Stream and enforce MAX_RESPONSE_SIZE
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Unable to read response body.')
    }

    const chunks: Uint8Array[] = []
    let totalBytes = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        totalBytes += value.length
        if (totalBytes > MAX_RESPONSE_SIZE) {
          reader.cancel()
          throw new Error('Response size exceeded 2MB limit.')
        }
        chunks.push(value)
      }
    }

    // Combine chunks
    const buffer = Buffer.concat(chunks)
    return buffer.toString('utf-8')
  }

  throw new Error('Too many redirects.')
}

export async function POST(req: Request) {
  // 1. IP Rate Limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'

  const now = Date.now()
  const rateData = rateLimitMap.get(ip)

  if (rateData && now - rateData.timestamp < RATE_LIMIT_WINDOW) {
    if (rateData.count >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before analyzing more links.' },
        { status: 429 }
      )
    }
    rateData.count++
  } else {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
  }

  // Periodic cleanup of stale rate limits
  if (rateLimitMap.size > 2000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (now - value.timestamp > RATE_LIMIT_WINDOW) {
        rateLimitMap.delete(key)
      }
    }
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body.url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required.' }, { status: 400 })
    }

    const targetUrl = body.url.trim()
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Invalid URL scheme. Must begin with http:// or https://' },
        { status: 400 }
      )
    }

    const html = await fetchSafeHtml(targetUrl)
    const $ = cheerio.load(html)

    // Meta extraction algorithms
    let title: string | null = null
    let image_url: string | null = null
    let price: string | null = null

    // 1. Extract Title
    title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      $('title').text().trim() ||
      null

    if (title) {
      // Clean up common store suffixes like " | Amazon", " - Nike Store"
      title = title.split(/\s*[-–—|]\s*(Amazon|eBay|Nike|Etsy|Walmart|Target|AliExpress)/i)[0].trim()
      if (title.length > 200) {
        title = title.slice(0, 200) + '...'
      }
    }

    // 2. Extract Image
    const rawImage =
      $('meta[property="og:image:secure_url"]').attr('content') ||
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[name="twitter:image:src"]').attr('content') ||
      $('link[rel="image_src"]').attr('href') ||
      null

    if (rawImage) {
      try {
        // Resolve relative image URLs against target URL
        const resolvedImage = new URL(rawImage, targetUrl).toString()
        if (resolvedImage.startsWith('http://') || resolvedImage.startsWith('https://')) {
          image_url = resolvedImage
        }
      } catch {
        image_url = null
      }
    }

    // Fallback: search DOM for primary product image if meta tags didn't provide one
    if (!image_url) {
      const imgCandidate =
        $('img#landingImage').attr('src') ||
        $('img[data-old-hires]').attr('data-old-hires') ||
        $('img[data-a-dynamic-image]').attr('src') ||
        $('img.product-image').attr('src') ||
        $('img[itemprop="image"]').attr('src')

      if (imgCandidate) {
        try {
          const resolved = new URL(imgCandidate, targetUrl).toString()
          if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
            image_url = resolved
          }
        } catch {
          // ignore
        }
      }
    }

    // 3. Extract Price
    let rawPrice =
      $('meta[property="product:price:amount"]').attr('content') ||
      $('meta[property="og:price:amount"]').attr('content') ||
      $('[itemprop="price"]').attr('content') ||
      $('[itemprop="price"]').text().trim() ||
      $('.priceToPay .a-price-whole').first().text().trim() ||
      $('.a-price .a-offscreen').first().text().trim() ||
      null

    const rawCurrency =
      $('meta[property="product:price:currency"]').attr('content') ||
      $('meta[property="og:price:currency"]').attr('content') ||
      $('[itemprop="priceCurrency"]').attr('content') ||
      ''

    if (rawPrice) {
      // Clean price string
      rawPrice = rawPrice.replace(/[^\d.,]/g, '').trim()
      if (rawPrice) {
        const currencySymbol = rawCurrency ? `${rawCurrency.toUpperCase()} ` : ''
        price = `${currencySymbol}${rawPrice}`
      }
    }

    // JSON-LD Structured Data Extraction (High-fidelity product schema fallback)
    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const text = $(elem).text()
        if (!text) return

        const json = JSON.parse(text)
        const items = Array.isArray(json) ? json : [json]

        for (const item of items) {
          if (
            item['@type'] === 'Product' ||
            item['@type'] === 'IndividualProduct' ||
            (Array.isArray(item['@type']) && item['@type'].includes('Product'))
          ) {
            if (!title && item.name) {
              title = String(item.name).trim()
            }
            if (!image_url && item.image) {
              const imgVal = Array.isArray(item.image) ? item.image[0] : item.image
              const imgStr = typeof imgVal === 'string' ? imgVal : imgVal?.url
              if (imgStr) {
                try {
                  image_url = new URL(imgStr, targetUrl).toString()
                } catch {
                  // ignore
                }
              }
            }
            if (!price && item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers
              if (offers && offers.price) {
                const cur = offers.priceCurrency ? `${offers.priceCurrency} ` : ''
                price = `${cur}${offers.price}`
              }
            }
          }
        }
      } catch {
        // Ignore unparseable JSON-LD blocks
      }
    })

    return NextResponse.json({
      title: title || '',
      image_url: image_url || '',
      price: price || '',
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json(
      { error: error?.message || 'Failed to extract product details from URL.' },
      { status: 422 }
    )
  }
}
