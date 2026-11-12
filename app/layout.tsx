import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://wishlink-gamma.vercel.app'),
  title: {
    default: 'Wishlink — Everything you wish for. One private link.',
    template: '%s | Wishlink',
  },
  description:
    'Create your wishlist from any store. Share it with friends. Let them reserve gifts without ever exposing your home address.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Wishlink',
    title: 'Wishlink — Everything you wish for. One private link.',
    description:
      'Create your wishlist from any store. Share it with friends. Let them reserve gifts without ever exposing your home address.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wishlink — Everything you wish for. One private link.',
    description:
      'Create your wishlist from any store. Share it with friends. Let them reserve gifts without ever exposing your home address.',
  },
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
