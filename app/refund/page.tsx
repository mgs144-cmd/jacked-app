/* eslint-disable react/no-unescaped-entities */
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export default function RefundPage() {
  return (
    <div className="min-h-screen pb-20 md:pb-0 md:pt-24">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-8">
          <h1 className="text-4xl font-black text-white mb-6">Refund Policy</h1>
          <p className="text-gray-400 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Refund Eligibility</h2>
              <p>
                Jacked offers full refunds for the one-time onboarding fee of $0.99 USD. You may request a full refund at any time 
                for any reason. We are committed to ensuring customer satisfaction and will process all valid refund requests promptly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Refund Requests</h2>
              <p>
                To request a full refund, please contact us within 30 days of your payment date. Refund requests must include:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Your account email address</li>
                <li>Date of payment</li>
                <li>Reason for refund request (optional, but helpful)</li>
                <li>Payment transaction ID (if available)</li>
              </ul>
              <p className="mt-4">
                All refund requests will be processed in full, regardless of the reason. We want you to be completely satisfied with 
                your experience using Jacked.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Processing Time</h2>
              <p>
                We will process all refund requests within 5-10 business days. Refunds will be issued in full to the original payment 
                method used for the transaction. You will receive the complete $0.99 USD refund.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Account Termination</h2>
              <p>
                If a refund is issued, your account access will be terminated and you will no longer be able to use the Service. 
                You may create a new account in the future, but will be required to pay the onboarding fee again.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Chargebacks</h2>
              <p>
                If you initiate a chargeback or dispute with your payment provider, we reserve the right to immediately terminate 
                your account and may take additional action to recover costs associated with the chargeback.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Full Refund Guarantee</h2>
              <p>
                We guarantee full refunds for all requests made within 30 days of payment. There are no questions asked - if you are 
                not satisfied with Jacked for any reason, we will provide a complete refund of your $0.99 USD onboarding fee.
              </p>
              <p className="mt-4">
                This refund policy does not affect your statutory rights as a consumer. If you are located in a jurisdiction that 
                provides for mandatory refund rights (such as the European Union), those rights apply in addition to this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Contact for Refunds</h2>
              <p>
                To request a refund, please contact us through the Service or at the contact information provided in your account 
                settings. Please include &quot;Refund Request&quot; in your subject line.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Changes to Refund Policy</h2>
              <p>
                We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting 
                on this page. Your continued use of the Service after changes constitutes acceptance of the updated policy.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

