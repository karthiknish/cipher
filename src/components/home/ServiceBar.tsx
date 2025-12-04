"use client";
import { Truck, ArrowsClockwise, ShieldCheck, CreditCard } from "@phosphor-icons/react";

const SERVICE_FEATURES = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over $150" },
  { icon: ArrowsClockwise, title: "Easy Returns", desc: "30-day return policy" },
  { icon: ShieldCheck, title: "Secure Payment", desc: "100% protected checkout" },
  { icon: CreditCard, title: "Flexible Payment", desc: "Multiple payment options" },
];

export default function ServiceBar() {
  return (
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
  );
}
