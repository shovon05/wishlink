import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import dns from 'dns/promises'
import { isRestrictedIP } from '@/lib/network-security.mjs'

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 50
const MAX_RESPONSE_SIZE = 4 * 1024 * 1024 // 4 MB
const FETCH_TIMEOUT_MS = 8000 // 8 seconds
const MAX_REDIRECTS = 4

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
 * Uses modern realistic browser user-agents and headers so major e-commerce platforms
 * (Amazon, Daraz, Walmart, Target, Ikea, Shopify) return their full product representation.
 */
async function fetchSafeHtml(initialUrl: string): Promise<{ html: string; status: number }> {
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
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
          'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0',
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

    // Stream and enforce MAX_RESPONSE_SIZE
    const reader = response.body?.getReader()
    if (!reader) {
      return { html: '', status: response.status }
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
          break
        }
        chunks.push(value)
      }
    }

    const buffer = Buffer.concat(chunks)
    return {
      html: buffer.toString('utf-8'),
      status: response.status,
    }
  }

  throw new Error('Too many redirects.')
}

/**
 * Extracts product metadata from URL and HTML with broad fallback chains
 * supporting Schema.org JSON-LD (@graph), OpenGraph, Twitter Cards, Microdata,
 * Store-specific JSON (Daraz, Lazada, Amazon, Shopify), and URL slug fallbacks.
 */
