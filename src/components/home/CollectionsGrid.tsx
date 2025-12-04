"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";

const COLLECTIONS = [
  {
    id: "hoodies",
    title: "HOODIES",
    subtitle: "Essential Warmth",
    image: "/hoodie.png",
    count: 12,
  },
  {
    id: "outerwear",
    title: "OUTERWEAR",
    subtitle: "Urban Protection",
    image: "/outerwear.png",
    count: 8,
  },
  {
    id: "tees",
    title: "TEES",
    subtitle: "Daily Essentials",
    image: "/tees.png",
    count: 24,
  },
];

export default function CollectionsGrid() {
  return (
    <section className="py-20 md:py-32 bg-neutral-50">
      <div className="w-full px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
            SHOP BY <span className="font-bold">CATEGORY</span>
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Discover our curated collections designed for every moment
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {COLLECTIONS.map((collection, i) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <Link
                href={`/shop?category=${collection.title}`}
                className="group block relative aspect-[3/4] overflow-hidden rounded-2xl"
              >
                <Image
                  src={collection.image}
                  alt={collection.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-8">
                  <p className="text-white/60 text-sm tracking-wider mb-2">
                    {collection.count} items
                  </p>
                  <h3 className="text-white text-2xl md:text-3xl font-light tracking-wide mb-1">
                    {collection.title}
                  </h3>
                  <p className="text-white/80 text-sm">{collection.subtitle}</p>
                  <div className="mt-6 flex items-center gap-2 text-white text-sm tracking-wider opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                    <span>SHOP NOW</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
