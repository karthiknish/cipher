"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence, viewportAnimations } from "@/lib/motion";
import { ArrowRight, Play, Sparkle, Check, Camera, TShirt, Lightning, Upload, User, MagicWand } from "@phosphor-icons/react";

// Demo showcase images - cycling through different try-on examples
const SHOWCASE_ITEMS = [
  {
    id: 1,
    before: "/images/products/tee-1.jpg",
    product: "Street Tee",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 2,
    before: "/images/products/hoodie-1.jpg",
    product: "Cipher Hoodie",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 3,
    before: "/images/products/jacket-1.jpg",
    product: "Tech Jacket",
    color: "from-orange-500 to-amber-500",
  },
];

const STEPS = [
  { icon: Upload, label: "Upload Photo", description: "Take or upload your image" },
  { icon: TShirt, label: "Select Item", description: "Choose any product" },
  { icon: MagicWand, label: "AI Magic", description: "Get instant results" },
];

export default function AITryOnSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Auto-cycle through showcase items
  useEffect(() => {
    if (isHovering) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SHOWCASE_ITEMS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovering]);

  const activeItem = SHOWCASE_ITEMS[activeIndex];

  return (
    <section className="py-20 md:py-32 bg-black text-white overflow-hidden relative">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-purple-900/20 via-transparent to-indigo-900/20 blur-3xl" />
      </div>

      <div className="w-full px-6 md:px-12 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center max-w-7xl mx-auto">
          {/* Left Content */}
          <motion.div {...viewportAnimations.fadeLeft}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full mb-6">
              <Sparkle className="w-4 h-4 text-purple-400" weight="fill" />
              <span className="text-sm tracking-wider text-purple-300">AI-POWERED TECHNOLOGY</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-6 leading-[1.1]">
              TRY BEFORE
              <br />
              <span className="font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                YOU BUY
              </span>
            </h2>
            
            <p className="text-white/60 text-lg leading-relaxed mb-8 max-w-lg">
              Upload your photo and see how any piece looks on you.
              Our AI creates realistic virtual try-ons in seconds.
            </p>

            {/* Steps */}
            <div className="grid grid-cols-3 gap-4 mb-10">
              {STEPS.map((step, index) => (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group hover:bg-white/10 transition-colors">
                    <step.icon className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-white mb-1">{step.label}</p>
                  <p className="text-xs text-white/40">{step.description}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link
                href="/shop"
                className="group inline-flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-4 text-sm tracking-wider font-medium transition-all rounded-full shadow-lg shadow-purple-500/25"
              >
                TRY IT NOW
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="inline-flex items-center justify-center gap-3 border border-white/20 text-white px-8 py-4 text-sm tracking-wider hover:bg-white/5 transition-all rounded-full">
                <Play className="w-4 h-4" weight="fill" />
                WATCH DEMO
              </button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 pt-8 border-t border-white/10">
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">95%</p>
                <p className="text-sm text-white/40">Accuracy Rate</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-indigo-400 bg-clip-text text-transparent">&lt;2s</p>
                <p className="text-sm text-white/40">Processing</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">50K+</p>
                <p className="text-sm text-white/40">Daily Try-ons</p>
              </div>
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            {...viewportAnimations.fadeRight}
            className="relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Main showcase card */}
            <div className="relative">
              {/* Glowing background */}
              <div className={`absolute inset-0 bg-gradient-to-r ${activeItem.color} opacity-20 blur-3xl rounded-3xl transform scale-110`} />
              
              {/* Main card */}
              <div className="relative aspect-[4/5] bg-gradient-to-br from-white/10 to-white/5 rounded-3xl border border-white/10 overflow-hidden backdrop-blur-sm">
                {/* Phone mockup frame */}
                <div className="absolute inset-4 bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden border border-white/5">
                  {/* Screen content */}
                  <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Sparkle className="w-5 h-5 text-purple-400" weight="fill" />
                        <span className="text-sm font-medium">Virtual Try-On</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-white/40">Live</span>
                      </div>
                    </div>

                    {/* Main visual area */}
                    <div className="flex-1 relative bg-gradient-to-br from-gray-800 to-gray-900 m-2 rounded-xl overflow-hidden">
                      {/* User silhouette placeholder */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative">
                          <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="w-32 h-40 bg-gradient-to-b from-white/10 to-white/5 rounded-t-full border border-white/10 flex items-end justify-center pb-4"
                          >
                            <User className="w-16 h-16 text-white/20" weight="thin" />
                          </motion.div>
                          
                          {/* Overlay effect - simulating try-on */}
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activeIndex}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 1.1 }}
                              transition={{ duration: 0.5 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <div className={`w-28 h-32 bg-gradient-to-r ${activeItem.color} opacity-30 rounded-lg blur-sm`} />
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Scanning effect */}
                      <motion.div
                        animate={{ y: ['-100%', '200%'] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"
                      />

                      {/* Corner decorations */}
                      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-purple-500/50" />
                      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-purple-500/50" />
                      <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-purple-500/50" />
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-purple-500/50" />
                    </div>

                    {/* Product selector */}
                    <div className="p-4 border-t border-white/5">
                      <div className="flex items-center gap-3">
                        {SHOWCASE_ITEMS.map((item, index) => (
                          <button
                            key={item.id}
                            onClick={() => setActiveIndex(index)}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                              index === activeIndex
                                ? `bg-gradient-to-r ${item.color} text-white`
                                : 'bg-white/5 text-white/50 hover:bg-white/10'
                            }`}
                          >
                            {item.product}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -right-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-5 py-3 rounded-2xl text-sm font-medium shadow-xl shadow-purple-500/30 flex items-center gap-2"
              >
                <Lightning className="w-4 h-4" weight="fill" />
                AI-Powered
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0], rotate: [0, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute -bottom-4 -left-4 bg-white text-black px-5 py-3 rounded-2xl text-sm font-medium shadow-xl flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-green-600" weight="bold" />
                Instant Results
              </motion.div>

              {/* Camera icon */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-1/2 -left-6 -translate-y-1/2 w-12 h-12 bg-black border border-white/20 rounded-full flex items-center justify-center shadow-xl"
              >
                <Camera className="w-5 h-5 text-white" />
              </motion.div>
            </div>

            {/* Powered by badge */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <span className="text-xs text-white/30 tracking-wider">POWERED BY</span>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <Sparkle className="w-4 h-4 text-blue-400" weight="fill" />
                <span className="text-sm font-medium">Gemini AI</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
