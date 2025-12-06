"use client";
import { motion, viewportAnimations, staggerDelay } from "@/lib/motion";
import { Sparkle, Brain, Trophy, ShieldCheck } from "@phosphor-icons/react";

const FEATURES = [
  {
    icon: Sparkle,
    title: "AI Virtual Try-On",
    description: "See how clothes look on you before buying with our AI-powered try-on feature",
  },
  {
    icon: Brain,
    title: "Smart Style Agent",
    description: "Get personalized outfit recommendations based on your mood and occasion",
  },
  {
    icon: Trophy,
    title: "Rewards Program",
    description: "Earn points with every purchase and unlock exclusive perks and discounts",
  },
  {
    icon: ShieldCheck,
    title: "Quality Guarantee",
    description: "Premium materials and craftsmanship backed by our quality promise",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 md:py-32 bg-white">
      <div className="w-full px-6 md:px-12">
        <motion.div
          {...viewportAnimations.fadeUp}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
            WHY CHOOSE <span className="font-bold">CIPHER</span>
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto">
            Experience the future of fashion with our innovative features
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={staggerDelay(i, 0.1)}
              className="text-center p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-medium mb-3">{feature.title}</h3>
              <p className="text-gray-500 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
