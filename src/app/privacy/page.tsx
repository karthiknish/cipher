"use client";
import { motion } from "@/lib/motion";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-black text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-light tracking-tight"
          >
            PRIVACY POLICY
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 mt-4"
          >
            Last updated: November 30, 2025
          </motion.p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-12"
          >
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-medium mb-4">Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                At Cipher, we are committed to protecting your privacy and ensuring
                the security of your personal information. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you visit our website or make a purchase.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-xl font-medium mb-4">Information We Collect</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>We collect information that you provide directly to us, including:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Name, email address, and contact information</li>
                  <li>Billing and shipping addresses</li>
                  <li>Payment information (processed securely through our payment providers)</li>
                  <li>Order history and preferences</li>
                  <li>Communications with our customer service team</li>
                  <li>Account credentials if you create an account</li>
                </ul>
                <p className="mt-4">
                  We also automatically collect certain information when you visit our website,
                  including your IP address, browser type, operating system, and browsing behavior.
                </p>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-xl font-medium mb-4">How We Use Your Information</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Process and fulfill your orders</li>
                  <li>Communicate with you about your orders and account</li>
                  <li>Send promotional communications (with your consent)</li>
                  <li>Improve our website and services</li>
                  <li>Detect and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>
            </section>

            {/* Virtual Try-On Feature */}
            <section>
              <h2 className="text-xl font-medium mb-4">Virtual Try-On Feature</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Our AI-powered virtual try-on feature processes images you upload
                  to generate visualizations of how our products may look on you.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Images are processed in real-time and are not stored on our servers</li>
                  <li>We do not use your images for training AI models</li>
                  <li>Processing is handled securely through our AI service provider</li>
                  <li>You can download generated images for personal use only</li>
                </ul>
              </div>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-xl font-medium mb-4">Information Sharing</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>We may share your information with:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Service providers who assist in our operations (shipping, payment processing)</li>
                  <li>Analytics providers to help us understand website usage</li>
                  <li>Law enforcement when required by law</li>
                </ul>
                <p className="mt-4">
                  We do not sell your personal information to third parties.
                </p>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-xl font-medium mb-4">Cookies and Tracking</h2>
              <p className="text-gray-600 leading-relaxed">
                We use cookies and similar technologies to enhance your browsing
                experience, analyze website traffic, and personalize content.
                You can control cookie preferences through your browser settings.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-xl font-medium mb-4">Data Security</h2>
              <p className="text-gray-600 leading-relaxed">
                We implement appropriate technical and organizational measures
                to protect your personal information against unauthorized access,
                alteration, disclosure, or destruction. However, no method of
                transmission over the Internet is 100% secure.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-medium mb-4">Your Rights</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>Depending on your location, you may have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access the personal information we hold about you</li>
                  <li>Request correction of inaccurate information</li>
                  <li>Request deletion of your information</li>
                  <li>Opt out of marketing communications</li>
                  <li>Data portability</li>
                </ul>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-medium mb-4">Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about this Privacy Policy or our data
                practices, please contact us at:
              </p>
              <div className="mt-4 text-gray-600">
                <p>Email: privacy@cipher.com</p>
                <p>Address: 123 Street Style Ave, Los Angeles, CA 90001</p>
              </div>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-xl font-medium mb-4">Policy Updates</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of any changes by posting the new policy on this page
                and updating the "Last updated" date.
              </p>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
