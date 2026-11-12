import Link from 'next/link'
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Server, Key } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy',
  description: 'How Wishlink protects your residential shipping address, account data, and privacy.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-cotton py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Wishlink</span>
        </Link>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-spruce-light text-spruce text-xs font-semibold border border-spruce/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero Address Leak Guarantee</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-ink tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-muted">
            Last updated: November 2026 · Plain-English summary of how your privacy is guarded.
          </p>
        </div>

        {/* Content Body */}
        <div className="paper-tag rounded-3xl p-6 sm:p-10 space-y-8 text-sm leading-relaxed text-ink/80">
          
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-ink flex items-center gap-2">
              <EyeOff className="w-5 h-5 text-spruce" />
              1. Our Core Principle: Zero Public Addresses
            </h2>
            <p>
              Traditional baby registries and wedding registries post your home address to anyone on the internet.
              Wishlink was built specifically to solve this vulnerability.
            </p>
            <p>
              Your physical shipping destination is <strong>never displayed on your public wishlist profile</strong>, 
              never rendered in HTML metadata, and never accessible via anonymous API queries.
            </p>
          </section>

          <section className="space-y-3 border-t border-parchment pt-6">
            <h2 className="text-xl font-serif font-bold text-ink flex items-center gap-2">
              <Key className="w-5 h-5 text-ribbon" />
              2. Cryptographic Token Hashing & Address Access
            </h2>
            <p>
              When a friend reserves a gift on your wishlist, our server generates a high-entropy 256-bit cryptographically
              secure access token.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-muted">
              <li>
                <strong className="text-ink">Hashed Secret Storage:</strong> We only store a one-way cryptographic SHA-256 hash of the reservation secret in an isolated database schema.
              </li>
              <li>
                <strong className="text-ink">Fragment-Based URLs:</strong> Access tokens are passed via URL fragments (<code>#token=...</code>) so they are never transmitted in HTTP headers or recorded in proxy logs.
              </li>
              <li>
                <strong className="text-ink">Explicit Approval:</strong> Your address is only unlocked when you explicitly choose which address to share for that reservation, or when you opt into auto-sharing your designated default address.
              </li>
              <li>
                <strong className="text-ink">Auto-Revocation:</strong> When a reservation is completed, cancelled, or reaches its 14-day expiration window, the address linkage is permanently expunged.
              </li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-parchment pt-6">
            <h2 className="text-xl font-serif font-bold text-ink flex items-center gap-2">
              <Server className="w-5 h-5 text-ink" />
              3. Information We Collect
            </h2>
            <p>
              We only collect data strictly necessary to run the service:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-muted">
              <li><strong className="text-ink">Account Credentials:</strong> Email address for passkey or magic-link sign in, or your verified Google OAuth identity.</li>
              <li><strong className="text-ink">Profile Details:</strong> Your chosen public handle (@username) and display name.</li>
              <li><strong className="text-ink">Wishlist Catalog:</strong> Third-party product URLs, titles, images, and prices you add.</li>
              <li><strong className="text-ink">Delivery Addresses:</strong> Shipping addresses you enter. Stored encrypted and protected by Row Level Security (RLS).</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-parchment pt-6">
            <h2 className="text-xl font-serif font-bold text-ink flex items-center gap-2">
              <Lock className="w-5 h-5 text-spruce" />
              4. We Do Not Sell Your Data
            </h2>
            <p>
              We do not sell, rent, or trade your personal information, browsing behavior, or address data with third-party advertisers or data brokers. Ever.
            </p>
          </section>

          <section className="space-y-3 border-t border-parchment pt-6">
            <h2 className="text-xl font-serif font-bold text-ink">
              5. Your Rights & Deletion
            </h2>
            <p>
              You have the right to inspect, edit, or delete your addresses, items, and account at any time. When you remove an address or delete your registry, the data is purged immediately from active database tables.
            </p>
          </section>

          <section className="space-y-3 border-t border-parchment pt-6">
            <h2 className="text-xl font-serif font-bold text-ink">
              6. Contact Support
            </h2>
            <p className="text-xs sm:text-sm text-slate-muted">
              If you have privacy inquiries or security disclosures, reach out directly to{' '}
              <a href="mailto:privacy@wishlink.app" className="text-ribbon font-semibold hover:underline">
                privacy@wishlink.app
              </a>.
            </p>
          </section>

        </div>

      </div>
    </main>
  )
}

