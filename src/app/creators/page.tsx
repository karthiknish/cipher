"use client";
import { motion } from "@/lib/motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CurrencyDollar,
  Users,
  ShoppingBag,
  Broadcast,
  CheckCircle,
  Star,
  TrendUp,
  Lightning,
  InstagramLogo,
  TiktokLogo,
  YoutubeLogo,
  Crown,
  Sparkle,
  Storefront,
  ChartLineUp,
  Heart,
  Percent,
} from "@phosphor-icons/react";
import { useInfluencer } from "@/context/InfluencerContext";

const FEATURED_CREATORS = [
  {
    name: "Sarah Chen",
    username: "sarahstyles",
    avatar: "/images/avatars/creator_avatar_1_1765006771142.png",
    followers: "125K",
    sales: "500+",
    specialty: "Streetwear",
  },
  {
    name: "Marcus Johnson",
    username: "marcusjstyle",
    avatar: "/images/avatars/creator_avatar_2_1765006792028.png",
    followers: "89K",
    sales: "350+",
    specialty: "Minimalist",
  },
  {
    name: "Olivia Park",
    username: "oliviawears",
    avatar: "/images/avatars/creator_avatar_3_1765006807024.png",
    followers: "210K",
    sales: "800+",
    specialty: "Athleisure",
  },
];

const TIER_BENEFITS = [
  {
    tier: "Bronze",
    commission: "10%",
    color: "from-amber-700 to-amber-600",
    requirements: "Entry level",
    benefits: ["Custom storefront", "Referral tracking", "Basic analytics", "Personal shop link"],
  },
  {
    tier: "Silver",
    commission: "12%",
    color: "from-gray-500 to-gray-400",
    requirements: "50+ sales",
    benefits: ["Priority support", "Featured placement", "Advanced analytics", "Monthly payouts"],
  },
  {
    tier: "Gold",
    commission: "15%",
    color: "from-yellow-500 to-amber-400",
    requirements: "200+ sales",
    benefits: ["Exclusive drops access", "Custom promo codes", "Live streaming", "Early access"],
  },
  {
    tier: "Platinum",
    commission: "18%",
    color: "from-purple-600 to-pink-500",
    requirements: "500+ sales",
    benefits: ["Highest commission", "Brand partnerships", "VIP events", "Custom collections"],
  },
];

const STEPS = [
  {
    icon: Users,
    title: "Apply",
    description: "Fill out our simple application with your social media profiles and style preferences.",
  },
  {
    icon: CheckCircle,
    title: "Get Approved",
    description: "Our team reviews applications within 2-3 business days and notifies you via email.",
  },
  {
    icon: Storefront,
    title: "Set Up Shop",
    description: "Create your personalized storefront by curating your favorite CIPHER pieces.",
  },
  {
    icon: CurrencyDollar,
    title: "Start Earning",
    description: "Share your link, track your sales, and earn commission on every purchase.",
  },
];

const STATS = [
  { value: "500+", label: "Active Creators" },
  { value: "$2M+", label: "Paid to Creators" },
  { value: "15%", label: "Avg. Commission" },
  { value: "50K+", label: "Products Sold" },
];

