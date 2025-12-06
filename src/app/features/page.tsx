"use client";

import { motion } from "@/lib/motion";
import Link from "next/link";
import Image from "next/image";
import {
    Sparkle,
    MagicWand,
    Heart,
    Trophy,
    Scales,
    Tag,
    Gift,
    Bell,
    ChartLineUp,
    Users,
    Camera,
    Palette,
    Ruler,
    Star,
    Lightning,
    Brain,
    Cube,
    ArrowRight,
    CheckCircle,
    Fire,
    Storefront,
    TrendUp,
    ShoppingBag,
    Crown,
} from "@phosphor-icons/react";

// All features data organized by category
const FEATURES = {
    personalization: [
        {
            id: "smart-match",
            icon: Brain,
            title: "Smart Product Matching",
            description: "AI matches products to your body type, style preferences, and budget.",
            href: "/shop?filter=for-you",
            isNew: true,
        },
        {
            id: "size-recommendation",
            icon: Ruler,
            title: "Perfect Size Finder",
            description: "Get personalized size recommendations for every product.",
            href: "/size-guide",
        },
        {
            id: "style-profile",
            icon: Sparkle,
            title: "Style Profile",
            description: "Complete a quick style quiz for better recommendations.",
            href: "/profile?tab=style",
        },
    ],
    shopping: [
        {
            id: "virtual-tryon",
            icon: MagicWand,
            title: "AI Virtual Try-On",
            description: "See how clothes look on you before buying with AI visualization.",
            href: "/shop",
            isAI: true,
        },
        {
            id: "wishlist",
            icon: Heart,
            title: "Smart Wishlist",
            description: "Save items and get notified on price drops or restocks.",
            href: "/wishlist",
        },
        {
            id: "compare",
            icon: Scales,
            title: "Product Comparison",
            description: "Compare up to 3 products side by side.",
            href: "/shop",
        },
        {
            id: "bundles",
            icon: Cube,
            title: "Curated Bundles",
            description: "Shop complete outfits with bundle discounts.",
            href: "/bundles",
        },
        {
            id: "stock-alerts",
            icon: Bell,
            title: "Back in Stock Alerts",
            description: "Get notified when sold-out items are available.",
            href: "/shop",
        },
    ],
    social: [
        {
            id: "challenges",
            icon: Trophy,
            title: "Style Challenges",
            description: "Compete in weekly challenges and win prizes.",
            href: "/challenges",
            isPopular: true,
        },
        {
            id: "vote",
            icon: Palette,
            title: "Vote on Designs",
            description: "Help decide what we make next.",
            href: "/vote",
        },
        {
            id: "creators",
            icon: Users,
            title: "Creator Program",
            description: "Earn commissions on sales you refer.",
            href: "/creators",
        },
        {
            id: "events",
            icon: Camera,
            title: "Pop-up Events",
            description: "Join exclusive in-person events and meetups.",
            href: "/events",
        },
    ],
    rewards: [
        {
            id: "loyalty",
            icon: Star,
            title: "Loyalty Rewards",
            description: "Earn points with every purchase and unlock perks.",
            href: "/profile?tab=rewards",
        },
        {
            id: "achievements",
            icon: Crown,
            title: "Achievements",
            description: "Unlock badges and show off your style status.",
            href: "/achievements",
        },
        {
            id: "spin-wheel",
            icon: Gift,
            title: "Spin to Win",
            description: "Daily spins for discounts and prizes.",
            href: "/",
            isFun: true,
        },
        {
            id: "promo-codes",
            icon: Tag,
            title: "Promo Codes",
            description: "Stack savings with exclusive discount codes.",
            href: "/cart",
        },
    ],
};

