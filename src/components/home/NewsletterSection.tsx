"use client";
import { motion } from "framer-motion";
import { Sparkle } from "@phosphor-icons/react";

export default function NewsletterSection() {
  return (
    <section className="py-20 md:py-32 bg-neutral-900 text-white">
      <div className="w-full px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
            <Sparkle className="w-4 h-4" weight="fill" />
            <span className="text-sm tracking-wider">GET 10% OFF YOUR FIRST ORDER</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
            JOIN THE <span className="font-bold">CIPHER CLUB</span>
          </h2>
          <p className="text-white/60 mb-10">
            Subscribe for exclusive access to new drops, limited editions,
            and special offers.
          </p>
          <form className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition text-sm rounded-full"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-white text-black text-sm tracking-wider font-medium hover:bg-white/90 transition rounded-full"
            >
              SUBSCRIBE
            </button>
          </form>
          <p className="text-xs text-white/40 mt-6">
            By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
