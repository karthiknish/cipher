"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { db, doc, getDoc, setDoc } from "@/lib/firebase";

export interface UserMeasurements {
  height: number; // in cm
  weight: number; // in kg
  chest: number; // in cm
  waist: number; // in cm
  hips: number; // in cm
  fitPreference: "slim" | "regular" | "relaxed";
}

export interface SizeRecommendation {
  recommendedSize: string;
  confidence: number; // 0-100
  alternativeSize?: string;
  notes: string;
}

// Size charts for different product categories (in cm)
const SIZE_CHARTS = {
  Tees: {
    XS: { chest: [84, 88], waist: [70, 74], length: 66 },
    S: { chest: [88, 92], waist: [74, 78], length: 68 },
    M: { chest: [92, 98], waist: [78, 84], length: 70 },
    L: { chest: [98, 104], waist: [84, 90], length: 72 },
    XL: { chest: [104, 110], waist: [90, 96], length: 74 },
    XXL: { chest: [110, 118], waist: [96, 104], length: 76 },
  },
  Hoodies: {
    XS: { chest: [86, 92], waist: [72, 78], length: 62 },
    S: { chest: [92, 98], waist: [78, 84], length: 64 },
    M: { chest: [98, 104], waist: [84, 90], length: 66 },
    L: { chest: [104, 110], waist: [90, 96], length: 68 },
    XL: { chest: [110, 118], waist: [96, 104], length: 70 },
    XXL: { chest: [118, 126], waist: [104, 112], length: 72 },
  },
  Outerwear: {
    XS: { chest: [88, 94], waist: [74, 80], length: 64 },
    S: { chest: [94, 100], waist: [80, 86], length: 66 },
    M: { chest: [100, 106], waist: [86, 92], length: 68 },
    L: { chest: [106, 114], waist: [92, 100], length: 70 },
    XL: { chest: [114, 122], waist: [100, 108], length: 72 },
    XXL: { chest: [122, 130], waist: [108, 116], length: 74 },
  },
  Pants: {
    XS: { waist: [68, 72], hips: [86, 90], inseam: 76 },
    S: { waist: [72, 78], hips: [90, 96], inseam: 78 },
    M: { waist: [78, 84], hips: [96, 102], inseam: 80 },
    L: { waist: [84, 92], hips: [102, 110], inseam: 82 },
    XL: { waist: [92, 100], hips: [110, 118], inseam: 82 },
    XXL: { waist: [100, 110], hips: [118, 128], inseam: 82 },
  },
};

// Estimate body measurements from height and weight
function estimateMeasurements(height: number, weight: number): { chest: number; waist: number; hips: number } {
  // BMI-based estimation (simplified model)
  const bmi = weight / ((height / 100) ** 2);
  
  // Base measurements adjusted for BMI
  const baseChest = height * 0.52;
  const baseWaist = height * 0.42;
  const baseHips = height * 0.53;
  
  // Adjust for BMI (higher BMI = larger measurements)
  const bmiAdjustment = (bmi - 22) * 1.5; // 22 is "average" BMI
  
  return {
    chest: Math.round(baseChest + bmiAdjustment),
    waist: Math.round(baseWaist + bmiAdjustment * 1.2),
    hips: Math.round(baseHips + bmiAdjustment * 0.8),
  };
}

interface SizeContextType {
  measurements: UserMeasurements | null;
  saveMeasurements: (measurements: UserMeasurements) => Promise<void>;
  getRecommendation: (category: string, availableSizes: string[]) => SizeRecommendation | null;
  estimateFromHeightWeight: (height: number, weight: number) => { chest: number; waist: number; hips: number };
  loading: boolean;
}

const SizeContext = createContext<SizeContextType>({
  measurements: null,
  saveMeasurements: async () => {},
  getRecommendation: () => null,
  estimateFromHeightWeight: () => ({ chest: 0, waist: 0, hips: 0 }),
  loading: true,
});

export const useSizeRecommendation = () => useContext(SizeContext);

const MEASUREMENTS_STORAGE_KEY = "cipher_measurements";