export default function CreatorsLandingPage() {
  const { influencers } = useInfluencer();
  
  // Get actual stats
  const activeCreators = influencers.filter(i => i.isActive).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-black text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
                <Sparkle className="w-4 h-4 text-yellow-400" weight="fill" />
                <span className="text-sm">Join the CIPHER Creator Program</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6">
                Turn Your <br />
                <span className="font-bold">Influence</span> Into <br />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-bold">
                  Income
                </span>
              </h1>
              
              <p className="text-xl text-white/60 mb-8 max-w-lg">
                Curate your favorite styles, share with your audience, and earn up to 18% commission on every sale through your personalized storefront.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/creators/apply"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-medium hover:bg-gray-100 transition"
                >
                  Apply Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/30 hover:bg-white/10 transition"
                >
                  Learn More
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              {/* Creator Cards Stack */}
              <div className="relative h-[500px]">
                {FEATURED_CREATORS.map((creator, i) => (
                  <motion.div
                    key={creator.username}
                    initial={{ opacity: 0, y: 20, rotate: i * 3 - 3 }}
                    animate={{ opacity: 1, y: 0, rotate: i * 3 - 3 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="absolute bg-white text-black p-6 w-72 shadow-2xl"
                    style={{
                      top: `${i * 40}px`,
                      left: `${i * 60}px`,
                      zIndex: 3 - i,
                    }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative w-14 h-14 rounded-full overflow-hidden bg-gray-100">
                        <Image
                          src={creator.avatar}
                          alt={creator.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{creator.name}</p>
                        <p className="text-sm text-gray-500">@{creator.username}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-gray-500">Followers</p>
                        <p className="font-medium">{creator.followers}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Sales</p>
                        <p className="font-medium">{creator.sales}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Style</p>
                        <p className="font-medium">{creator.specialty}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Become a Creator - Bento Grid */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-light mb-4">
              Why Become a <span className="font-bold">Creator</span>?
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Everything you need to monetize your influence and build your personal brand.
            </p>
          </motion.div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 auto-rows-[160px]">
            
            {/* Personal Storefront - Large Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-6 lg:col-span-8 row-span-2 bg-black text-white p-8 relative overflow-hidden group"
            >
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Storefront className="w-7 h-7 text-white" weight="bold" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Personal Storefront</h3>
                  <p className="text-white/60 text-sm max-w-md">Get your own customizable shop at cipher.com/shop/creator/you with hand-picked products that match your style.</p>
                </div>
                {/* Mini Storefront Preview */}
                <div className="bg-white/10 backdrop-blur-sm p-4 mt-4 max-w-sm">
                  <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-3">
                    <div className="w-8 h-8 bg-white/20 rounded-full" />
                    <div className="h-2 w-24 bg-white/20 rounded" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="aspect-square bg-white/10" />
                    <div className="aspect-square bg-white/10" />
                    <div className="aspect-square bg-white/10" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* High Commissions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-3 lg:col-span-4 row-span-1 bg-gray-100 p-6 relative overflow-hidden group hover:bg-gray-200 transition-colors"
            >
              <div className="flex items-center justify-between h-full">
                <div>
                  <h3 className="text-lg font-bold mb-1">High Commissions</h3>
                  <p className="text-gray-500 text-sm">Top creators earn thousands monthly</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold">18%</p>
                  <p className="text-xs text-gray-500">per sale</p>
                </div>
              </div>
            </motion.div>

            {/* Real-Time Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="md:col-span-3 lg:col-span-4 row-span-1 bg-gray-100 p-6 relative overflow-hidden group hover:bg-gray-200 transition-colors"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ChartLineUp className="w-5 h-5 text-white" weight="bold" />
                </div>
                <h3 className="font-bold">Real-Time Analytics</h3>
              </div>
              <div className="flex items-end gap-1 h-10">
                {[40, 65, 45, 80, 55, 90, 70, 85].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-black rounded-t"
                    style={{ height: `${h}%`, opacity: 0.3 + (i * 0.08) }}
                  />
                ))}
              </div>
            </motion.div>

            {/* Exclusive Access - Tall */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-3 lg:col-span-4 row-span-2 bg-black text-white p-8 relative overflow-hidden group"
            >
              <div className="h-full flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Lightning className="w-6 h-6 text-white" weight="bold" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Exclusive Access</h3>
                  <p className="text-white/60 text-sm">Get early access to new drops, exclusive colorways, and limited edition pieces before anyone else.</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <span className="px-3 py-1 bg-white/10 text-xs">Early Drops</span>
                  <span className="px-3 py-1 bg-white/10 text-xs">Limited Editions</span>
                </div>
              </div>
            </motion.div>

            {/* Live Shopping */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="md:col-span-3 lg:col-span-4 row-span-1 bg-gray-100 p-6 relative overflow-hidden group hover:bg-gray-200 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-black flex items-center justify-center group-hover:scale-110 transition-transform relative">
                  <Broadcast className="w-5 h-5 text-white" weight="bold" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold">Live Shopping</h3>
                  <p className="text-gray-500 text-sm">Stream & sell in real-time with instant checkout</p>
                </div>
              </div>
            </motion.div>

            {/* Community */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-3 lg:col-span-4 row-span-1 bg-gray-100 p-6 relative overflow-hidden group hover:bg-gray-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Heart className="w-5 h-5 text-white" weight="bold" />
                  </div>
                  <div>
                    <h3 className="font-bold">Creator Community</h3>
                    <p className="text-gray-500 text-sm">Connect & grow together</p>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-300 border-2 border-gray-100 flex items-center justify-center text-xs font-medium">
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* VIP Treatment - Wide */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 }}
              className="md:col-span-6 lg:col-span-8 row-span-1 bg-black text-white p-6 relative overflow-hidden group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Crown className="w-6 h-6 text-white" weight="bold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">VIP Treatment</h3>
                    <p className="text-white/60 text-sm">Top creators get invited to exclusive events, photoshoots, and brand partnerships</p>
                  </div>
                </div>
                <div className="hidden md:flex gap-3">
                  <span className="px-3 py-1 bg-white/10 text-xs">Events</span>
                  <span className="px-3 py-1 bg-white/10 text-xs">Photoshoots</span>
                  <span className="px-3 py-1 bg-white/10 text-xs">Partnerships</span>
                </div>
              </div>
            </motion.div>

            {/* Recognition */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="md:col-span-3 lg:col-span-4 row-span-1 bg-gray-100 p-6 relative overflow-hidden group hover:bg-gray-200 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Star className="w-5 h-5 text-white" weight="bold" />
                </div>
                <div>
                  <h3 className="font-bold">Get Featured</h3>
                  <p className="text-gray-500 text-sm">Homepage, social media & marketing campaigns</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* How It Works - Timeline Style */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-light mb-4">
              How It <span className="font-bold">Works</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              From application to earnings in just 4 simple steps
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gray-300 md:-translate-x-px" />

            {/* Steps */}
            <div className="space-y-16">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative flex items-start gap-8 md:gap-16"
              >
                <div className="hidden md:block md:w-1/2 text-right pr-16">
                  <h3 className="text-2xl font-bold mb-2">Apply in Minutes</h3>
                  <p className="text-gray-500">Share your social profiles and style preferences. No complex forms or lengthy requirements.</p>
                </div>
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-16 h-16 bg-black text-white flex items-center justify-center text-xl font-bold z-10">
                  1
                </div>
                <div className="pl-24 md:pl-0 md:w-1/2 md:text-left">
                  <div className="md:hidden mb-4">
                    <h3 className="text-2xl font-bold mb-2">Apply in Minutes</h3>
                    <p className="text-gray-500">Share your social profiles and style preferences. No complex forms or lengthy requirements.</p>
                  </div>
                  <div className="bg-white p-4 border border-gray-200 inline-flex items-center gap-3">
                    <Users className="w-6 h-6" weight="bold" />
                    <span className="text-sm text-gray-500">Quick application form</span>
                  </div>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative flex items-start gap-8 md:gap-16"
              >
                <div className="hidden md:block md:w-1/2 text-right pr-16">
                  <div className="bg-white p-4 border border-gray-200 inline-flex items-center gap-3">
                    <CheckCircle className="w-6 h-6" weight="bold" />
                    <span className="text-sm text-gray-500">2-3 business days</span>
                  </div>
                </div>
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-16 h-16 bg-black text-white flex items-center justify-center text-xl font-bold z-10">
                  2
                </div>
                <div className="pl-24 md:pl-16 md:w-1/2">
                  <h3 className="text-2xl font-bold mb-2">Get Approved</h3>
                  <p className="text-gray-500">Our team reviews applications within 2-3 business days. You&apos;ll receive an email notification.</p>
                  <div className="md:hidden mt-4 bg-white p-4 border border-gray-200 inline-flex items-center gap-3">
                    <CheckCircle className="w-6 h-6" weight="bold" />
                    <span className="text-sm text-gray-500">2-3 business days</span>
                  </div>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative flex items-start gap-8 md:gap-16"
              >
                <div className="hidden md:block md:w-1/2 text-right pr-16">
                  <h3 className="text-2xl font-bold mb-2">Set Up Your Shop</h3>
                  <p className="text-gray-500">Create your personalized storefront by curating your favorite CIPHER pieces.</p>
                </div>
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-16 h-16 bg-black text-white flex items-center justify-center text-xl font-bold z-10">
                  3
                </div>
                <div className="pl-24 md:pl-0 md:w-1/2 md:text-left">
                  <div className="md:hidden mb-4">
                    <h3 className="text-2xl font-bold mb-2">Set Up Your Shop</h3>
                    <p className="text-gray-500">Create your personalized storefront by curating your favorite CIPHER pieces.</p>
                  </div>
                  <div className="bg-white p-4 border border-gray-200 max-w-xs">
                    <div className="flex items-center gap-2 mb-3 border-b border-gray-100 pb-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full" />
                      <div className="h-2 w-16 bg-gray-200 rounded" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="aspect-square bg-gray-100" />
                      <div className="aspect-square bg-gray-100" />
                      <div className="aspect-square bg-gray-100" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Step 4 */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative flex items-start gap-8 md:gap-16"
              >
                <div className="hidden md:block md:w-1/2 text-right pr-16">
                  <div className="bg-black text-white p-4 inline-block">
                    <p className="text-3xl font-bold">$5K-$15K</p>
                    <p className="text-white/60 text-sm">monthly for top creators</p>
                  </div>
                </div>
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-16 h-16 bg-black text-white flex items-center justify-center text-xl font-bold z-10">
                  4
                </div>
                <div className="pl-24 md:pl-16 md:w-1/2">
                  <h3 className="text-2xl font-bold mb-2">Start Earning</h3>
                  <p className="text-gray-500">Share your unique link, track sales in real-time, and earn commission on every purchase.</p>
                  <div className="md:hidden mt-4 bg-black text-white p-4 inline-block">
                    <p className="text-2xl font-bold">$5K-$15K</p>
                    <p className="text-white/60 text-sm">monthly for top creators</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 bg-white p-8 border border-gray-200"
          >
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">500+</p>
              <p className="text-sm text-gray-500 mt-1">Active Creators</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">$2M+</p>
              <p className="text-sm text-gray-500 mt-1">Paid to Creators</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">15%</p>
              <p className="text-sm text-gray-500 mt-1">Avg. Commission</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold">50K+</p>
              <p className="text-sm text-gray-500 mt-1">Products Sold</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tier System */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-light mb-4">
              Creator <span className="font-bold">Tiers</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Level up your tier to unlock higher commissions and exclusive perks.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {TIER_BENEFITS.map((tier, i) => (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-6 border border-gray-200 ${
                  tier.tier === "Platinum" ? "bg-gradient-to-br from-purple-50 to-pink-50" : "bg-white"
                }`}
              >
                {tier.tier === "Platinum" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-medium">
                    BEST VALUE
                  </div>
                )}
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4`}>
                  <Crown className="w-6 h-6 text-white" weight="fill" />
                </div>
                <h3 className="text-xl font-bold mb-1">{tier.tier}</h3>
                <p className="text-sm text-gray-500 mb-4">{tier.requirements}</p>
                <div className="text-3xl font-bold mb-6">{tier.commission}</div>
                <ul className="space-y-3">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" weight="fill" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-light mb-4">
              Loved by <span className="font-bold">Creators</span>
            </h2>
            <p className="text-gray-500">See what our top creators are saying</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "CIPHER's creator program changed everything for me. I went from recommending products for free to earning over $5K monthly.",
                name: "Alex Rivera",
                role: "Fashion Creator",
                avatar: "/images/avatars/creator_avatar_1_1765006771142.png",
                followers: "180K",
              },
              {
                quote: "The analytics dashboard is incredible. I can see exactly which products resonate with my audience and optimize my content.",
                name: "Jordan Lee",
                role: "Style Influencer",
                avatar: "/images/avatars/creator_avatar_2_1765006792028.png",
                followers: "95K",
              },
              {
                quote: "I love that I can curate my own collection. My followers trust my picks and the conversion rate is amazing.",
                name: "Maya Patel",
                role: "Lifestyle Blogger",
                avatar: "/images/avatars/creator_avatar_3_1765006807024.png",
                followers: "320K",
              },
            ].map((testimonial, i) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 border border-gray-200"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400" weight="fill" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role} · {testimonial.followers} followers</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Support */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-light mb-4">
              All Platforms <span className="font-bold">Welcome</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Whether you&apos;re big on Instagram, TikTok, YouTube, or emerging platforms — we support creators everywhere.
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: InstagramLogo, name: "Instagram", color: "from-purple-500 via-pink-500 to-orange-400" },
              { icon: TiktokLogo, name: "TikTok", color: "from-black to-gray-800" },
              { icon: YoutubeLogo, name: "YouTube", color: "from-red-600 to-red-500" },
            ].map((platform, i) => (
              <motion.div
                key={platform.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className={`w-24 h-24 bg-gradient-to-br ${platform.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <platform.icon className="w-12 h-12 text-white" weight="fill" />
                </div>
                <span className="font-medium">{platform.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-light mb-6">
              Ready to <span className="font-bold">Get Started</span>?
            </h2>
            <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
              Join {activeCreators > 0 ? activeCreators : 500}+ creators who are already earning with CIPHER. Apply today and start your journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/creators/apply"
                className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-black font-medium hover:bg-gray-100 transition text-lg"
              >
                Apply Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <p className="text-sm text-white/40 mt-8">
              Free to join · No hidden fees · Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-light mb-4">
              Frequently Asked <span className="font-bold">Questions</span>
            </h2>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                q: "How much can I earn as a CIPHER Creator?",
                a: "Earnings vary based on your audience size and engagement. Our top creators earn $5,000-$15,000+ monthly. New creators typically start earning within their first week.",
              },
              {
                q: "What are the requirements to join?",
                a: "We look for creators with authentic audiences and a passion for fashion. There's no minimum follower count, but we prefer creators with at least 1,000 engaged followers.",
              },
              {
                q: "How do I get paid?",
                a: "Commissions are calculated in real-time and paid out monthly via PayPal or direct deposit. Silver tier and above receive weekly payouts.",
              },
              {
                q: "Can I still work with other brands?",
                a: "Absolutely! We don't require exclusivity. You're free to work with other brands and programs alongside CIPHER.",
              },
              {
                q: "How long does the application take?",
                a: "Most applications are reviewed within 2-3 business days. You'll receive an email notification once a decision has been made.",
              },
            ].map((faq, i) => (
              <motion.details
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group border border-gray-200 p-6"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="font-medium pr-4">{faq.q}</span>
                  <span className="text-2xl text-gray-400 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-gray-600">{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
