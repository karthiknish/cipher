"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "@/lib/motion";
import Link from "next/link";
import {
  InstagramLogo,
  TiktokLogo,
  YoutubeLogo,
  CheckCircle,
  ArrowRight,
  SpinnerGap,
  Star,
  CurrencyDollar,
  Users,
  ShoppingBag,
  Broadcast,
  Lightning,
} from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { useInfluencer } from "@/context/InfluencerContext";
import { useToast } from "@/context/ToastContext";

const TIER_BENEFITS = [
  {
    tier: "Bronze",
    commission: "10%",
    requirements: "Entry level",
    benefits: ["Custom storefront", "Referral tracking", "Basic analytics"],
  },
  {
    tier: "Silver",
    commission: "12%",
    requirements: "50+ sales",
    benefits: ["Priority support", "Featured placement", "Advanced analytics"],
  },
  {
    tier: "Gold",
    commission: "15%",
    requirements: "200+ sales",
    benefits: ["Exclusive drops access", "Custom promo codes", "Live streaming"],
  },
  {
    tier: "Platinum",
    commission: "18%",
    requirements: "500+ sales",
    benefits: ["Highest commission", "Brand partnerships", "VIP event access"],
  },
];

export default function CreatorApplyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { applyAsInfluencer, influencers, applications } = useInfluencer();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    followerCount: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyCreator, setAlreadyCreator] = useState(false);
  const [pendingApplication, setPendingApplication] = useState(false);

  // Check if user is already a creator or has pending application
  useEffect(() => {
    if (user) {
      const existingInfluencer = influencers.find(i => i.userId === user.uid);
      if (existingInfluencer) {
        setAlreadyCreator(true);
      }

      const existingApplication = applications.find(
        a => a.userId === user.uid && a.status === "pending"
      );
      if (existingApplication) {
        setPendingApplication(true);
      }
    }
  }, [user, influencers, applications]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/creators/apply");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in to apply");
      return;
    }

    if (!formData.name || !formData.username || !formData.bio) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.instagram && !formData.tiktok && !formData.youtube) {
      toast.error("Please provide at least one social media link");
      return;
    }

    setSubmitting(true);

    try {
      await applyAsInfluencer({
        userId: user.uid,
        email: user.email || "",
        name: formData.name,
        username: formData.username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
        bio: formData.bio,
        socialLinks: {
          instagram: formData.instagram || undefined,
          tiktok: formData.tiktok || undefined,
          youtube: formData.youtube || undefined,
        },
        followerCount: parseInt(formData.followerCount) || 0,
        reason: formData.reason,
      });

      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (alreadyCreator) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <CheckCircle className="w-16 h-16 text-green-500 mb-6" />
        <h1 className="text-2xl font-medium mb-4">You&apos;re Already a Creator!</h1>
        <p className="text-gray-500 text-center max-w-md mb-8">
          Access your creator dashboard to manage your storefront, track sales, and more.
        </p>
        <Link
          href="/creator"
          className="flex items-center gap-2 px-8 py-3 bg-black text-white text-sm hover:bg-gray-800 transition"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (pendingApplication) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <SpinnerGap className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-medium mb-4">Application Under Review</h1>
        <p className="text-gray-500 text-center max-w-md mb-8">
          Your application is being reviewed by our team. We&apos;ll notify you once a decision has been made.
        </p>
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-black transition"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle className="w-8 h-8 text-green-600" weight="fill" />
        </motion.div>
        <h1 className="text-2xl font-medium mb-4">Application Submitted!</h1>
        <p className="text-gray-500 text-center max-w-md mb-8">
          Thank you for applying to become a CIPHER Creator. We&apos;ll review your application and get back to you within 2-3 business days.
        </p>
        <Link
          href="/"
          className="px-8 py-3 bg-black text-white text-sm hover:bg-gray-800 transition"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-black text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-light tracking-tight mb-6"
          >
            Become a <span className="font-bold">CIPHER Creator</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-white/60 text-lg max-w-2xl mx-auto"
          >
            Curate your favorite pieces, earn commission on every sale, and grow your personal brand with exclusive access to our platform.
          </motion.p>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-medium text-center mb-12">Why Become a Creator?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: CurrencyDollar, title: "Earn Commission", desc: "10-18% on every sale through your storefront" },
              { icon: Users, title: "Custom Storefront", desc: "Your personalized shop at cipher.com/shop/creator/you" },
              { icon: ShoppingBag, title: "Curate Products", desc: "Hand-pick your favorite pieces for your audience" },
              { icon: Broadcast, title: "Live Shopping", desc: "Go live and sell products in real-time" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6"
              >
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-medium mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-16 px-6 bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-medium text-center mb-4">Creator Tiers</h2>
          <p className="text-gray-500 text-center mb-12">Grow your tier, increase your earnings</p>
          <div className="grid md:grid-cols-4 gap-4">
            {TIER_BENEFITS.map((tier, i) => (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">{tier.tier}</h3>
                  <span className="text-lg font-bold">{tier.commission}</span>
                </div>
                <p className="text-xs text-gray-400 mb-4">{tier.requirements}</p>
                <ul className="space-y-2">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-medium text-center mb-4">Apply Now</h2>
          <p className="text-gray-500 text-center mb-8">
            Fill out the form below to apply. We review applications within 2-3 business days.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })}
                    className="w-full pl-8 pr-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                    placeholder="yourname"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">This will be your storefront URL</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Bio <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition resize-none"
                placeholder="Tell us about yourself and your style..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-4">
                Social Media Links <span className="text-red-500">*</span>
                <span className="font-normal text-gray-400 ml-2">(at least one required)</span>
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <InstagramLogo className="w-5 h-5 text-pink-500" />
                  <input
                    type="url"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-200 focus:border-black outline-none transition"
                    placeholder="https://instagram.com/yourprofile"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <TiktokLogo className="w-5 h-5 text-black" />
                  <input
                    type="url"
                    value={formData.tiktok}
                    onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-200 focus:border-black outline-none transition"
                    placeholder="https://tiktok.com/@yourprofile"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <YoutubeLogo className="w-5 h-5 text-red-500" />
                  <input
                    type="url"
                    value={formData.youtube}
                    onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-200 focus:border-black outline-none transition"
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Total Follower Count
              </label>
              <input
                type="number"
                value={formData.followerCount}
                onChange={(e) => setFormData({ ...formData, followerCount: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                placeholder="Combined followers across all platforms"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Why do you want to join?
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition resize-none"
                placeholder="Tell us what excites you about being a CIPHER Creator..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-black text-white font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <SpinnerGap className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
