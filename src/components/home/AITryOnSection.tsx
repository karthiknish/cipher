"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkle, Check } from "@phosphor-icons/react";

export default function AITryOnSection() {
  return (
    <section className="py-20 md:py-32 bg-black text-white overflow-hidden">
      <div className="w-full px-6 md:px-12">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
              <Play className="w-4 h-4" weight="fill" />
              <span className="text-sm tracking-wider">SEE IT IN ACTION</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-8 leading-[1.1]">
              TRY BEFORE
              <br />
              <span className="font-bold">YOU BUY</span>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-lg">
              Upload your photo and see how any piece looks on you.
              Our AI creates realistic virtual try-ons in seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/shop"
                className="group inline-flex items-center justify-center gap-3 bg-white text-black px-8 py-4 text-sm tracking-wider font-medium hover:bg-white/90 transition-all rounded-full"
              >
                TRY IT NOW
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="inline-flex items-center justify-center gap-3 border border-white/20 text-white px-8 py-4 text-sm tracking-wider hover:bg-white/10 transition-all rounded-full">
                <Play className="w-4 h-4" weight="fill" />
                WATCH DEMO
              </button>
            </div>

            <div className="flex items-center gap-6 mt-10 pt-10 border-t border-white/10">
              <div>
                <p className="text-2xl font-bold">95%</p>
                <p className="text-sm text-white/50">Accuracy Rate</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <p className="text-2xl font-bold">2 sec</p>
                <p className="text-sm text-white/50">Processing Time</p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <p className="text-2xl font-bold">50K+</p>
                <p className="text-sm text-white/50">Try-ons Daily</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-square bg-white/5 rounded-3xl flex items-center justify-center border border-white/10">
              <div className="text-center p-8">
                <div className="w-24 h-24 bg-white/10 mx-auto mb-6 rounded-full flex items-center justify-center">
                  <Sparkle className="w-10 h-10" weight="fill" />
                </div>
                <p className="text-white/60 text-sm tracking-wider mb-2">POWERED BY</p>
                <p className="text-xl font-medium">Gemini AI</p>
              </div>
            </div>
            
            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -right-4 bg-white text-black px-4 py-2 rounded-full text-sm font-medium shadow-lg"
            >
              ✨ AI-Powered
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-4 -left-4 bg-black text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg border border-white/20"
            >
              <Check className="w-4 h-4 inline mr-1" />
              Instant Results
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
