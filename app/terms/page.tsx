import Link from 'next/link'
import { ArrowLeft, CheckCircle2, FileText, AlertTriangle, Scale } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using the Wishlink registry platform.',
}

export default function TermsOfServicePage() {
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-parchment-light text-ink text-xs font-semibold border border-parchment">
            <Scale className="w-3.5 h-3.5 text-ribbon" />
            <span>Usage Terms</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-ink tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-muted">
            Last updated: November 2026 · Simple, transparent rules for using Wishlink.
          </p>
        </div>

        {/* Content Body */}
        <div className="paper-tag rounded-3xl p-6 sm:p-10 space-y-8 text-sm leading-relaxed text-ink/80">
          
          <section className="space-y-3">
            <h2 className="text-xl font-serif font-bold text-ink flex items-center gap-2">
              <FileText className="w-5 h-5 text-ribbon" />
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Wishlink (&quot;the Service&quot;), you agree to be bound by these Terms of Service. 
              If you do not agree to all terms, please do not use the application.
            </p>
          </section>

          <section className="space-y-3 border-t border-parchment pt-6">
            <h2 className="text-xl font-serif font-bold text-ink flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-spruce" />
              2. Wishlink Service Description
            </h2>
            <p>
              Wishlink provides a universal registry platform that allows users to organize items from online stores,
              share links with family and friends, reserve gifts to prevent duplicates, and safely share shipping 
              destinations without publicly exposing residential addresses.
            </p>
            <p>
              Wishlink is <strong>not a direct merchant, retailer, or payment processor</strong>. Actual product purchases
              take place directly on the third-party merchant sites (e.g., Amazon, Etsy, Target, individual boutiques).
            </p>
          </section>

          <section className="space-y-3 border-t border-parchment pt-6">
            <h2 className="text-xl font-serif font-bold text-ink">
              3. User Responsibilities & Acceptable Use
            </h2>
            <p>When using Wishlink, you agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-muted">
              <li>List prohibited, illegal, dangerous, or restricted goods or services.</li>
              <li>Attempt to scrape, brute-force, or enumerate private access tokens or other users&apos; delivery addresses.</li>
              <li>Grief or maliciously lock registries through automated or spam reservations.</li>
              <li>Impersonate individuals or organizations without authorization.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-parchment pt-6">
            <h2 className="text-xl font-serif font-bold text-ink flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              4. Third-Party Products & Disclaimers
            </h2>
            <p>
              We make every effort to extract accurate titles, photos, and prices from product links. However, third-party merchants
              frequently adjust prices, stock availability, and shipping terms. Wishlink does not guarantee the availability, 
              pricing accuracy, or quality of items purchased from external retailers.
            </p>
          </section>

          <section className="space-y-3 border-t border-parchment pt-6">
            <h2 className="text-xl font-serif font-bold text-ink">
              5. Account Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms, engage in abusive behavior, or attempt to compromise the security or privacy of other members.
            </p>
          </section>

          <section className="space-y-3 border-t border-parchment pt-6">
            <h2 className="text-xl font-serif font-bold text-ink">
              6. Contact Us
            </h2>
            <p className="text-xs sm:text-sm text-slate-muted">
              Questions regarding these Terms of Service may be sent to{' '}
              <a href="mailto:support@wishlink.app" className="text-ribbon font-semibold hover:underline">
                support@wishlink.app
              </a>.
            </p>
          </section>

        </div>

      </div>
    </main>
  )
}