export const SizeRecommendationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<UserMeasurements | null>(null);
  const [loading, setLoading] = useState(true);

  // Load measurements on mount
  useEffect(() => {
    const loadMeasurements = async () => {
      setLoading(true);
      
      if (user) {
        try {
          const measurementsDoc = await getDoc(doc(db, "userMeasurements", user.uid));
          if (measurementsDoc.exists()) {
            setMeasurements(measurementsDoc.data() as UserMeasurements);
          }
        } catch (error) {
          console.error("Error loading measurements:", error);
        }
      } else if (typeof window !== "undefined") {
        const stored = localStorage.getItem(MEASUREMENTS_STORAGE_KEY);
        if (stored) {
          try {
            setMeasurements(JSON.parse(stored));
          } catch {
            console.error("Failed to parse measurements from storage");
          }
        }
      }
      
      setLoading(false);
    };

    loadMeasurements();
  }, [user]);

  const saveMeasurements = useCallback(async (newMeasurements: UserMeasurements) => {
    setMeasurements(newMeasurements);
    
    if (user) {
      try {
        await setDoc(doc(db, "userMeasurements", user.uid), newMeasurements);
      } catch (error) {
        console.error("Error saving measurements:", error);
      }
    } else if (typeof window !== "undefined") {
      localStorage.setItem(MEASUREMENTS_STORAGE_KEY, JSON.stringify(newMeasurements));
    }
  }, [user]);

  const getRecommendation = useCallback((
    category: string, 
    availableSizes: string[]
  ): SizeRecommendation | null => {
    if (!measurements) return null;

    const sizeChart = SIZE_CHARTS[category as keyof typeof SIZE_CHARTS];
    if (!sizeChart) return null;

    const { chest, waist, hips, fitPreference } = measurements;
    
    // Adjust measurements based on fit preference
    let adjustedChest = chest;
    let adjustedWaist = waist;
    
    if (fitPreference === "slim") {
      adjustedChest -= 2;
      adjustedWaist -= 2;
    } else if (fitPreference === "relaxed") {
      adjustedChest += 4;
      adjustedWaist += 4;
    }

    // Find best matching size
    let bestSize = "M";
    let bestScore = Infinity;
    let scores: Record<string, number> = {};

    const sizes = Object.keys(sizeChart) as Array<keyof typeof sizeChart>;
    
    for (const size of sizes) {
      if (!availableSizes.includes(size)) continue;
      
      const sizeData = sizeChart[size];
      let score = 0;
      
      // Check chest fit
      if ("chest" in sizeData) {
        const [minChest, maxChest] = sizeData.chest;
        if (adjustedChest < minChest) score += (minChest - adjustedChest) * 2;
        else if (adjustedChest > maxChest) score += (adjustedChest - maxChest) * 2;
      }
      
      // Check waist fit
      if ("waist" in sizeData) {
        const [minWaist, maxWaist] = sizeData.waist;
        if (adjustedWaist < minWaist) score += (minWaist - adjustedWaist) * 1.5;
        else if (adjustedWaist > maxWaist) score += (adjustedWaist - maxWaist) * 1.5;
      }
      
      // Check hips fit (for pants)
      if ("hips" in sizeData && hips) {
        const [minHips, maxHips] = sizeData.hips;
        if (hips < minHips) score += (minHips - hips);
        else if (hips > maxHips) score += (hips - maxHips);
      }
      
      scores[size] = score;
      
      if (score < bestScore) {
        bestScore = score;
        bestSize = size;
      }
    }

    // Calculate confidence (lower score = higher confidence)
    const maxScore = 30; // Arbitrary max for normalization
    const confidence = Math.max(0, Math.min(100, Math.round((1 - bestScore / maxScore) * 100)));

    // Find alternative size
    const sortedSizes = Object.entries(scores)
      .sort(([, a], [, b]) => a - b)
      .map(([size]) => size);
    
    const alternativeSize = sortedSizes[1] !== bestSize ? sortedSizes[1] : undefined;

    // Generate notes
    let notes = "";
    if (confidence >= 80) {
      notes = `${bestSize} should be a great fit for you!`;
    } else if (confidence >= 60) {
      notes = `${bestSize} is recommended. ${alternativeSize ? `You might also try ${alternativeSize}.` : ""}`;
    } else {
      notes = `Based on your measurements, we suggest ${bestSize}. Consider checking our size guide for more details.`;
    }

    if (fitPreference === "slim") {
      notes += " (Adjusted for slim fit preference)";
    } else if (fitPreference === "relaxed") {
      notes += " (Adjusted for relaxed fit preference)";
    }

    return {
      recommendedSize: bestSize,
      confidence,
      alternativeSize,
      notes,
    };
  }, [measurements]);

  return (
    <SizeContext.Provider
      value={{
        measurements,
        saveMeasurements,
        getRecommendation,
        estimateFromHeightWeight: estimateMeasurements,
        loading,
      }}
    >
      {children}
    </SizeContext.Provider>
  );
};
