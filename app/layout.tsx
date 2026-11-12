import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Wishlink — Share What You Wish For',
    template: '%s | Wishlink'
  },
  description: 'Create a tactile, privacy-first wishlist. Share one link in your bio and receive gifts without leaking your private address.',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-cotton text-ink antialiased selection:bg-ribbon/15 selection:text-ribbon min-h-screen">
        {children}
      </body>
    </html>
  )
}
