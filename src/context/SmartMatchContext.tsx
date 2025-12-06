"use client";
import { createContext, useContext, useCallback, ReactNode } from "react";
import { useProducts, Product, ColorVariant } from "./ProductContext";
import { useSizeRecommendation, UserMeasurements } from "./SizeRecommendationContext";
import { useUserProfile } from "./UserProfileContext";

// Body type classification
export type BodyType = "apple" | "pear" | "hourglass" | "rectangle" | "inverted_triangle" | "unknown";

// Style archetypes
export type StyleArchetype = "minimalist" | "streetwear" | "classic" | "bold" | "unknown";

// Match score breakdown
export interface MatchFactors {
    bodyType: number;      // 0-100
    style: number;         // 0-100
    color: number;         // 0-100
    budget: number;        // 0-100
}

// Product with match score
export interface ProductMatchScore {
    product: Product;
    overallScore: number;  // 0-100
    factors: MatchFactors;
    matchReasons: string[];
    isPerfectMatch: boolean;
}

// Body type to product category suitability mapping
const BODY_TYPE_PRODUCT_SCORES: Record<BodyType, Record<string, number>> = {
    apple: {
        Hoodies: 85,      // Flowy tops work well
        Tees: 70,         // Regular fit okay
        Outerwear: 80,    // Structured jackets flatter
        Pants: 75,        // High-waisted preferred
        Accessories: 90,  // Universal
    },
    pear: {
        Hoodies: 75,      // Balance with volume on top
        Tees: 85,         // Draw attention up
        Outerwear: 90,    // Add volume to upper body
        Pants: 70,        // Darker, simpler bottoms
        Accessories: 90,
    },
    hourglass: {
        Hoodies: 80,      // Fitted styles work
        Tees: 90,         // Fitted tees accentuate
        Outerwear: 85,    // Belted or fitted
        Pants: 90,        // Any style works
        Accessories: 90,
    },
    rectangle: {
        Hoodies: 90,      // Add visual interest
        Tees: 80,         // Layered looks great
        Outerwear: 90,    // Creating shape
        Pants: 85,        // Cargo adds dimension
        Accessories: 90,
    },
    inverted_triangle: {
        Hoodies: 70,      // Avoid bulk on top
        Tees: 85,         // V-necks, simple styles
        Outerwear: 75,    // Avoid shoulder padding
        Pants: 90,        // Volume on bottom balances
        Accessories: 90,
    },
    unknown: {
        Hoodies: 80,
        Tees: 80,
        Outerwear: 80,
        Pants: 80,
        Accessories: 80,
    },
};

// Style archetype to product style mapping
const STYLE_PRODUCT_MAPPING: Record<string, StyleArchetype[]> = {
    // Product characteristics that map to styles
    "black": ["minimalist", "streetwear", "classic"],
    "white": ["minimalist", "classic"],
    "neutral": ["minimalist", "classic"],
    "graphic": ["streetwear", "bold"],
    "oversized": ["streetwear"],
    "fitted": ["classic", "minimalist"],
    "colorful": ["bold"],
    "cargo": ["streetwear"],
    "tactical": ["streetwear", "bold"],
};

// Category to style mapping
const CATEGORY_STYLE_AFFINITY: Record<string, Record<StyleArchetype, number>> = {
    Hoodies: {
        minimalist: 70,
        streetwear: 95,
        classic: 60,
        bold: 80,
        unknown: 75,
    },
    Tees: {
        minimalist: 85,
        streetwear: 90,
        classic: 80,
        bold: 85,
        unknown: 80,
    },
    Pants: {
        minimalist: 75,
        streetwear: 90,
        classic: 85,
        bold: 70,
        unknown: 80,
    },
    Outerwear: {
        minimalist: 80,
        streetwear: 90,
        classic: 85,
        bold: 75,
        unknown: 80,
    },
    Accessories: {
        minimalist: 70,
        streetwear: 90,
        classic: 75,
        bold: 95,
        unknown: 80,
    },
};

// Color harmony groups
const COLOR_FAMILIES: Record<string, string[]> = {
    neutral: ["black", "white", "gray", "grey", "cream", "beige", "nude"],
    earth: ["brown", "tan", "olive", "khaki", "green"],
    cool: ["blue", "navy", "teal", "purple", "lavender"],
    warm: ["red", "orange", "yellow", "coral", "pink"],
};