export async function POST(req: Request) {
  // 1. IP Rate Limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'

  const now = Date.now()
  const userRate = rateLimitMap.get(ip)

  if (userRate) {
    if (now - userRate.timestamp < RATE_LIMIT_WINDOW) {
      if (userRate.count >= MAX_REQUESTS) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please wait a moment before inspecting more links.' },
          { status: 429 }
        )
      }
      userRate.count++
    } else {
      rateLimitMap.set(ip, { count: 1, timestamp: now })
    }
  } else {
    rateLimitMap.set(ip, { count: 1, timestamp: now })
  }

  // Periodic cleanup of stale rate limits
  if (rateLimitMap.size > 1000) {
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

    let html = ''
    try {
      const fetched = await fetchSafeHtml(targetUrl)
      html = fetched.html
    } catch (fetchErr: unknown) {
      console.warn('Network fetch notice for URL:', targetUrl, fetchErr)
    }

    const $ = cheerio.load(html || '')

    // Meta extraction algorithms
    let title: string | null = null
    let image_url: string | null = null
    let price: string | null = null
    let currency: string = 'USD'

    // ----------------------------------------------------
    // 1. JSON-LD Structured Data Extraction (Highest Fidelity: Shopify, Ikea, Amazon, Walmart)
    // ----------------------------------------------------
    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const text = $(elem).text()
        if (!text) return

        const json = JSON.parse(text)
        const items = Array.isArray(json)
          ? json
          : json['@graph']
          ? Array.isArray(json['@graph'])
            ? json['@graph']
            : [json['@graph']]
          : [json]

        for (const item of items) {
          const typeStr = Array.isArray(item['@type']) ? item['@type'].join(' ') : String(item['@type'] || '')
          if (
            typeStr.includes('Product') ||
            typeStr.includes('IndividualProduct') ||
            typeStr.includes('ItemPage')
          ) {
            if (!title && item.name) {
              title = String(item.name).trim()
            }

            // Image from JSON-LD
            if (!image_url && item.image) {
              const imgVal = Array.isArray(item.image) ? item.image[0] : item.image
              if (typeof imgVal === 'string') {
                image_url = imgVal
              } else if (imgVal && typeof imgVal === 'object') {
                image_url = imgVal.contentUrl || imgVal.url || null
              }
            }

            // Price from JSON-LD offers
            if (!price && item.offers) {
              const offersList = Array.isArray(item.offers) ? item.offers : [item.offers]
              const offer = offersList[0]
              if (offer) {
                const rawOfferPrice = offer.price || offer.lowPrice || offer.highPrice
                if (rawOfferPrice) {
                  price = String(rawOfferPrice).trim()
                }
                if (offer.priceCurrency) {
                  currency = String(offer.priceCurrency).toUpperCase().trim()
                }
              }
            }
          }
        }
      } catch {
        // Ignore unparseable JSON-LD blocks
      }
    })

    // ----------------------------------------------------
    // 2. OpenGraph / Twitter Cards / Meta Tags
    // ----------------------------------------------------
    if (!title) {
      title =
        $('meta[property="og:title"]').attr('content') ||
        $('meta[name="twitter:title"]').attr('content') ||
        $('meta[property="product:title"]').attr('content') ||
        $('h1').first().text().trim() ||
        $('title').text().trim() ||
        null
    }

    if (!image_url) {
      const rawMetaImage =
        $('meta[property="og:image:secure_url"]').attr('content') ||
        $('meta[property="og:image"]').attr('content') ||
        $('meta[name="twitter:image"]').attr('content') ||
        $('meta[name="twitter:image:src"]').attr('content') ||
        $('meta[property="product:image"]').attr('content') ||
        $('link[rel="image_src"]').attr('href') ||
        null

      if (rawMetaImage) {
        image_url = rawMetaImage
      }
    }

    if (!price) {
      const rawPrice =
        $('meta[property="product:price:amount"]').attr('content') ||
        $('meta[property="og:price:amount"]').attr('content') ||
        $('[itemprop="price"]').attr('content') ||
        $('[itemprop="price"]').text().trim() ||
        $('.priceToPay .a-price-whole').first().text().trim() ||
        $('.a-price .a-offscreen').first().text().trim() ||
        $('.pdp-price').first().text().trim() ||
        $('[data-price]').attr('data-price') ||
        null

      const rawCurrency =
        $('meta[property="product:price:currency"]').attr('content') ||
        $('meta[property="og:price:currency"]').attr('content') ||
        $('[itemprop="priceCurrency"]').attr('content') ||
        null

      if (rawCurrency) {
        currency = rawCurrency.toUpperCase().trim()
      }
      if (rawPrice) {
        price = rawPrice
      }
    }

    // ----------------------------------------------------
    // 3. Embedded Script Scanning (Daraz / Lazada / Alibaba / SPA e-commerce)
    // ----------------------------------------------------
    if (!price || !image_url || !title) {
      $('script').each((_, elem) => {
        const text = $(elem).text()
        if (!text) return

        // Image in scripts
        if (!image_url) {
          const imgMatch =
            text.match(/"(?:mainImage|primaryImage|preview_image|productImage|image)":\s*"(https?:\\\/\\\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i) ||
            text.match(/"(?:mainImage|primaryImage|preview_image|productImage|image)":\s*"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i)
          if (imgMatch && imgMatch[1]) {
            image_url = imgMatch[1].replace(/\\\//g, '/')
          }
        }

        // Price in scripts
        if (!price) {
          const priceMatch =
            text.match(/"(?:salePrice|finalPrice|price|discountPrice)":\s*\{[^}]*"value":\s*([0-9.]+)/) ||
            text.match(/"(?:salePrice|finalPrice|price|discountPrice)":\s*"([0-9.]+)"/) ||
            text.match(/"priceAmount":\s*([0-9.]+)/)
          if (priceMatch && priceMatch[1]) {
            price = priceMatch[1]
          }
        }

        // Currency in scripts
        if (currency === 'USD') {
          const currMatch = text.match(/"currency":\s*"([A-Z]{3})"/) || text.match(/"priceCurrency":\s*"([A-Z]{3})"/)
          if (currMatch && currMatch[1]) {
            currency = currMatch[1].toUpperCase()
          }
        }
      })
    }

    // ----------------------------------------------------
    // 4. DOM Primary Image Fallback
    // ----------------------------------------------------
    if (!image_url) {
      const imgCandidate =
        $('img#landingImage').attr('src') ||
        $('img[data-old-hires]').attr('data-old-hires') ||
        $('img[data-a-dynamic-image]').attr('src') ||
        $('img.product-image').attr('src') ||
        $('img[itemprop="image"]').attr('src') ||
        $('.gallery-preview-panel__image').attr('src') ||
        $('img[src*="/products/"]').attr('src') ||
        $('img[src*="/product/"]').attr('src') ||
        $('img[src*="/storage/app/public/"]').attr('src')

      if (imgCandidate) {
        image_url = imgCandidate
      }
    }

    // ----------------------------------------------------
    // 5. URL Slug Fallback (When bot-protection prevents title extraction)
    // ----------------------------------------------------
    if (!title || title.toLowerCase() === 'error' || title.toLowerCase() === 'not found' || title.length < 3) {
      try {
        const parsed = new URL(targetUrl)
        const segments = parsed.pathname.split('/').filter(Boolean)
        const lastSegment = segments[segments.length - 1] || segments[segments.length - 2] || ''

        // Convert slug e.g. "remote-control-car-toy-stunt-rc-off-road-high-speed-kids-car-rechargeable-car-i347515220"
        const cleanSlug = lastSegment
          .replace(/[-_]i[0-9]+.*$/i, '') // remove Lazada/Daraz item IDs
          .replace(/\.html?$/i, '')
          .replace(/[-_]+/g, ' ')
          .trim()

        if (cleanSlug.length > 3) {
          title = cleanSlug
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        }
      } catch {
        // ignore
      }
    }

    // Clean up common store suffixes from title
    if (title) {
      title = title
        .split(/\s*[-–—|]\s*(Amazon|eBay|Nike|Etsy|Walmart|Target|AliExpress|Daraz|ePharma|IKEA)/i)[0]
        .trim()
      if (title.length > 250) {
        title = title.slice(0, 247) + '...'
      }
    }

    // Resolve relative image URLs against target URL
    if (image_url) {
      try {
        image_url = new URL(image_url, targetUrl).toString()
        if (!image_url.startsWith('http://') && !image_url.startsWith('https://')) {
          image_url = null
        }
      } catch {
        image_url = null
      }
    }

    // Clean and normalize price string
    let formattedPrice: string = ''
    if (price) {
      const cleaned = String(price).replace(/[^\d.,]/g, '').trim()
      if (cleaned) {
        formattedPrice = `${currency !== 'USD' ? `${currency} ` : ''}${cleaned}`
      }
    }

    return NextResponse.json({
      success: true,
      title: title || '',
      image_url: image_url || '',
      image: image_url || '', // Dual compatibility for frontend forms
      price: formattedPrice || '',
      displayPrice: formattedPrice || '',
      currency: currency || 'USD',
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to extract product details from URL.',
        title: '',
        image_url: '',
        image: '',
        price: '',
        currency: 'USD',
      },
      { status: 200 } // Return 200 with fallback defaults so the client form can prompt graceful manual entry
    )
  }
}
