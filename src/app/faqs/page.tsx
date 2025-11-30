"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    category: "Orders & Shipping",
    questions: [
      {
        q: "How long does shipping take?",
        a: "Standard shipping takes 5-7 business days within the US. Express shipping (2-3 business days) is available at checkout. International orders typically arrive within 10-14 business days.",
      },
      {
        q: "Do you offer free shipping?",
        a: "Yes! We offer free standard shipping on all orders over $150. Orders under $150 have a flat rate shipping fee of $8.",
      },
      {
        q: "Can I track my order?",
        a: "Absolutely. Once your order ships, you'll receive an email with tracking information. You can also track your order by logging into your account and visiting the Orders page.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes, we ship to most countries worldwide. International shipping rates and delivery times vary by location. Customs duties and taxes may apply and are the responsibility of the customer.",
      },
    ],
  },
  {
    category: "Returns & Exchanges",
    questions: [
      {
        q: "What is your return policy?",
        a: "We offer a 30-day return policy for unworn items with original tags attached. Items must be in their original condition. Sale items are final sale and cannot be returned.",
      },
      {
        q: "How do I initiate a return?",
        a: "Log into your account, go to your Orders page, and select the item you wish to return. Follow the prompts to generate a return label. You can also contact our support team for assistance.",
      },
      {
        q: "How long do refunds take?",
        a: "Once we receive your return, please allow 5-7 business days for inspection and processing. Refunds are issued to the original payment method and may take an additional 3-5 business days to appear.",
      },
      {
        q: "Can I exchange an item for a different size?",
        a: "Yes! For exchanges, please initiate a return for the original item and place a new order for the desired size. This ensures you get your new item as quickly as possible.",
      },
    ],
  },
  {
    category: "Products & Sizing",
    questions: [
      {
        q: "How do I find my size?",
        a: "Visit our Size Guide page for detailed measurements for all our products. We recommend measuring a garment you already own and comparing it to our size charts for the best fit.",
      },
      {
        q: "What materials do you use?",
        a: "We use premium materials including heavyweight cotton, organic fabrics, and technical performance blends. Each product page lists specific materials and care instructions.",
      },
      {
        q: "How should I care for my Cipher items?",
        a: "We recommend washing in cold water, inside out, with like colors. Tumble dry low or hang dry. Avoid bleach and ironing directly on prints. Check individual product tags for specific care instructions.",
      },
      {
        q: "What is the AI Virtual Try-On feature?",
        a: "Our AI-powered virtual try-on lets you upload a photo and see how items look on you before purchasing. It's available on all product pages — just click 'Virtual Try-On' and upload your image.",
      },
    ],
  },
  {
    category: "Account & Payment",
    questions: [
      {
        q: "Do I need an account to place an order?",
        a: "While you can browse our shop without an account, you'll need to create one to complete a purchase. This allows you to track orders, save favorites, and access exclusive member benefits.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, and Google Pay. All transactions are secured with industry-standard encryption.",
      },
      {
        q: "Is my payment information secure?",
        a: "Absolutely. We use SSL encryption and never store your full payment details on our servers. All transactions are processed through secure, PCI-compliant payment providers.",
      },
      {
        q: "How do I reset my password?",
        a: "Click 'Login' in the navigation, then select 'Forgot Password'. Enter your email address and we'll send you a link to reset your password.",
      },
    ],
  },
  {
    category: "General",
    questions: [
      {
        q: "Where is Cipher based?",
        a: "Cipher is headquartered in Los Angeles, California. Our designs are created in-house and we work with ethical manufacturing partners to produce our collections.",
      },
      {
        q: "Do you have physical stores?",
        a: "Currently, Cipher is exclusively online. This allows us to offer premium quality at better prices by eliminating traditional retail markups. Stay tuned for pop-up events in select cities.",
      },
      {
        q: "How can I contact customer support?",
        a: "You can reach us via our Contact page, email at support@cipher.com, or through our social media channels. Our team typically responds within 24 hours on business days.",
      },
      {
        q: "Do you offer gift cards?",
        a: "Yes! Digital gift cards are available in denominations of $25, $50, $100, and $200. They're delivered via email and never expire.",
      },
    ],
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex justify-between items-center text-left hover:opacity-70 transition-opacity"
      >
        <span className="text-sm md:text-base font-medium pr-8">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-gray-600 text-sm md:text-base leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="py-16 md:py-24 border-b border-gray-100">
        <div className="w-full px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-6">
              FREQUENTLY ASKED
              <br />
              <span className="font-bold">QUESTIONS</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Find answers to common questions about orders, shipping, returns, and more.
              Can&apos;t find what you&apos;re looking for? Contact our support team.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16 md:py-24">
        <div className="w-full px-6 md:px-12">
          <div className="max-w-4xl mx-auto">
            {FAQS.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                className="mb-16 last:mb-0"
              >
                <h2 className="text-xs tracking-[0.2em] text-gray-500 mb-6 pb-4 border-b border-gray-200">
                  {category.category.toUpperCase()}
                </h2>
                <div>
                  {category.questions.map((faq, index) => (
                    <FAQItem key={index} question={faq.q} answer={faq.a} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 md:py-24 bg-neutral-50">
        <div className="w-full px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-4">
              STILL HAVE QUESTIONS?
            </h2>
            <p className="text-gray-600 mb-8">
              Our support team is here to help. Reach out and we&apos;ll get back to you within 24 hours.
            </p>
            <a
              href="/contact"
              className="inline-block bg-black text-white px-10 py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition"
            >
              CONTACT US
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
