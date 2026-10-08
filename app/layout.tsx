import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Inter ফন্ট লোড করা হচ্ছে
const inter = Inter({ subsets: ['latin'] })

// গ্লোবাল মেটাডেটা কনফিগারেশন
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Wishlink - Share Your Wishlist',
    template: '%s | Wishlink'
  },
  description: 'Create a beautiful wishlist and let your friends reserve gifts for you effortlessly.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Wishlink',
  },
  twitter: {
    card: 'summary_large_image',
  }
}

// মূল লেআউট কম্পোনেন্ট
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
