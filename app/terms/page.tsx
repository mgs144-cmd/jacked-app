import Link from 'next/link'
import type { Metadata } from 'next'
import { JackedLogo } from '@/components/JackedLogo'

export const metadata: Metadata = {
  title: 'Terms of Service — JACKED',
  description: 'Terms of Service for JACKED by Jacked Lifting.',
}

const LAST_UPDATED = 'September 8, 2026'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="opacity-90 hover:opacity-100">
            <JackedLogo size="compact" />
          </Link>
          <Link href="/auth/login" className="text-sm text-white/60 hover:text-white">
            Log in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 md:py-14">
        <p className="text-xs uppercase tracking-[0.14em] text-white/40">Legal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Terms of Service</h1>
        <p className="mt-3 text-sm text-white/50">Last updated: {LAST_UPDATED}</p>

        <div className="prose-legal mt-10 space-y-8 text-[15px] leading-relaxed text-white/75">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">1. Agreement</h2>
            <p>
              These Terms of Service (“Terms”) govern your access to and use of JACKED, including the
              website at <strong className="text-white/90">jackedlifting.com</strong>, the web app, and
              related services (the “Services”) operated by Jacked Lifting (“JACKED,” “we,” “us,” or “our”).
            </p>
            <p>
              By creating an account or using the Services, you agree to these Terms and our{' '}
              <Link href="/privacy" className="text-white underline underline-offset-2 hover:text-white/80">
                Privacy Policy
              </Link>
              . If you do not agree, do not use the Services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">2. The Services</h2>
            <p>
              JACKED is a strength-training and social fitness product. Features may include workout
              logging, progress tracking, community feeds and groups, insights, and optional connections
              to third-party wearables (such as WHOOP or Oura). We may add, change, or remove features at
              any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">3. Eligibility</h2>
            <p>
              You must be at least 13 years old (or the minimum age required in your jurisdiction) to use
              the Services. If you use the Services on behalf of an organization, you represent that you
              have authority to bind that organization to these Terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">4. Accounts</h2>
            <ul className="list-disc space-y-2 pl-5 text-white/70">
              <li>You are responsible for your account credentials and for activity under your account.</li>
              <li>Provide accurate registration information and keep it up to date.</li>
              <li>Notify us promptly at support@jackedlifting.com if you suspect unauthorized access.</li>
              <li>We may suspend or terminate accounts that violate these Terms or create risk for other users.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">5. Acceptable use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc space-y-2 pl-5 text-white/70">
              <li>Harass, abuse, threaten, or impersonate others.</li>
              <li>Post illegal, pornographic, or otherwise prohibited content.</li>
              <li>Scrape, reverse engineer, or overload the Services except as allowed by law.</li>
              <li>Circumvent security, access controls, or usage limits.</li>
              <li>Use the Services to spam, phish, or distribute malware.</li>
              <li>Misrepresent health, medical, or wearable data in a way intended to deceive others.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">6. User content</h2>
            <p>
              You retain ownership of content you submit (workouts, posts, comments, photos, messages, and
              similar). You grant JACKED a worldwide, non-exclusive, royalty-free license to host, store,
              display, and distribute that content as needed to operate and improve the Services and as
              directed by your privacy settings.
            </p>
            <p>
              You are responsible for your content and confirm you have the rights to share it. We may
              remove content that violates these Terms or applicable law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">7. Wearables &amp; third-party services</h2>
            <p>
              If you connect WHOOP, Oura, or another third party, their terms and privacy policies also
              apply. You authorize us to retrieve the data those services make available under the
              permissions you grant. We are not responsible for third-party outages, data accuracy, or
              changes to their APIs. You can disconnect integrations in Settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">8. Not medical advice</h2>
            <p>
              JACKED provides fitness logging and related tools for informational purposes only. It is not
              medical advice, diagnosis, or treatment. Consult a qualified professional before starting or
              changing an exercise program, especially if you have a medical condition. Strain, heart-rate,
              and similar metrics from wearables are estimates and may be incomplete or delayed.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">9. Subscriptions &amp; payments</h2>
            <p>
              Some features may require payment. Prices, billing intervals, and refund rules (if any) will
              be shown at purchase. Payments are processed by third-party processors. Except where required
              by law or stated otherwise in a refund policy, fees are non-refundable.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">10. Intellectual property</h2>
            <p>
              The Services, including branding, software, design, and documentation, are owned by JACKED or
              our licensors. These Terms do not grant you any ownership interest in the Services beyond the
              limited right to use them as allowed here.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">11. Disclaimers</h2>
            <p>
              THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, WHETHER
              EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
              NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR
              SECURE.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">12. Limitation of liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, JACKED AND ITS AFFILIATES WILL NOT BE LIABLE FOR
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
              DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICES. OUR TOTAL LIABILITY FOR ANY CLAIM
              ARISING OUT OF THESE TERMS OR THE SERVICES WILL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU
              PAID US FOR THE SERVICES IN THE TWELVE MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED U.S. DOLLARS
              ($100).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">13. Indemnity</h2>
            <p>
              You agree to defend and indemnify JACKED and its affiliates against claims, damages, and
              expenses (including reasonable attorneys’ fees) arising from your content, your use of the
              Services, or your violation of these Terms or applicable law.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">14. Termination</h2>
            <p>
              You may stop using the Services at any time. We may suspend or terminate access if you violate
              these Terms or if we discontinue the Services. Provisions that by their nature should survive
              (including ownership, disclaimers, liability limits, and indemnity) will survive termination.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">15. Changes</h2>
            <p>
              We may update these Terms by posting a revised version on this page and updating the “Last
              updated” date. Continued use after changes become effective constitutes acceptance. If you do
              not agree, stop using the Services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">16. Governing law</h2>
            <p>
              These Terms are governed by the laws of the United States and the State of Delaware,
              excluding conflict-of-law rules, unless mandatory local consumer law provides otherwise.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">17. Contact</h2>
            <p>
              Questions about these Terms:{' '}
              <a
                className="text-white underline underline-offset-2 hover:text-white/80"
                href="mailto:support@jackedlifting.com"
              >
                support@jackedlifting.com
              </a>
              <br />
              Website:{' '}
              <a
                className="text-white underline underline-offset-2 hover:text-white/80"
                href="https://jackedlifting.com"
              >
                https://jackedlifting.com
              </a>
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-white/40">
          Also see{' '}
          <Link href="/privacy" className="text-white/60 underline underline-offset-2 hover:text-white">
            Privacy Policy
          </Link>
          .
        </p>
      </main>
    </div>
  )
}
