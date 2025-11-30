"use client";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowDown, Truck, RotateCcw, ShieldCheck, CreditCard } from "lucide-react";
import { useRef } from "react";

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

const BESTSELLERS = [
  { id: "1", name: "Cipher Hoodie", price: 89, image: "https://placehold.co/600x750/1a1a1a/ffffff?text=HOODIE" },
  { id: "6", name: "Tactical Vest", price: 120, image: "https://placehold.co/600x750/1a1a1a/ffffff?text=VEST" },
  { id: "3", name: "Cargo Pants", price: 95, image: "https://placehold.co/600x750/1a1a1a/ffffff?text=CARGO" },
  { id: "2", name: "Street Tee", price: 45, image: "https://placehold.co/600x750/1a1a1a/ffffff?text=TEE" },
];

const SERVICE_FEATURES = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over $150" },
  { icon: RotateCcw, title: "Easy Returns", desc: "30-day return policy" },
  { icon: ShieldCheck, title: "Secure Payment", desc: "100% protected checkout" },
  { icon: CreditCard, title: "Flexible Payment", desc: "Multiple payment options" },
];

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="min-h-screen">
      {/* Hero Section - Full Screen Editorial */}
      <section ref={heroRef} className="relative h-screen w-full overflow-hidden">
        <motion.div style={{ y: heroY }} className="absolute inset-0">
          {/* Desktop Image */}
          <div className="hidden md:block relative w-full h-full">
            <Image
              src="/hero.png"
              alt="Cipher Collection"
              fill
              className="object-cover"
              priority
            />
          </div>
          {/* Mobile Image */}
          <div className="block md:hidden relative w-full h-full">
            <Image
              src="/hero-mobile.png"
              alt="Cipher Collection"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-black/10" />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 h-full flex flex-col"
        >
          {/* Hero Content Removed */}
          <div className="flex-1" />

          {/* Scroll Indicator */}
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

      {/* Service Bar */}
      <section className="bg-black text-white py-5 border-b border-white/10">
        <div className="w-full px-6 md:px-12">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-6 md:gap-4">
            {SERVICE_FEATURES.map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-sm text-white/70"
              >
                <feature.icon className="w-4 h-4" />
                <span className="tracking-wide">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="py-20 md:py-32 bg-white">
        <div className="w-full px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
              SHOP BY CATEGORY
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
                  className="group block relative aspect-[3/4] overflow-hidden"
                >
                  <Image
                    src={collection.image}
                    alt={collection.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
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

      {/* Bestsellers */}
      <section className="py-20 md:py-32 bg-neutral-50">
        <div className="w-full px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-3">
                BESTSELLERS
              </h2>
              <p className="text-gray-500">Our most loved pieces this season</p>
            </div>
            <Link
              href="/shop"
              className="group flex items-center gap-2 text-sm tracking-wider font-medium hover:gap-4 transition-all"
            >
              VIEW ALL
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {BESTSELLERS.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Link href={`/shop/${product.id}`} className="group block">
                  <div className="relative aspect-[4/5] mb-4 overflow-hidden bg-white">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="text-sm font-medium mb-1 group-hover:underline underline-offset-4">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500">${product.price}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Try-On Feature */}
      <section className="py-20 md:py-32 bg-black text-white">
        <div className="w-full px-6 md:px-12">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm tracking-[0.3em] text-white/50 mb-6">
                AI-POWERED
              </p>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-tight mb-8 leading-[1.1]">
                TRY BEFORE
                <br />
                <span className="font-bold">YOU BUY</span>
              </h2>
              <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-lg">
                Upload your photo and see how any piece looks on you.
                Our AI creates realistic virtual try-ons in seconds.
              </p>
              <Link
                href="/shop"
                className="group inline-flex items-center gap-3 bg-white text-black px-8 py-4 text-sm tracking-wider font-medium hover:bg-white/90 transition-all"
              >
                TRY IT NOW
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-white/40 text-sm mt-6">
                Available on all product pages
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="relative aspect-square bg-white/5 flex items-center justify-center"
            >
              <div className="absolute inset-0 border border-white/10" />
              <div className="text-center p-8">
                <div className="w-20 h-20 border border-white/20 mx-auto mb-6 flex items-center justify-center">
                  <div className="w-3 h-3 bg-white/60 rounded-full" />
                </div>
                <p className="text-white/40 text-sm tracking-wider">
                  POWERED BY GEMINI
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Editorial Banner */}
      <section className="relative h-[70vh] md:h-[80vh] overflow-hidden">
        <Image
          src="https://placehold.co/1920x1080/1a1a1a/ffffff?text="
          alt="Editorial"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 flex items-center justify-center text-center text-white px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
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
              className="group inline-flex items-center gap-3 bg-white text-black px-10 py-4 text-sm tracking-wider font-medium hover:bg-white/90 transition-all"
            >
              DISCOVER
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 md:py-32 bg-neutral-100">
        <div className="w-full px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
              STAY CONNECTED
            </h2>
            <p className="text-gray-500 mb-10">
              Subscribe for exclusive access to new drops, limited editions,
              and special offers.
            </p>
            <form className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-white border border-gray-200 text-black placeholder-gray-400 focus:outline-none focus:border-black transition text-sm"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-black text-white text-sm tracking-wider font-medium hover:bg-gray-900 transition"
              >
                SUBSCRIBE
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-6">
              By subscribing, you agree to our Privacy Policy
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
