import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://wishlink.me'),
  title: {
    default: 'Wishlink — Curate Everything. Keep Your Privacy.',
    template: '%s | Wishlink',
  },
  description:
    'Curate gifts from any boutique or store worldwide. Share your bespoke private link. Friends reserve gifts seamlessly with zero exposed personal addresses.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Wishlink',
    title: 'Wishlink — Curate Everything. Keep Your Privacy.',
    description:
      'Curate gifts from any boutique or store worldwide. Share your bespoke private link. Friends reserve gifts seamlessly with zero exposed personal addresses.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wishlink — Curate Everything. Keep Your Privacy.',
    description:
      'Curate gifts from any boutique or store worldwide. Share your bespoke private link. Friends reserve gifts seamlessly with zero exposed personal addresses.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-cotton text-ink antialiased selection:bg-blush/50 selection:text-ink min-h-screen">
        {children}
      </body>
    </html>
  )
}
