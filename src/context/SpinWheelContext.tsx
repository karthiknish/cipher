"use client";
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, doc, getDoc, setDoc, serverTimestamp } from "@/lib/firebase";

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
  spunAt: number; // Timestamp when spin occurred
}

interface SpinWheelContextType {
  segments: WheelSegment[];
  hasSpun: boolean;
  showWheel: boolean;
  isSpinning: boolean;
  result: SpinResult | null;
  canSpinToday: boolean;
  nextSpinTime: Date | null;
  spin: () => Promise<WheelSegment>;
  setShowWheel: (show: boolean) => void;
  dismissWheel: () => void;
  applyReward: () => void;
  isLoading: boolean;
  requiresLogin: boolean;
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

// Helper to check if user can spin today (24 hours since last spin)
function canSpinAgain(lastSpinTime: number): boolean {
  const oneDayMs = 24 * 60 * 60 * 1000;
  return Date.now() - lastSpinTime >= oneDayMs;
}

// Helper to get next spin time
function getNextSpinTime(lastSpinTime: number): Date {
  const oneDayMs = 24 * 60 * 60 * 1000;
  return new Date(lastSpinTime + oneDayMs);
}

export function SpinWheelProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [segments] = useState<WheelSegment[]>(DEFAULT_SEGMENTS);
  const [hasSpun, setHasSpun] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canSpinToday, setCanSpinToday] = useState(false);
  const [nextSpinTime, setNextSpinTime] = useState<Date | null>(null);

  // Require login to spin
  const requiresLogin = !user;

  // Load spin data from Firebase (only for logged-in users)
  useEffect(() => {
    const loadSpinData = async () => {
      // Reset state when user changes
      setResult(null);
      setHasSpun(false);
      setNextSpinTime(null);
      
      if (!user) {
        // Not logged in - can't spin
        setCanSpinToday(false);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // Load from Firebase for logged-in users
        const spinDocRef = doc(db, "spinWheelResults", user.uid);
        const spinDoc = await getDoc(spinDocRef);
        
        if (spinDoc.exists()) {
          const data = spinDoc.data();
          const spinTime = data.spunAt?.toDate?.()?.getTime() || data.spunAt;
          
          if (spinTime) {
            // Check if can spin again (24 hours rule)
            if (canSpinAgain(spinTime)) {
              setCanSpinToday(true);
              setHasSpun(false);
              setResult(null);
            } else {
              setCanSpinToday(false);
              setHasSpun(true);
              setNextSpinTime(getNextSpinTime(spinTime));
              
              // Load the result if reward is still valid
              if (data.expiresAt > Date.now() && data.segment?.type !== "tryAgain") {
                setResult({
                  segment: data.segment,
                  code: data.code,
                  expiresAt: data.expiresAt,
                  spunAt: spinTime,
                });
              }
            }
          }
        } else {
          // First time for this user - can spin
          setCanSpinToday(true);
        }
      } catch (error) {
        console.error("Error loading spin data:", error);
        setCanSpinToday(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadSpinData();
  }, [user]);

  const spin = useCallback(async (): Promise<WheelSegment> => {
    if (!user) {
      throw new Error("Login required to spin");
    }
    
    if (!canSpinToday || isSpinning) {
      throw new Error("Cannot spin right now");
    }

    setIsSpinning(true);

    // Select winning segment based on weights
    const winningSegment = selectWeightedSegment(segments);

    // Simulate spin duration
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const now = Date.now();
    
    // Generate result
    const spinResult: SpinResult = {
      segment: winningSegment,
      code: winningSegment.type !== "tryAgain" ? generatePromoCode(winningSegment) : "",
      expiresAt: now + 7 * 24 * 60 * 60 * 1000, // 7 days
      spunAt: now,
    };

    setResult(spinResult);
    setHasSpun(true);
    setCanSpinToday(false);
    setNextSpinTime(getNextSpinTime(now));
    setIsSpinning(false);

    // Save to Firebase
    try {
      const spinDocRef = doc(db, "spinWheelResults", user.uid);
      await setDoc(spinDocRef, {
        segment: winningSegment,
        code: spinResult.code,
        expiresAt: spinResult.expiresAt,
        spunAt: now,
        userId: user.uid,
        userEmail: user.email,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving spin result:", error);
    }

    return winningSegment;
  }, [user, canSpinToday, isSpinning, segments]);

  const dismissWheel = useCallback(() => {
    setShowWheel(false);
  }, []);

  const applyReward = useCallback(() => {
    if (result && result.code) {
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
        canSpinToday,
        nextSpinTime,
        spin,
        setShowWheel,
        dismissWheel,
        applyReward,
        isLoading,
        requiresLogin,
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
