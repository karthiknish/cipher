"use client";

import { useState } from "react";
import { motion, viewportAnimations } from "@/lib/motion";
import { Sparkle, Check, SpinnerGap, Warning } from "@phosphor-icons/react";
import { useNewsletter } from "@/context/NewsletterContext";

export default function NewsletterSection() {
  const { subscribe } = useNewsletter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setStatus("loading");
    const result = await subscribe(email.trim(), "homepage");
    
    if (result.success) {
      setStatus("success");
      setMessage(result.message);
      setEmail("");
    } else {
      setStatus("error");
      setMessage(result.message);
    }

    // Reset status after delay
    setTimeout(() => {
      if (status !== "idle") setStatus("idle");
    }, 5000);
  };

  return (
    <section className="py-20 md:py-32 bg-neutral-900 text-white">
      <div className="w-full px-6 md:px-12">
        <motion.div
          {...viewportAnimations.fadeUp}
          className="max-w-2xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
            <Sparkle className="w-4 h-4" weight="fill" />
            <span className="text-sm tracking-wider">GET 10% OFF YOUR FIRST ORDER</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
            JOIN THE <span className="font-bold">CIPHER CLUB</span>
          </h2>
          <p className="text-white/60 mb-10">
            Subscribe for exclusive access to new drops, limited editions,
            and special offers.
          </p>
          
          {status === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/20 border border-green-500/30 p-6 rounded-xl"
            >
              <Check className="w-10 h-10 text-green-400 mx-auto mb-3" weight="bold" />
              <p className="text-green-300 font-medium">{message}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={status === "loading"}
                className="flex-1 px-6 py-4 bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition text-sm rounded-full disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={status === "loading" || !email.trim()}
                className="px-8 py-4 bg-white text-black text-sm tracking-wider font-medium hover:bg-white/90 transition rounded-full disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <SpinnerGap className="w-4 h-4 animate-spin" />
                    SUBSCRIBING...
                  </>
                ) : (
                  "SUBSCRIBE"
                )}
              </button>
            </form>
          )}
          
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 mt-4 text-red-400"
            >
              <Warning className="w-4 h-4" />
              <span className="text-sm">{message}</span>
            </motion.div>
          )}
          
          <p className="text-xs text-white/40 mt-6">
            By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
