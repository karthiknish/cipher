"use client";
import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "@/lib/motion";
import { ArrowRight, ArrowDown } from "@phosphor-icons/react";

export default function HeroSection() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={heroRef} className="relative h-screen w-full overflow-hidden">
      <motion.div style={{ y: heroY }} className="absolute inset-0">
        <div className="hidden md:block relative w-full h-full">
          <Image
            src="/hero.png"
            alt="Cipher Collection"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="block md:hidden relative w-full h-full">
          <Image
            src="/hero-mobile.png"
            alt="Cipher Collection"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      </motion.div>

      <motion.div
        style={{ opacity: heroOpacity }}
        className="relative z-10 h-full flex flex-col"
      >
        <div className="flex-1" />

        {/* Hero CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center text-white"
        >
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 px-10 py-4 bg-white text-black text-sm tracking-wider font-medium hover:bg-white/90 transition-all rounded-full"
          >
            SHOP NOW
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/60"
        >
          <span className="text-xs tracking-[0.3em]">SCROLL</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
