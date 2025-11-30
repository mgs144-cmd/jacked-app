/* eslint-disable react/no-unescaped-entities */
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default function TermsPage() {
  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-8">
          <h1 className="text-4xl font-black text-white mb-6">Terms & Conditions</h1>
          <p className="text-gray-400 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Agreement to Terms</h2>
              <p>
                By accessing and using <strong className="text-white">Jacked</strong> (the &quot;Service&quot;), operated by <strong className="text-white">Jacked</strong>, 
                you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Service Description</h2>
              <p>
                Jacked is a social fitness platform designed for the lifting community. The Service allows users to share workout posts, 
                track personal records, connect with other users, and participate in fitness challenges.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. User Accounts</h2>
              <p>
                To use the Service, you must create an account by providing accurate and complete information. You are responsible for 
                maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Payment Terms</h2>
              <p>
                Access to the Service requires a one-time onboarding fee of $0.99 USD. This fee is non-refundable except as required by law. 
                By making a payment, you agree to these payment terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. User Content</h2>
              <p>
                You retain ownership of any content you post on the Service. By posting content, you grant Jacked a worldwide, non-exclusive, 
                royalty-free license to use, display, and distribute your content on the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Prohibited Conduct</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Post content that is illegal, harmful, or violates any applicable laws</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Impersonate any person or entity</li>
                <li>Upload viruses or malicious code</li>
                <li>Attempt to gain unauthorized access to the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are owned by Jacked and are protected by international 
                copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Disclaimer of Warranties</h2>
              <p>
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without any warranties of any kind, either express or implied. 
                We do not warrant that the Service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">9. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Jacked shall not be liable for any indirect, incidental, special, consequential, 
                or punitive damages resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">10. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we 
                believe violates these Terms or is harmful to other users, us, or third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the new 
                Terms on this page. Your continued use of the Service after such changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">12. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us through the Service or at the contact information provided 
                in your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">13. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Jacked operates, 
                without regard to its conflict of law provisions.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

