"use client";

import Link from "next/link";
import { motion } from "@/lib/motion";
import { House, MagnifyingGlass, ArrowLeft, Compass } from "@phosphor-icons/react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-lg">
        {/* Animated 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="relative inline-block">
            <span className="text-[150px] md:text-[200px] font-bold text-gray-100 leading-none select-none">
              404
            </span>
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ rotate: -10 }}
              animate={{ rotate: 10 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            >
              <Compass className="w-16 h-16 md:w-24 md:h-24 text-black" />
            </motion.div>
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-2xl md:text-3xl font-light tracking-tight mb-4">
            Lost in the void
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            The page you&apos;re looking for seems to have wandered off. 
            It might have been moved, deleted, or perhaps it never existed.
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition"
          >
            <House className="w-4 h-4" />
            GO HOME
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 border border-black px-8 py-4 text-sm tracking-wider font-medium hover:bg-black hover:text-white transition"
          >
            <MagnifyingGlass className="w-4 h-4" />
            BROWSE SHOP
          </Link>
        </motion.div>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Go back to previous page
          </button>
        </motion.div>

        {/* Decorative Element */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 flex justify-center gap-2"
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gray-200 rounded-full"
              animate={{ 
                scale: [1, 1.5, 1],
                backgroundColor: ["#e5e7eb", "#000", "#e5e7eb"]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                delay: i * 0.2 
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
