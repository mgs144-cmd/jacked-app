import Link from 'next/link'
import type { Metadata } from 'next'
import { JackedLogo } from '@/components/JackedLogo'

export const metadata: Metadata = {
  title: 'Privacy Policy — JACKED',
  description: 'Privacy Policy for JACKED by Jacked Lifting.',
}

const LAST_UPDATED = 'September 8, 2026'

export default function PrivacyPolicyPage() {
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
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-white/50">Last updated: {LAST_UPDATED}</p>

        <div className="prose-legal mt-10 space-y-8 text-[15px] leading-relaxed text-white/75">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">1. Who we are</h2>
            <p>
              JACKED (“JACKED,” “we,” “us,” or “our”) is a strength-training and social fitness product
              operated in connection with <strong className="text-white/90">jackedlifting.com</strong>.
              This Privacy Policy explains how we collect, use, share, and protect information when you
              use our websites, web app, and related services (the “Services”).
            </p>
            <p>
              Contact:{' '}
              <a className="text-white underline underline-offset-2 hover:text-white/80" href="mailto:support@jackedlifting.com">
                support@jackedlifting.com
              </a>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">2. Information we collect</h2>
            <p>Depending on how you use JACKED, we may collect:</p>
            <ul className="list-disc space-y-2 pl-5 text-white/70">
              <li>
                <strong className="text-white/85">Account information</strong> — email, username, display
                name, password (hashed by our auth provider), profile photo, bio, and similar profile fields.
              </li>
              <li>
                <strong className="text-white/85">Training data</strong> — workouts, lifts, sets, reps,
                weight, RPE, goals, body weight entries, programs/templates, and related analytics you log.
              </li>
              <li>
                <strong className="text-white/85">Social content</strong> — posts, comments, likes, follows,
                group membership, messages or coach/insights chats you send in-product.
              </li>
              <li>
                <strong className="text-white/85">Wearable &amp; health integrations</strong> — if you connect
                a third party such as WHOOP or Oura, we may receive workout, strain, heart-rate summary, or
                similar metrics you authorize that provider to share. We store connection tokens and the
                resulting scores needed to show strain in JACKED (for example, Story templates).
              </li>
              <li>
                <strong className="text-white/85">Usage &amp; device data</strong> — IP address, browser type,
                approximate location derived from IP, pages viewed, and diagnostic logs needed to operate and
                secure the Services.
              </li>
              <li>
                <strong className="text-white/85">Payment data</strong> — if you purchase a subscription,
                payment processors (not JACKED) handle card details. We may receive limited billing status
                and transaction metadata.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">3. How we use information</h2>
            <ul className="list-disc space-y-2 pl-5 text-white/70">
              <li>Provide, maintain, and improve the Services (logging, feeds, groups, insights, strain).</li>
              <li>Authenticate accounts and prevent abuse, fraud, and security incidents.</li>
              <li>Personalize training insights and features you opt into.</li>
              <li>Communicate about the product, security notices, and (with consent where required) marketing.</li>
              <li>Comply with law and enforce our terms.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">4. How we share information</h2>
            <p>We do not sell your personal information. We may share information:</p>
            <ul className="list-disc space-y-2 pl-5 text-white/70">
              <li>
                <strong className="text-white/85">With other users</strong> — content you make public (or share
                with followers/groups) according to your privacy settings.
              </li>
              <li>
                <strong className="text-white/85">With service providers</strong> — hosting, authentication,
                databases, analytics, email, and payment processors that help us run JACKED under
                confidentiality obligations.
              </li>
              <li>
                <strong className="text-white/85">With wearable partners you connect</strong> — only as needed
                to complete OAuth and retrieve the data you authorize (e.g., WHOOP, Oura).
              </li>
              <li>
                <strong className="text-white/85">For legal reasons</strong> — if required by law, regulation,
                legal process, or to protect rights, safety, and security.
              </li>
              <li>
                <strong className="text-white/85">Business transfers</strong> — in connection with a merger,
                acquisition, or sale of assets, subject to appropriate protections.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">5. Wearable health data</h2>
            <p>
              If you link WHOOP, Oura, or a similar provider, you control that connection and can disconnect
              it in Settings. Disconnecting stops new syncs; you may request deletion of stored strain or
              related records by contacting us. Health-related metrics from wearables are used to power
              features you request (such as displaying strain) and are not sold.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">6. Your choices</h2>
            <ul className="list-disc space-y-2 pl-5 text-white/70">
              <li>Update profile and privacy settings in the app.</li>
              <li>Disconnect wearable integrations at any time.</li>
              <li>Request access, correction, or deletion of your account data by emailing support.</li>
              <li>Opt out of non-essential marketing emails via unsubscribe links where provided.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">7. Data retention</h2>
            <p>
              We retain account and training data while your account is active and for a reasonable period
              afterward as needed for backups, legal obligations, dispute resolution, and security. You may
              request deletion; some residual copies may remain in encrypted backups for a limited time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">8. Security</h2>
            <p>
              We use industry-standard measures (encryption in transit, access controls, and reputable
              infrastructure providers). No method of transmission or storage is 100% secure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">9. Children</h2>
            <p>
              JACKED is not directed to children under 13 (or the minimum age required in your region). We
              do not knowingly collect personal information from children. If you believe a child has
              provided information, contact us and we will take appropriate steps.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">10. International users</h2>
            <p>
              We may process information in the United States and other countries where our providers
              operate. By using the Services, you understand your information may be transferred to those
              locations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">11. Changes</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the updated version on this
              page and revise the “Last updated” date. Continued use of the Services after changes means
              you accept the updated Policy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">12. Contact</h2>
            <p>
              Questions about privacy:{' '}
              <a className="text-white underline underline-offset-2 hover:text-white/80" href="mailto:support@jackedlifting.com">
                support@jackedlifting.com
              </a>
              <br />
              Website:{' '}
              <a className="text-white underline underline-offset-2 hover:text-white/80" href="https://jackedlifting.com">
                https://jackedlifting.com
              </a>
            </p>
          </section>
        </div>

        <p className="mt-12 text-sm text-white/40">
          Also see{' '}
          <Link href="/terms" className="text-white/60 underline underline-offset-2 hover:text-white">
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </main>
    </div>
  )
}