interface SmartMatchContextType {
    classifyBodyType: (measurements: UserMeasurements) => BodyType;
    getStyleArchetype: () => StyleArchetype;
    calculateProductMatch: (product: Product) => ProductMatchScore;
    getTopMatches: (limit?: number) => ProductMatchScore[];
    getPerfectMatches: () => ProductMatchScore[];
    hasCompleteProfile: () => boolean;
}

const SmartMatchContext = createContext<SmartMatchContextType>({
    classifyBodyType: () => "unknown",
    getStyleArchetype: () => "unknown",
    calculateProductMatch: (p) => ({
        product: p,
        overallScore: 0,
        factors: { bodyType: 0, style: 0, color: 0, budget: 0 },
        matchReasons: [],
        isPerfectMatch: false,
    }),
    getTopMatches: () => [],
    getPerfectMatches: () => [],
    hasCompleteProfile: () => false,
});

export const useSmartMatch = () => useContext(SmartMatchContext);

export const SmartMatchProvider = ({ children }: { children: ReactNode }) => {
    const { products } = useProducts();
    const { measurements } = useSizeRecommendation();
    const { profile } = useUserProfile();

    // Classify body type from measurements
    const classifyBodyType = useCallback((m: UserMeasurements): BodyType => {
        if (!m || !m.chest || !m.waist || !m.hips) return "unknown";

        const { chest, waist, hips } = m;

        // Calculate ratios
        const bustHipRatio = chest / hips;
        const waistHipRatio = waist / hips;
        const waistBustRatio = waist / chest;

        // Classification based on proportions
        // Hourglass: Bust and hips similar, defined waist
        if (Math.abs(bustHipRatio - 1) < 0.1 && waistBustRatio < 0.8) {
            return "hourglass";
        }

        // Pear: Hips larger than bust
        if (bustHipRatio < 0.9 && waistHipRatio < 0.85) {
            return "pear";
        }

        // Apple: Waist larger, bust similar or larger than hips
        if (waistHipRatio > 0.9 && bustHipRatio >= 1) {
            return "apple";
        }

        // Inverted Triangle: Bust significantly larger than hips
        if (bustHipRatio > 1.1) {
            return "inverted_triangle";
        }

        // Rectangle: Similar bust, waist, hips
        if (Math.abs(bustHipRatio - 1) < 0.15 && waistBustRatio > 0.8) {
            return "rectangle";
        }

        return "rectangle"; // Default fallback
    }, []);

    // Get user's style archetype from profile preferences
    const getStyleArchetype = useCallback((): StyleArchetype => {
        if (!profile?.styleQuiz?.answers?.style) {
            // Try to infer from stylePreferences
            const fit = profile?.stylePreferences?.preferredFit;
            if (fit === "oversized") return "streetwear";
            if (fit === "slim") return "minimalist";
            return "unknown";
        }

        const styleAnswer = profile.styleQuiz.answers.style.toLowerCase();

        if (styleAnswer.includes("minimal")) return "minimalist";
        if (styleAnswer.includes("street")) return "streetwear";
        if (styleAnswer.includes("classic") || styleAnswer.includes("timeless")) return "classic";
        if (styleAnswer.includes("bold") || styleAnswer.includes("experiment")) return "bold";

        return "unknown";
    }, [profile]);

    // Calculate color match score
    const calculateColorScore = useCallback((
        productColors: ColorVariant[] | undefined,
        userFavoriteColors: string[]
    ): { score: number; matchedColors: string[] } => {
        if (!productColors || productColors.length === 0 || !userFavoriteColors || userFavoriteColors.length === 0) {
            return { score: 50, matchedColors: [] }; // Neutral score if no data
        }

        const productColorNames = productColors.map(c => c.name.toLowerCase());
        const userColors = userFavoriteColors.map(c => c.toLowerCase());

        let score = 0;
        const matchedColors: string[] = [];

        // Direct color matches (highest value)
        for (const productColor of productColorNames) {
            if (userColors.some(uc => productColor.includes(uc) || uc.includes(productColor))) {
                score += 40;
                matchedColors.push(productColor);
            }
        }

        // Color family matches (medium value)
        for (const [family, colors] of Object.entries(COLOR_FAMILIES)) {
            const productInFamily = productColorNames.some(pc =>
                colors.some(fc => pc.includes(fc))
            );
            const userInFamily = userColors.some(uc =>
                colors.some(fc => uc.includes(fc))
            );

            if (productInFamily && userInFamily) {
                score += 20;
            }
        }

        // Normalize score to 0-100
        return {
            score: Math.min(100, Math.max(0, score)),
            matchedColors
        };
    }, []);

    // Calculate budget score
    const calculateBudgetScore = useCallback((
        price: number,
        priceRange?: { min: number; max: number }
    ): number => {
        if (!priceRange || (priceRange.min === 0 && priceRange.max === 500)) {
            return 70; // No preference set, give moderate score
        }

        const { min, max } = priceRange;

        // Perfect score if within range
        if (price >= min && price <= max) {
            return 100;
        }

        // Gradual falloff outside range
        if (price < min) {
            const diff = (min - price) / min;
            return Math.max(0, 80 - diff * 50);
        }

        if (price > max) {
            const diff = (price - max) / max;
            return Math.max(0, 80 - diff * 80);
        }

        return 50;
    }, []);

    // Calculate full product match score
    const calculateProductMatch = useCallback((product: Product): ProductMatchScore => {
        const matchReasons: string[] = [];

        // 1. Body Type Score
        const bodyType = measurements ? classifyBodyType(measurements) : "unknown";
        const bodyTypeScore = BODY_TYPE_PRODUCT_SCORES[bodyType]?.[product.category] || 70;
        if (bodyTypeScore >= 85) {
            matchReasons.push(`Great for your ${bodyType.replace("_", " ")} body type`);
        }

        // 2. Style Score
        const styleArchetype = getStyleArchetype();
        const styleScore = CATEGORY_STYLE_AFFINITY[product.category]?.[styleArchetype] || 70;
        if (styleScore >= 85) {
            matchReasons.push(`Matches your ${styleArchetype} style`);
        }

        // 3. Color Score
        const favoriteColors = profile?.stylePreferences?.favoriteColors || [];
        const { score: colorScore, matchedColors } = calculateColorScore(product.colors, favoriteColors);
        if (colorScore >= 60 && matchedColors.length > 0) {
            matchReasons.push(`Available in ${matchedColors.slice(0, 2).join(", ")}`);
        }

        // 4. Budget Score
        const priceRange = profile?.stylePreferences?.priceRange;
        const budgetScore = calculateBudgetScore(product.price, priceRange);
        if (budgetScore >= 90) {
            matchReasons.push("Within your budget");
        }

        // Calculate weighted overall score
        // Weights: Style (35%), Body Type (25%), Color (25%), Budget (15%)
        const overallScore = Math.round(
            styleScore * 0.35 +
            bodyTypeScore * 0.25 +
            colorScore * 0.25 +
            budgetScore * 0.15
        );

        const isPerfectMatch = overallScore >= 85;

        if (isPerfectMatch && matchReasons.length === 0) {
            matchReasons.push("Perfect match for you!");
        }

        return {
            product,
            overallScore,
            factors: {
                bodyType: bodyTypeScore,
                style: styleScore,
                color: colorScore,
                budget: budgetScore,
            },
            matchReasons,
            isPerfectMatch,
        };
    }, [measurements, profile, classifyBodyType, getStyleArchetype, calculateColorScore, calculateBudgetScore]);

    // Get top matching products
    const getTopMatches = useCallback((limit = 8): ProductMatchScore[] => {
        return products
            .map(product => calculateProductMatch(product))
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, limit);
    }, [products, calculateProductMatch]);

    // Get only perfect matches (score >= 85)
    const getPerfectMatches = useCallback((): ProductMatchScore[] => {
        return products
            .map(product => calculateProductMatch(product))
            .filter(match => match.isPerfectMatch)
            .sort((a, b) => b.overallScore - a.overallScore);
    }, [products, calculateProductMatch]);

    // Check if user has complete profile for matching
    const hasCompleteProfile = useCallback((): boolean => {
        const hasMeasurements = !!measurements && measurements.height > 0;
        const hasStylePrefs = !!profile?.stylePreferences?.preferredFit ||
            !!profile?.styleQuiz?.completed;
        return hasMeasurements || hasStylePrefs;
    }, [measurements, profile]);

    return (
        <SmartMatchContext.Provider
            value={{
                classifyBodyType,
                getStyleArchetype,
                calculateProductMatch,
                getTopMatches,
                getPerfectMatches,
                hasCompleteProfile,
            }}
        >
            {children}
        </SmartMatchContext.Provider>
    );
};
