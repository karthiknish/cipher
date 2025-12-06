"use client";
import Link from "next/link";
import Image from "next/image";
import { motion, viewportAnimations } from "@/lib/motion";
import { ArrowRight } from "@phosphor-icons/react";

export default function EditorialBanner() {
  return (
    <section className="relative h-[70vh] md:h-[80vh] overflow-hidden">
      <Image
        src="/images/editorial_banner_1765006746120.png"
        alt="Editorial"
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 flex items-center justify-center text-center text-white px-4">
        <motion.div
          {...viewportAnimations.fadeUp}
        >
          <p className="text-sm tracking-[0.4em] mb-6 text-white/60">
            NEW ARRIVALS
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-light tracking-tight mb-8 leading-[1.1]">
            STEP INTO THE
            <br />
            <span className="font-bold">NEW SEASON</span>
          </h2>
          <Link
            href="/shop"
            className="group inline-flex items-center gap-3 bg-white text-black px-10 py-4 text-sm tracking-wider font-medium hover:bg-white/90 transition-all rounded-full"
          >
            DISCOVER
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
