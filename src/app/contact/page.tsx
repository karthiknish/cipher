"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/context/ToastContext";
import { 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight, 
  Loader2, 
  Check
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "" });
    toast.success("Message sent successfully!");
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-black text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-4"
          >
            GET IN TOUCH
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 max-w-md mx-auto"
          >
            We are here to help with any questions
          </motion.p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-16 md:gap-24">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isSubmitted ? (
              <div className="bg-neutral-50 p-12 text-center">
                <div className="w-16 h-16 border border-black mx-auto mb-6 flex items-center justify-center">
                  <Check className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-light tracking-tight mb-4">MESSAGE SENT</h2>
                <p className="text-gray-500 mb-8">
                  Thank you for reaching out. We will get back to you within 24-48 hours.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-sm tracking-wider underline underline-offset-4 hover:no-underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-3">
                      YOUR NAME
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-0 py-3 border-0 border-b border-gray-200 focus:border-black focus:ring-0 outline-none transition bg-transparent"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-3">
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-0 py-3 border-0 border-b border-gray-200 focus:border-black focus:ring-0 outline-none transition bg-transparent"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs tracking-wider text-gray-500 mb-3">
                    SUBJECT
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-0 py-3 border-0 border-b border-gray-200 focus:border-black focus:ring-0 outline-none transition bg-transparent appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select a topic</option>
                    <option value="order">Order Inquiry</option>
                    <option value="product">Product Question</option>
                    <option value="returns">Returns and Exchanges</option>
                    <option value="collaboration">Collaboration</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs tracking-wider text-gray-500 mb-3">
                    MESSAGE
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-0 py-3 border-0 border-b border-gray-200 focus:border-black focus:ring-0 outline-none transition bg-transparent resize-none"
                    placeholder="How can we help?"
                    rows={4}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group inline-flex items-center gap-3 bg-black text-white px-10 py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> SENDING
                    </>
                  ) : (
                    <>
                      SEND MESSAGE
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-12"
          >
            <div>
              <h3 className="text-xs tracking-wider text-gray-500 mb-6">CONTACT INFO</h3>
              
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <Mail className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Email</p>
                    <a href="mailto:hello@cipher.com" className="text-gray-500 hover:text-black transition">
                      hello@cipher.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <Phone className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Phone</p>
                    <a href="tel:+1234567890" className="text-gray-500 hover:text-black transition">
                      +1 (234) 567-890
                    </a>
                    <p className="text-xs text-gray-400 mt-1">Mon-Fri, 9AM-6PM PST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium mb-1">Address</p>
                    <p className="text-gray-500">
                      123 Street Style Ave<br />
                      Los Angeles, CA 90001
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h3 className="text-xs tracking-wider text-gray-500 mb-6">FREQUENTLY ASKED</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">What are your shipping times?</h4>
                  <p className="text-sm text-gray-500">Standard shipping takes 5-7 business days. Express shipping (2-3 days) is available at checkout.</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">What is your return policy?</h4>
                  <p className="text-sm text-gray-500">We offer free returns within 30 days of purchase. Items must be unworn with tags attached.</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Do you ship internationally?</h4>
                  <p className="text-sm text-gray-500">Yes, we ship to over 50 countries. International shipping rates are calculated at checkout.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
