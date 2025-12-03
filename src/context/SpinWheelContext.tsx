"use client";
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

export interface WheelSegment {
  id: string;
  label: string;
  value: number | string;
  type: "percentage" | "fixed" | "freeShipping" | "mystery" | "tryAgain";
  color: string;
  probability: number; // Weight for probability (higher = more likely)
}

export interface SpinResult {
  segment: WheelSegment;
  code: string;
  expiresAt: number;
  usedAt?: number;
}

interface SpinWheelContextType {
  segments: WheelSegment[];
  hasSpun: boolean;
  showWheel: boolean;
  isSpinning: boolean;
  result: SpinResult | null;
  spin: () => Promise<WheelSegment>;
  setShowWheel: (show: boolean) => void;
  dismissWheel: () => void;
  applyReward: () => void;
  isFirstTimeVisitor: boolean;
}

const SpinWheelContext = createContext<SpinWheelContextType | undefined>(undefined);

const DEFAULT_SEGMENTS: WheelSegment[] = [
  { id: "1", label: "10% OFF", value: 10, type: "percentage", color: "#000000", probability: 25 },
  { id: "2", label: "15% OFF", value: 15, type: "percentage", color: "#333333", probability: 20 },
  { id: "3", label: "20% OFF", value: 20, type: "percentage", color: "#000000", probability: 15 },
  { id: "4", label: "FREE SHIPPING", value: "free", type: "freeShipping", color: "#333333", probability: 15 },
  { id: "5", label: "$5 OFF", value: 5, type: "fixed", color: "#000000", probability: 10 },
  { id: "6", label: "25% OFF", value: 25, type: "percentage", color: "#333333", probability: 5 },
  { id: "7", label: "MYSTERY GIFT", value: "mystery", type: "mystery", color: "#000000", probability: 5 },
  { id: "8", label: "TRY AGAIN", value: 0, type: "tryAgain", color: "#333333", probability: 5 },
];

function generatePromoCode(segment: WheelSegment): string {
  const prefix = segment.type === "percentage" ? "SPIN" : 
                 segment.type === "fixed" ? "SAVE" :
                 segment.type === "freeShipping" ? "SHIP" :
                 segment.type === "mystery" ? "MYSTERY" : "LUCK";
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${random}`;
}

function selectWeightedSegment(segments: WheelSegment[]): WheelSegment {
  const totalWeight = segments.reduce((sum, s) => sum + s.probability, 0);
  let random = Math.random() * totalWeight;
  
  for (const segment of segments) {
    random -= segment.probability;
    if (random <= 0) {
      return segment;
    }
  }
  
  return segments[0];
}

export function SpinWheelProvider({ children }: { children: ReactNode }) {
  const [segments] = useState<WheelSegment[]>(DEFAULT_SEGMENTS);
  const [hasSpun, setHasSpun] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [isFirstTimeVisitor, setIsFirstTimeVisitor] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Check if first-time visitor on mount
  useEffect(() => {
    const hasVisited = localStorage.getItem("cipher-has-visited");
    const spinData = localStorage.getItem("cipher-spin-result");
    
    if (!hasVisited) {
      setIsFirstTimeVisitor(true);
      // Show wheel after a short delay for better UX
      const timer = setTimeout(() => {
        setShowWheel(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else if (spinData) {
      try {
        const parsed = JSON.parse(spinData);
        setResult(parsed);
        setHasSpun(true);
      } catch {
        // Invalid data, ignore
      }
    }
    
    setInitialized(true);
  }, []);

  const spin = useCallback(async (): Promise<WheelSegment> => {
    if (hasSpun || isSpinning) {
      throw new Error("Already spun");
    }

    setIsSpinning(true);

    // Select winning segment based on weights
    const winningSegment = selectWeightedSegment(segments);

    // Simulate spin duration
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Generate result
    const spinResult: SpinResult = {
      segment: winningSegment,
      code: winningSegment.type !== "tryAgain" ? generatePromoCode(winningSegment) : "",
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    setResult(spinResult);
    setHasSpun(true);
    setIsSpinning(false);

    // Save to localStorage
    localStorage.setItem("cipher-has-visited", "true");
    if (winningSegment.type !== "tryAgain") {
      localStorage.setItem("cipher-spin-result", JSON.stringify(spinResult));
    }

    return winningSegment;
  }, [hasSpun, isSpinning, segments]);

  const dismissWheel = useCallback(() => {
    setShowWheel(false);
    localStorage.setItem("cipher-has-visited", "true");
    setIsFirstTimeVisitor(false);
  }, []);

  const applyReward = useCallback(() => {
    if (result && result.code) {
      // Copy code to clipboard
      navigator.clipboard.writeText(result.code);
      setShowWheel(false);
    }
  }, [result]);

  return (
    <SpinWheelContext.Provider
      value={{
        segments,
        hasSpun,
        showWheel,
        isSpinning,
        result,
        spin,
        setShowWheel,
        dismissWheel,
        applyReward,
        isFirstTimeVisitor,
      }}
    >
      {children}
    </SpinWheelContext.Provider>
  );
}

export function useSpinWheel() {
  const context = useContext(SpinWheelContext);
  if (!context) {
    throw new Error("useSpinWheel must be used within SpinWheelProvider");
  }
  return context;
}
