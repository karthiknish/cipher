"use client";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence, viewportAnimations, staggerDelay, fadeInUp } from "@/lib/motion";
import { Quotes, Star } from "@phosphor-icons/react";

const TESTIMONIALS = [
  {
    id: 1,
    name: "Alex Chen",
    role: "Fashion Enthusiast",
    avatar: "/images/avatars/testimonial_avatar_1_1765006701076.png",
    text: "The quality of their hoodies is unmatched. I've never felt fabric this premium before. My go-to brand now!",
    rating: 5,
    product: "Cipher Hoodie",
  },
  {
    id: 2,
    name: "Jordan Lee",
    role: "Street Style Creator",
    avatar: "/images/avatars/testimonial_avatar_2_1765006714639.png",
    text: "Finally a brand that understands modern streetwear. The fit, the details, everything is perfect.",
    rating: 5,
    product: "Cargo Pants",
  },
  {
    id: 3,
    name: "Taylor Kim",
    role: "Creative Director",
    avatar: "/images/avatars/testimonial_avatar_3_1765006729470.png",
    text: "The AI try-on feature is game-changing. Saved me from so many wrong purchases. Love this brand!",
    rating: 5,
    product: "Tactical Vest",
  },
];

const STATS = [
  { value: "50K+", label: "Happy Customers" },
  { value: "4.9", label: "Average Rating" },
  { value: "98%", label: "Would Recommend" },
  { value: "24h", label: "Fast Shipping" },
];

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  
  return (
    <section className="py-20 md:py-32 bg-neutral-100">
      <div className="w-full px-6 md:px-12">
        <motion.div
          {...viewportAnimations.fadeUp}
          className="text-center mb-16"
        >
          <span className="text-sm tracking-[0.3em] text-gray-400 mb-4 block">WHAT PEOPLE SAY</span>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight">
            LOVED BY <span className="font-bold">THOUSANDS</span>
          </h2>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-16">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={staggerDelay(i, 0.1)}
              className="text-center"
            >
              <p className="text-4xl md:text-5xl font-bold mb-2">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Testimonials Carousel */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="bg-white p-8 md:p-12 rounded-2xl shadow-sm"
            >
              <Quotes className="w-12 h-12 text-gray-200 mb-6" weight="fill" />
              <p className="text-xl md:text-2xl font-light leading-relaxed mb-8">
                &ldquo;{TESTIMONIALS[activeIndex].text}&rdquo;
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                    <Image
                      src={TESTIMONIALS[activeIndex].avatar}
                      alt={TESTIMONIALS[activeIndex].name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{TESTIMONIALS[activeIndex].name}</p>
                    <p className="text-sm text-gray-500">{TESTIMONIALS[activeIndex].role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(TESTIMONIALS[activeIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400" weight="fill" />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {TESTIMONIALS.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeIndex ? "w-8 bg-black" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
