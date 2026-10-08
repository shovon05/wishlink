import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import dns from 'dns/promises';

// --- Rate Limiter Setup ---
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;

function isPrivateIP(ip: string) {
  return /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(ip) || ip === '::1';
}

export async function POST(req: Request) {
  try {
    // ১. IP ভিত্তিক Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
    const now = Date.now();
    const rateData = rateLimitMap.get(ip);

    if (rateData) {
      if (now - rateData.timestamp < RATE_LIMIT_WINDOW) {
        if (rateData.count >= MAX_REQUESTS) {
          return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        }
        rateData.count++;
      } else {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, timestamp: now });
    }

    // ২. URL ভ্যালিডেশন
    const { url } = await req.json();

    if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ title: null, image: null, description: null });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ title: null, image: null, description: null });
    }

    // ৩. SSRF সুরক্ষা — hostname resolve করে প্রাইভেট IP ব্লক করা
    try {
      const { address } = await dns.lookup(parsedUrl.hostname);
      if (isPrivateIP(address) || parsedUrl.hostname === 'localhost') {
        return NextResponse.json({ title: null, image: null, description: null });
      }
    } catch {
      // DNS resolve ব্যর্থ হলে নিরাপদ থাকার জন্য রিকোয়েস্ট বাতিল
      return NextResponse.json({ title: null, image: null, description: null });
    }

    // ৪. Timeout সহ fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let html = '';
    try {
      const response = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json({ title: null, image: null, description: null });
      }
      html = await response.text();
    } catch {
      clearTimeout(timeoutId);
      return NextResponse.json({ title: null, image: null, description: null });
    }

    // ৫. cheerio দিয়ে Open Graph ট্যাগ পার্স করা
    const $ = cheerio.load(html);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      null;

    const image = $('meta[property="og:image"]').attr('content') || null;

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      null;

    return NextResponse.json({ title, image, description });
  } catch (err) {
    // যেকোনো অপ্রত্যাশিত এরর হলেও 200 স্ট্যাটাসে null রিটার্ন করবে
    return NextResponse.json({ title: null, image: null, description: null });
  }
}
