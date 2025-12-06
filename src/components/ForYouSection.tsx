"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import Image from "next/image";
import Link from "next/link";
import { useSmartMatch, ProductMatchScore } from "@/context/SmartMatchContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import {
    Sparkle,
    Heart,
    CaretLeft,
    CaretRight,
    User,
    Check,
} from "@phosphor-icons/react";

interface ForYouSectionProps {
    title?: string;
    showSetupPrompt?: boolean;
    maxProducts?: number;
}

export default function ForYouSection({
    title = "Picked For You",
    showSetupPrompt = true,
    maxProducts = 8,
}: ForYouSectionProps) {
    const { getTopMatches, hasCompleteProfile } = useSmartMatch();
    const { addToCart } = useCart();
    const toast = useToast();

    const [matches, setMatches] = useState<ProductMatchScore[]>([]);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [scrollWidth, setScrollWidth] = useState(0);

    useEffect(() => {
        const topMatches = getTopMatches(maxProducts);
        setMatches(topMatches);
    }, [getTopMatches, maxProducts]);

    const handleScroll = (direction: "left" | "right") => {
        const scrollAmount = 300;
        const newPosition = direction === "left"
            ? Math.max(0, scrollPosition - scrollAmount)
            : Math.min(scrollWidth - containerWidth, scrollPosition + scrollAmount);
        setScrollPosition(newPosition);
    };

    const handleQuickAdd = (match: ProductMatchScore) => {
        addToCart({
            id: match.product.id,
            name: match.product.name,
            price: match.product.price,
            image: match.product.image,
            category: match.product.category,
            quantity: 1,
            size: "M",
        });
        toast.success(`${match.product.name} added to bag`);
    };

    // Get score color based on match percentage
    const getScoreColor = (score: number) => {
        if (score >= 85) return "bg-green-500 text-white";
        if (score >= 70) return "bg-emerald-100 text-emerald-700";
        if (score >= 55) return "bg-amber-100 text-amber-700";
        return "bg-gray-100 text-gray-600";
    };

    // Don't render if no matches
    if (matches.length === 0) return null;

    return (
        <section className="py-12 md:py-16 bg-gradient-to-b from-gray-50 to-white">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black flex items-center justify-center">
                            <Sparkle className="w-5 h-5 text-white" weight="fill" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-light tracking-tight">{title}</h2>
                            <p className="text-sm text-gray-500">
                                {hasCompleteProfile()
                                    ? "Based on your style profile"
                                    : "Personalized for you"}
                            </p>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleScroll("left")}
                            disabled={scrollPosition === 0}
                            className="p-2 border border-gray-200 hover:border-black disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            <CaretLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleScroll("right")}
                            disabled={scrollPosition >= scrollWidth - containerWidth}
                            className="p-2 border border-gray-200 hover:border-black disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            <CaretRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Setup Prompt */}
                {showSetupPrompt && !hasCompleteProfile() && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 bg-black/5 border border-black/10 flex items-center justify-between gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-gray-600" />
                            <div>
                                <p className="font-medium text-sm">Complete your style profile</p>
                                <p className="text-xs text-gray-500">Get better recommendations based on your body type and preferences</p>
                            </div>
                        </div>
                        <Link
                            href="/profile?tab=style"
                            className="px-4 py-2 bg-black text-white text-sm tracking-wider hover:bg-gray-800 transition flex-shrink-0"
                        >
                            SET UP
                        </Link>
                    </motion.div>
                )}

                {/* Products Carousel */}
                <div
                    className="relative overflow-hidden"
                    ref={(el) => {
                        if (el) {
                            setContainerWidth(el.offsetWidth);
                            setScrollWidth(el.scrollWidth);
                        }
                    }}
                >
                    <motion.div
                        className="flex gap-4 md:gap-6"
                        animate={{ x: -scrollPosition }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {matches.map((match, index) => (
                            <motion.div
                                key={match.product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex-shrink-0 w-[180px] md:w-[240px] group"
                            >
                                <Link href={`/shop/${match.product.id}`} className="block">
                                    <div className="relative aspect-[3/4] mb-3 overflow-hidden bg-gray-100">
                                        <Image
                                            src={match.product.image}
                                            alt={match.product.name}
                                            fill
                                            className="object-cover transition duration-700 group-hover:scale-105"
                                        />

                                        {/* Match Score Badge */}
                                        <div className={`absolute top-3 left-3 px-2 py-1 text-xs font-bold tracking-wide ${getScoreColor(match.overallScore)}`}>
                                            {match.overallScore}% Match
                                        </div>

                                        {/* Perfect Match Badge */}
                                        {match.isPerfectMatch && (
                                            <div className="absolute top-3 right-3 bg-black text-white px-2 py-1 text-[10px] font-bold flex items-center gap-1">
                                                <Sparkle className="w-3 h-3" weight="fill" />
                                                PERFECT
                                            </div>
                                        )}

                                        {/* Quick Add Button */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleQuickAdd(match);
                                            }}
                                            className="absolute bottom-3 left-3 right-3 bg-white text-black py-2.5 text-xs tracking-wider font-medium opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-black hover:text-white text-center"
                                        >
                                            QUICK ADD
                                        </button>
                                    </div>
                                </Link>

                                <Link href={`/shop/${match.product.id}`}>
                                    <p className="text-xs text-gray-400 tracking-wider mb-1">
                                        {match.product.category.toUpperCase()}
                                    </p>
                                    <h3 className="text-sm font-medium mb-1 group-hover:underline underline-offset-4 line-clamp-1">
                                        {match.product.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-2">${match.product.price}</p>
                                </Link>

                                {/* Match Reasons */}
                                {match.matchReasons.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {match.matchReasons.slice(0, 2).map((reason, i) => (
                                            <span
                                                key={i}
                                                className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5"
                                            >
                                                <Check className="w-2.5 h-2.5 text-green-500" weight="bold" />
                                                {reason}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* View All Link */}
                <div className="text-center mt-8">
                    <Link
                        href="/shop?filter=for-you"
                        className="inline-flex items-center gap-2 text-sm tracking-wider font-medium hover:underline underline-offset-4"
                    >
                        VIEW ALL RECOMMENDATIONS
                        <CaretRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
