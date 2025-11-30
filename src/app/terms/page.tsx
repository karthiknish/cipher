"use client";
import { motion } from "framer-motion";

export default function TermsPage() {
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
            TERMS OF SERVICE
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
            {/* Agreement */}
            <section>
              <h2 className="text-xl font-medium mb-4">Agreement to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing or using the Cipher website and services, you agree
                to be bound by these Terms of Service. If you do not agree to
                these terms, please do not use our services.
              </p>
            </section>

            {/* Use of Services */}
            <section>
              <h2 className="text-xl font-medium mb-4">Use of Services</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Use the services in any way that violates applicable laws or regulations</li>
                  <li>Engage in any conduct that restricts or inhibits anyone's use of the services</li>
                  <li>Attempt to gain unauthorized access to any part of the services</li>
                  <li>Use any automated means to access the services without our permission</li>
                  <li>Impersonate any person or entity</li>
                </ul>
              </div>
            </section>

            {/* Accounts */}
            <section>
              <h2 className="text-xl font-medium mb-4">Account Registration</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  When you create an account, you must provide accurate and
                  complete information. You are responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Maintaining the confidentiality of your account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                </ul>
                <p className="mt-4">
                  We reserve the right to suspend or terminate accounts that
                  violate these terms.
                </p>
              </div>
            </section>

            {/* Products and Orders */}
            <section>
              <h2 className="text-xl font-medium mb-4">Products and Orders</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  All product descriptions, images, and prices are subject to
                  change without notice. We reserve the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Limit quantities available for purchase</li>
                  <li>Refuse or cancel orders at our discretion</li>
                  <li>Correct pricing errors</li>
                  <li>Discontinue products without notice</li>
                </ul>
                <p className="mt-4">
                  Product colors may vary slightly from images due to monitor
                  settings and photography.
                </p>
              </div>
            </section>

            {/* Pricing and Payment */}
            <section>
              <h2 className="text-xl font-medium mb-4">Pricing and Payment</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  All prices are displayed in USD and do not include applicable
                  taxes and shipping costs, which will be calculated at checkout.
                </p>
                <p>
                  We accept major credit cards and other payment methods as
                  indicated on our website. Payment must be received before
                  orders are processed.
                </p>
              </div>
            </section>

            {/* Shipping */}
            <section>
              <h2 className="text-xl font-medium mb-4">Shipping and Delivery</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  Shipping times are estimates and not guaranteed. We are not
                  responsible for delays caused by carriers, customs, or other
                  factors outside our control.
                </p>
                <p>
                  Risk of loss and title for items pass to you upon delivery to
                  the carrier.
                </p>
              </div>
            </section>

            {/* Returns */}
            <section>
              <h2 className="text-xl font-medium mb-4">Returns and Refunds</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>We accept returns within 30 days of delivery, subject to the following conditions:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Items must be unworn, unwashed, and in original condition</li>
                  <li>All original tags must be attached</li>
                  <li>Items must be returned in original packaging</li>
                  <li>Sale items may be final sale and non-returnable</li>
                </ul>
                <p className="mt-4">
                  Refunds will be processed to the original payment method within
                  5-10 business days of receiving the return.
                </p>
              </div>
            </section>

            {/* Virtual Try-On */}
            <section>
              <h2 className="text-xl font-medium mb-4">Virtual Try-On Service</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>The virtual try-on feature is provided for informational purposes only:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Generated images are approximations and may not reflect exact product appearance</li>
                  <li>Results depend on image quality and may vary</li>
                  <li>We are not responsible for purchase decisions based on virtual try-on results</li>
                  <li>You retain ownership of images you upload; we do not store them</li>
                  <li>Generated images are for personal, non-commercial use only</li>
                </ul>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-medium mb-4">Intellectual Property</h2>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  All content on this website, including text, graphics, logos,
                  images, and software, is the property of Cipher or its content
                  suppliers and is protected by intellectual property laws.
                </p>
                <p>
                  You may not reproduce, distribute, modify, or create derivative
                  works from any content without our express written permission.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-medium mb-4">Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                To the maximum extent permitted by law, Cipher shall not be
                liable for any indirect, incidental, special, consequential, or
                punitive damages arising from your use of our services. Our
                total liability shall not exceed the amount you paid for the
                products or services in question.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-xl font-medium mb-4">Indemnification</h2>
              <p className="text-gray-600 leading-relaxed">
                You agree to indemnify and hold Cipher harmless from any claims,
                damages, losses, or expenses arising from your violation of
                these Terms or your use of our services.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-xl font-medium mb-4">Governing Law</h2>
              <p className="text-gray-600 leading-relaxed">
                These Terms shall be governed by and construed in accordance
                with the laws of the State of California, without regard to its
                conflict of law provisions.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-xl font-medium mb-4">Changes to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                We reserve the right to modify these Terms at any time. Changes
                will be effective immediately upon posting on this page. Your
                continued use of our services after changes constitutes
                acceptance of the modified Terms.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-medium mb-4">Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about these Terms of Service, please
                contact us at:
              </p>
              <div className="mt-4 text-gray-600">
                <p>Email: legal@cipher.com</p>
                <p>Address: 123 Street Style Ave, Los Angeles, CA 90001</p>
              </div>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