const HIGHLIGHT_FEATURES = [
    {
        id: "smart-match",
        icon: Brain,
        title: "Smart Product Matching",
        description: "Our AI analyzes your body type, style preferences, favorite colors, and budget to find products that are perfect for you.",
        highlights: ["Body type analysis", "Style preference matching", "Color harmony", "Budget-aware recommendations"],
        href: "/shop?filter=for-you",
        badge: "NEW",
    },
    {
        id: "virtual-tryon",
        icon: MagicWand,
        title: "AI Virtual Try-On",
        description: "Upload your photo and see how any item looks on you before you buy. Our AI generates realistic previews in seconds.",
        highlights: ["Realistic visualization", "Any product", "Instant results", "Multiple poses"],
        href: "/shop",
        badge: "AI POWERED",
    },
    {
        id: "challenges",
        icon: Trophy,
        title: "Style Challenges",
        description: "Compete in weekly style challenges, vote on community looks, and win exclusive prizes and store credit.",
        highlights: ["Weekly competitions", "Community voting", "Cash prizes", "Featured winners"],
        href: "/challenges",
        badge: "POPULAR",
    },
];

export default function FeaturesPage() {
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
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm mb-6">
                                <Lightning className="w-4 h-4 text-yellow-400" weight="fill" />
                                <span className="text-sm">Powered by AI</span>
                            </div>

                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6">
                                Shopping That <br />
                                <span className="font-bold">Understands</span> You
                            </h1>

                            <p className="text-xl text-white/60 mb-10 max-w-xl">
                                From AI-powered recommendations to community challenges — discover all the features that make CIPHER different.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/shop"
                                    className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black font-medium hover:bg-gray-100 transition"
                                >
                                    Start Shopping
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/profile?tab=style"
                                    className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/30 hover:bg-white/10 transition"
                                >
                                    <Sparkle className="w-5 h-5" />
                                    Set Up Profile
                                </Link>
                            </div>
                        </motion.div>

                        {/* Hero Image */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative hidden lg:block"
                        >
                            <div className="relative aspect-square max-w-lg ml-auto">
                                {/* Decorative elements */}
                                <div className="absolute -top-4 -left-4 w-24 h-24 border border-white/20" />
                                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/5" />

                                {/* Main image */}
                                <div className="relative w-full h-full bg-white/5 overflow-hidden">
                                    <Image
                                        src="/images/features-hero.png"
                                        alt="AI-powered fashion shopping experience"
                                        fill
                                        className="object-cover"
                                        priority
                                    />

                                    {/* Floating badges */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.8 }}
                                        className="absolute top-6 right-6 bg-white text-black px-3 py-2 shadow-lg"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Brain className="w-4 h-4" weight="bold" />
                                            <span className="text-xs font-bold">AI POWERED</span>
                                        </div>
                                    </motion.div>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1 }}
                                        className="absolute bottom-6 left-6 bg-black/90 text-white px-4 py-3 backdrop-blur-sm"
                                    >
                                        <p className="text-xs text-white/60 mb-1">Match Score</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: "92%" }}
                                                    transition={{ delay: 1.2, duration: 0.8 }}
                                                    className="h-full bg-green-500"
                                                />
                                            </div>
                                            <span className="text-sm font-bold">92%</span>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Highlight Features - Bento Grid */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-light mb-4">
                            Powered by <span className="font-bold">Intelligence</span>
                        </h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            Our most advanced features use AI and machine learning to give you a personalized experience.
                        </p>
                    </motion.div>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 auto-rows-[180px]">

                        {/* Smart Match - Large Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="md:col-span-6 lg:col-span-8 row-span-2 bg-black text-white p-8 relative overflow-hidden group"
                        >
                            <div className="absolute top-4 right-4 px-2 py-1 bg-white/20 text-xs font-bold">
                                NEW
                            </div>
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div>
                                    <div className="w-14 h-14 bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Brain className="w-7 h-7 text-white" weight="bold" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">Smart Product Matching</h3>
                                    <p className="text-white/60 text-sm max-w-md">
                                        Our AI analyzes your body type, style preferences, favorite colors, and budget to find products that are perfect for you.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-6">
                                    {["Body Type", "Style", "Colors", "Budget"].map((tag) => (
                                        <span key={tag} className="px-3 py-1 bg-white/10 text-xs">{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <Link href="/shop?filter=for-you" className="absolute inset-0" />
                        </motion.div>

                        {/* Virtual Try-On */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="md:col-span-3 lg:col-span-4 row-span-1 bg-gray-100 p-6 relative overflow-hidden group hover:bg-gray-200 transition-colors"
                        >
                            <div className="flex items-center gap-4 h-full">
                                <div className="w-12 h-12 bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <MagicWand className="w-6 h-6 text-white" weight="bold" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold">AI Virtual Try-On</h3>
                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold">AI</span>
                                    </div>
                                    <p className="text-gray-500 text-sm">See how clothes look on you before buying</p>
                                </div>
                            </div>
                            <Link href="/shop" className="absolute inset-0" />
                        </motion.div>

                        {/* Size Finder */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.15 }}
                            className="md:col-span-3 lg:col-span-4 row-span-1 bg-gray-100 p-6 relative overflow-hidden group hover:bg-gray-200 transition-colors"
                        >
                            <div className="flex items-center gap-4 h-full">
                                <div className="w-12 h-12 bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Ruler className="w-6 h-6 text-white" weight="bold" />
                                </div>
                                <div>
                                    <h3 className="font-bold mb-1">Perfect Size Finder</h3>
                                    <p className="text-gray-500 text-sm">Personalized size recommendations</p>
                                </div>
                            </div>
                            <Link href="/size-guide" className="absolute inset-0" />
                        </motion.div>

                        {/* Style Challenges - Tall */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="md:col-span-3 lg:col-span-4 row-span-2 bg-black text-white p-8 relative overflow-hidden group"
                        >
                            <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-300 text-[10px] font-bold">
                                <Fire className="w-3 h-3" weight="fill" />
                                POPULAR
                            </div>
                            <div className="h-full flex flex-col justify-between">
                                <div>
                                    <div className="w-12 h-12 bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Trophy className="w-6 h-6 text-yellow-400" weight="bold" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">Style Challenges</h3>
                                    <p className="text-white/60 text-sm">
                                        Compete in weekly challenges, vote on looks, and win exclusive prizes.
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
                                    <div>
                                        <p className="text-2xl font-bold">$500</p>
                                        <p className="text-xs text-white/40">weekly prizes</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">1K+</p>
                                        <p className="text-xs text-white/40">participants</p>
                                    </div>
                                </div>
                            </div>
                            <Link href="/challenges" className="absolute inset-0" />
                        </motion.div>

                        {/* Wishlist */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.25 }}
                            className="md:col-span-3 lg:col-span-4 row-span-1 bg-gray-100 p-6 relative overflow-hidden group hover:bg-gray-200 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Heart className="w-5 h-5 text-white" weight="bold" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Smart Wishlist</h3>
                                    <p className="text-gray-500 text-sm">Price drops & restock alerts</p>
                                </div>
                            </div>
                            <Link href="/wishlist" className="absolute inset-0" />
                        </motion.div>

                        {/* Compare */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="md:col-span-3 lg:col-span-4 row-span-1 bg-gray-100 p-6 relative overflow-hidden group hover:bg-gray-200 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Scales className="w-5 h-5 text-white" weight="bold" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Product Comparison</h3>
                                    <p className="text-gray-500 text-sm">Compare up to 3 items side by side</p>
                                </div>
                            </div>
                            <Link href="/shop" className="absolute inset-0" />
                        </motion.div>

                        {/* Bundles - Wide */}
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
                                        <Cube className="w-6 h-6 text-white" weight="bold" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">Curated Bundles</h3>
                                        <p className="text-white/60 text-sm">Shop complete outfits with exclusive bundle discounts</p>
                                    </div>
                                </div>
                                <div className="hidden md:flex items-center gap-2">
                                    <span className="px-3 py-1 bg-white/10 text-sm">Save up to 25%</span>
                                </div>
                            </div>
                            <Link href="/bundles" className="absolute inset-0" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* All Features Grid */}
            <section className="py-24 px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl md:text-5xl font-light mb-4">
                            All <span className="font-bold">Features</span>
                        </h2>
                        <p className="text-gray-500 max-w-2xl mx-auto">
                            Everything you need for a smarter, more personalized shopping experience.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Personalization */}
                        <div>
                            <h3 className="text-xs tracking-wider text-gray-500 mb-6 flex items-center gap-2">
                                <Sparkle className="w-4 h-4" />
                                PERSONALIZATION
                            </h3>
                            <div className="space-y-4">
                                {FEATURES.personalization.map((feature) => (
                                    <Link
                                        key={feature.id}
                                        href={feature.href}
                                        className="block p-4 bg-white border border-gray-200 hover:border-black hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                                <feature.icon className="w-5 h-5" weight="bold" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-sm">{feature.title}</h4>
                                                    {feature.isNew && (
                                                        <span className="px-1.5 py-0.5 bg-black text-white text-[9px] font-bold">NEW</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">{feature.description}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Shopping */}
                        <div>
                            <h3 className="text-xs tracking-wider text-gray-500 mb-6 flex items-center gap-2">
                                <ShoppingBag className="w-4 h-4" />
                                SHOPPING
                            </h3>
                            <div className="space-y-4">
                                {FEATURES.shopping.map((feature) => (
                                    <Link
                                        key={feature.id}
                                        href={feature.href}
                                        className="block p-4 bg-white border border-gray-200 hover:border-black hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                                <feature.icon className="w-5 h-5" weight="bold" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-sm">{feature.title}</h4>
                                                    {feature.isAI && (
                                                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold">AI</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">{feature.description}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Social & Community */}
                        <div>
                            <h3 className="text-xs tracking-wider text-gray-500 mb-6 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                COMMUNITY
                            </h3>
                            <div className="space-y-4">
                                {FEATURES.social.map((feature) => (
                                    <Link
                                        key={feature.id}
                                        href={feature.href}
                                        className="block p-4 bg-white border border-gray-200 hover:border-black hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                                <feature.icon className="w-5 h-5" weight="bold" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-sm">{feature.title}</h4>
                                                    {feature.isPopular && (
                                                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-bold">HOT</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">{feature.description}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Rewards */}
                        <div>
                            <h3 className="text-xs tracking-wider text-gray-500 mb-6 flex items-center gap-2">
                                <Gift className="w-4 h-4" />
                                REWARDS
                            </h3>
                            <div className="space-y-4">
                                {FEATURES.rewards.map((feature) => (
                                    <Link
                                        key={feature.id}
                                        href={feature.href}
                                        className="block p-4 bg-white border border-gray-200 hover:border-black hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                                                <feature.icon className="w-5 h-5" weight="bold" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-sm">{feature.title}</h4>
                                                    {feature.isFun && (
                                                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold">FUN</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">{feature.description}</p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-6 bg-white border-y border-gray-200">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { value: "16+", label: "Unique Features" },
                            { value: "AI", label: "Powered Technology" },
                            { value: "24/7", label: "Available" },
                            { value: "100%", label: "Personalized" },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <p className="text-4xl md:text-5xl font-bold">{stat.value}</p>
                                <p className="text-sm text-gray-500 mt-2">{stat.label}</p>
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
                        <Sparkle className="w-12 h-12 mx-auto mb-6 text-yellow-400" weight="fill" />
                        <h2 className="text-4xl md:text-5xl font-light mb-6">
                            Ready to <span className="font-bold">Experience</span> It?
                        </h2>
                        <p className="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
                            Create your style profile and unlock personalized recommendations, rewards, and features tailored just for you.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/profile?tab=style"
                                className="group inline-flex items-center justify-center gap-2 px-10 py-5 bg-white text-black font-medium hover:bg-gray-100 transition text-lg"
                            >
                                Get Started
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/shop"
                                className="inline-flex items-center justify-center gap-2 px-10 py-5 border border-white/30 hover:bg-white/10 transition text-lg"
                            >
                                Browse Shop
                            </Link>
                        </div>
                        <p className="text-sm text-white/40 mt-8">
                            No account required to browse. Sign up for the full experience.
                        </p>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}
