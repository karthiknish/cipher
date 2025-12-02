"use client";
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  getDocs,
  Timestamp,
  increment,
  onSnapshot
} from "firebase/firestore";

// Tier Definitions
export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export interface TierBenefits {
  name: string;
  minPoints: number;
  pointsMultiplier: number;
  discountPercentage: number;
  freeShippingThreshold: number;
  earlyAccess: boolean;
  exclusiveProducts: boolean;
  birthdayBonus: number;
  color: string;
  icon: string;
}

export const TIER_CONFIG: Record<LoyaltyTier, TierBenefits> = {
  bronze: {
    name: "Bronze",
    minPoints: 0,
    pointsMultiplier: 1,
    discountPercentage: 0,
    freeShippingThreshold: 100,
    earlyAccess: false,
    exclusiveProducts: false,
    birthdayBonus: 50,
    color: "#CD7F32",
    icon: "🥉",
  },
  silver: {
    name: "Silver",
    minPoints: 500,
    pointsMultiplier: 1.25,
    discountPercentage: 5,
    freeShippingThreshold: 75,
    earlyAccess: false,
    exclusiveProducts: false,
    birthdayBonus: 100,
    color: "#C0C0C0",
    icon: "🥈",
  },
  gold: {
    name: "Gold",
    minPoints: 1500,
    pointsMultiplier: 1.5,
    discountPercentage: 10,
    freeShippingThreshold: 50,
    earlyAccess: true,
    exclusiveProducts: false,
    birthdayBonus: 200,
    color: "#FFD700",
    icon: "🥇",
  },
  platinum: {
    name: "Platinum",
    minPoints: 5000,
    pointsMultiplier: 2,
    discountPercentage: 15,
    freeShippingThreshold: 0,
    earlyAccess: true,
    exclusiveProducts: true,
    birthdayBonus: 500,
    color: "#E5E4E2",
    icon: "💎",
  },
};

// Points earning rates
export const POINTS_CONFIG = {
  purchaseRate: 1, // Points per dollar spent
  reviewPoints: 50, // Points for leaving a review
  reviewWithPhotoPoints: 100, // Points for review with photo/video
  referralPoints: 200, // Points for successful referral
  signupBonus: 100, // Points for new account
  firstPurchaseBonus: 150, // Bonus points for first purchase
  socialSharePoints: 25, // Points for sharing on social media
  birthdayMultiplier: 2, // Birthday month multiplier
};

// Reward redemption options
export interface RewardOption {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: "discount" | "product" | "shipping" | "exclusive";
  value: number; // Dollar value or percentage
  minTier?: LoyaltyTier;
  productId?: string;
  code?: string;
  expiresInDays: number;
}

export const REWARD_OPTIONS: RewardOption[] = [
  {
    id: "discount-5",
    name: "$5 Off",
    description: "Get $5 off your next order",
    pointsCost: 100,
    type: "discount",
    value: 5,
    expiresInDays: 30,
  },
  {
    id: "discount-10",
    name: "$10 Off",
    description: "Get $10 off your next order",
    pointsCost: 200,
    type: "discount",
    value: 10,
    expiresInDays: 30,
  },
  {
    id: "discount-25",
    name: "$25 Off",
    description: "Get $25 off your next order",
    pointsCost: 450,
    type: "discount",
    value: 25,
    expiresInDays: 30,
  },
  {
    id: "discount-50",
    name: "$50 Off",
    description: "Get $50 off your next order",
    pointsCost: 850,
    type: "discount",
    value: 50,
    expiresInDays: 30,
  },
  {
    id: "free-shipping",
    name: "Free Shipping",
    description: "Free shipping on your next order",
    pointsCost: 150,
    type: "shipping",
    value: 100,
    expiresInDays: 60,
  },
  {
    id: "exclusive-product",
    name: "Exclusive Drop Access",
    description: "Get early access to an exclusive product drop",
    pointsCost: 500,
    type: "exclusive",
    value: 0,
    minTier: "gold",
    expiresInDays: 14,
  },
  {
    id: "discount-percent-20",
    name: "20% Off Any Order",
    description: "Get 20% off your entire order",
    pointsCost: 1000,
    type: "discount",
    value: 20,
    minTier: "silver",
    expiresInDays: 30,
  },
];

// Transaction types
export type PointsTransactionType = 
  | "purchase" 
  | "review" 
  | "referral" 
  | "signup" 
  | "birthday" 
  | "social" 
  | "redemption"
  | "bonus"
  | "adjustment"
  | "expiry";

export interface PointsTransaction {
  id: string;
  userId: string;
  type: PointsTransactionType;
  points: number;
  description: string;
  orderId?: string;
  rewardId?: string;
  createdAt: number;
  expiresAt?: number;
}

export interface RedeemedReward {
  id: string;
  rewardId: string;
  rewardName: string;
  pointsSpent: number;
  code: string;
  createdAt: number;
  expiresAt: number;
  usedAt?: number;
  isUsed: boolean;
}

export interface LoyaltyProfile {
  userId: string;
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  currentTier: LoyaltyTier;
  tierProgress: number; // Percentage to next tier
  pointsToNextTier: number;
  joinedAt: number;
  lastActivityAt: number;
  referralCode: string;
  referralCount: number;
  birthday?: string;
  transactions: PointsTransaction[];
  redeemedRewards: RedeemedReward[];
}

interface LoyaltyContextType {
  profile: LoyaltyProfile | null;
  loading: boolean;
  tierConfig: typeof TIER_CONFIG;
  rewardOptions: RewardOption[];
  
  // Points operations
  earnPoints: (type: PointsTransactionType, basePoints: number, description: string, orderId?: string) => Promise<void>;
  redeemReward: (rewardId: string) => Promise<RedeemedReward | null>;
  useReward: (rewardCode: string) => Promise<{ valid: boolean; value: number; type: string } | null>;
  
  // Referral operations
  generateReferralCode: () => string;
  applyReferralCode: (code: string) => Promise<boolean>;
  
  // Profile operations
  setBirthday: (birthday: string) => Promise<void>;
  
  // Calculations
  calculateTier: (points: number) => LoyaltyTier;
  getNextTier: (currentTier: LoyaltyTier) => LoyaltyTier | null;
  getTierProgress: (points: number) => { current: LoyaltyTier; progress: number; pointsToNext: number };
  
  // Admin operations
  adjustPoints: (userId: string, points: number, reason: string) => Promise<void>;
  getAllLoyaltyProfiles: () => Promise<LoyaltyProfile[]>;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export function LoyaltyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate a unique referral code
  const generateReferralCode = useCallback(() => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "CIPHER-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }, []);

  // Calculate tier based on lifetime points
  const calculateTier = useCallback((points: number): LoyaltyTier => {
    if (points >= TIER_CONFIG.platinum.minPoints) return "platinum";
    if (points >= TIER_CONFIG.gold.minPoints) return "gold";
    if (points >= TIER_CONFIG.silver.minPoints) return "silver";
    return "bronze";
  }, []);

  // Get next tier
  const getNextTier = useCallback((currentTier: LoyaltyTier): LoyaltyTier | null => {
    const tiers: LoyaltyTier[] = ["bronze", "silver", "gold", "platinum"];
    const currentIndex = tiers.indexOf(currentTier);
    return currentIndex < tiers.length - 1 ? tiers[currentIndex + 1] : null;
  }, []);

  // Get tier progress
  const getTierProgress = useCallback((points: number): { current: LoyaltyTier; progress: number; pointsToNext: number } => {
    const current = calculateTier(points);
    const nextTier = getNextTier(current);
    
    if (!nextTier) {
      return { current, progress: 100, pointsToNext: 0 };
    }
    
    const currentMin = TIER_CONFIG[current].minPoints;
    const nextMin = TIER_CONFIG[nextTier].minPoints;
    const range = nextMin - currentMin;
    const progress = Math.min(100, Math.round(((points - currentMin) / range) * 100));
    const pointsToNext = Math.max(0, nextMin - points);
    
    return { current, progress, pointsToNext };
  }, [calculateTier, getNextTier]);

  // Initialize or fetch loyalty profile
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const loyaltyRef = doc(db, "loyalty", user.uid);
    
    const unsubscribe = onSnapshot(loyaltyRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as LoyaltyProfile;
        
        // Update tier if needed
        const newTier = calculateTier(data.lifetimePoints);
        const tierProgress = getTierProgress(data.lifetimePoints);
        
        if (newTier !== data.currentTier) {
          await updateDoc(loyaltyRef, { 
            currentTier: newTier,
            tierProgress: tierProgress.progress,
            pointsToNextTier: tierProgress.pointsToNext
          });
        }
        
        setProfile({
          ...data,
          currentTier: newTier,
          tierProgress: tierProgress.progress,
          pointsToNextTier: tierProgress.pointsToNext
        });
      } else {
        // Create new loyalty profile
        const referralCode = generateReferralCode();
        const newProfile: LoyaltyProfile = {
          userId: user.uid,
          totalPoints: POINTS_CONFIG.signupBonus,
          availablePoints: POINTS_CONFIG.signupBonus,
          lifetimePoints: POINTS_CONFIG.signupBonus,
          currentTier: "bronze",
          tierProgress: getTierProgress(POINTS_CONFIG.signupBonus).progress,
          pointsToNextTier: getTierProgress(POINTS_CONFIG.signupBonus).pointsToNext,
          joinedAt: Date.now(),
          lastActivityAt: Date.now(),
          referralCode,
          referralCount: 0,
          transactions: [{
            id: `signup-${Date.now()}`,
            userId: user.uid,
            type: "signup",
            points: POINTS_CONFIG.signupBonus,
            description: "Welcome bonus for joining CIPHER Rewards",
            createdAt: Date.now(),
          }],
          redeemedRewards: [],
        };
        
        await setDoc(loyaltyRef, newProfile);
        setProfile(newProfile);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, calculateTier, generateReferralCode, getTierProgress]);

  // Earn points
  const earnPoints = async (
    type: PointsTransactionType, 
    basePoints: number, 
    description: string, 
    orderId?: string
  ) => {
    if (!user || !profile) return;
    
    // Apply tier multiplier
    const multiplier = TIER_CONFIG[profile.currentTier].pointsMultiplier;
    
    // Check for birthday bonus
    let birthdayMultiplier = 1;
    if (profile.birthday) {
      const today = new Date();
      const birthday = new Date(profile.birthday);
      if (today.getMonth() === birthday.getMonth()) {
        birthdayMultiplier = POINTS_CONFIG.birthdayMultiplier;
      }
    }
    
    const earnedPoints = Math.round(basePoints * multiplier * birthdayMultiplier);
    
    const transaction: PointsTransaction = {
      id: `${type}-${Date.now()}`,
      userId: user.uid,
      type,
      points: earnedPoints,
      description: birthdayMultiplier > 1 
        ? `${description} (Birthday 2x bonus!)` 
        : description,
      orderId,
      createdAt: Date.now(),
    };
    
    const loyaltyRef = doc(db, "loyalty", user.uid);
    const tierProgress = getTierProgress(profile.lifetimePoints + earnedPoints);
    
    await updateDoc(loyaltyRef, {
      totalPoints: increment(earnedPoints),
      availablePoints: increment(earnedPoints),
      lifetimePoints: increment(earnedPoints),
      currentTier: tierProgress.current,
      tierProgress: tierProgress.progress,
      pointsToNextTier: tierProgress.pointsToNext,
      lastActivityAt: Date.now(),
      transactions: [...profile.transactions, transaction],
    });
  };

  // Redeem reward
  const redeemReward = async (rewardId: string): Promise<RedeemedReward | null> => {
    if (!user || !profile) return null;
    
    const reward = REWARD_OPTIONS.find(r => r.id === rewardId);
    if (!reward) return null;
    
    // Check points
    if (profile.availablePoints < reward.pointsCost) return null;
    
    // Check tier requirement
    if (reward.minTier) {
      const tierOrder: LoyaltyTier[] = ["bronze", "silver", "gold", "platinum"];
      const requiredTierIndex = tierOrder.indexOf(reward.minTier);
      const currentTierIndex = tierOrder.indexOf(profile.currentTier);
      if (currentTierIndex < requiredTierIndex) return null;
    }
    
    // Generate unique reward code
    const code = `RWD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const expiresAt = Date.now() + (reward.expiresInDays * 24 * 60 * 60 * 1000);
    
    const redeemedReward: RedeemedReward = {
      id: `redeem-${Date.now()}`,
      rewardId: reward.id,
      rewardName: reward.name,
      pointsSpent: reward.pointsCost,
      code,
      createdAt: Date.now(),
      expiresAt,
      isUsed: false,
    };
    
    const transaction: PointsTransaction = {
      id: `redemption-${Date.now()}`,
      userId: user.uid,
      type: "redemption",
      points: -reward.pointsCost,
      description: `Redeemed: ${reward.name}`,
      rewardId: reward.id,
      createdAt: Date.now(),
    };
    
    const loyaltyRef = doc(db, "loyalty", user.uid);
    await updateDoc(loyaltyRef, {
      availablePoints: increment(-reward.pointsCost),
      lastActivityAt: Date.now(),
      transactions: [...profile.transactions, transaction],
      redeemedRewards: [...profile.redeemedRewards, redeemedReward],
    });
    
    // Also store in rewards collection for easy lookup
    const rewardRef = doc(db, "rewards", code);
    await setDoc(rewardRef, {
      ...redeemedReward,
      rewardType: reward.type,
      rewardValue: reward.value,
    });
    
    return redeemedReward;
  };

  // Use reward code
  const useReward = async (rewardCode: string): Promise<{ valid: boolean; value: number; type: string } | null> => {
    const rewardRef = doc(db, "rewards", rewardCode);
    const rewardSnap = await getDoc(rewardRef);
    
    if (!rewardSnap.exists()) return null;
    
    const rewardData = rewardSnap.data();
    
    if (rewardData.isUsed) return { valid: false, value: 0, type: rewardData.rewardType };
    if (rewardData.expiresAt < Date.now()) return { valid: false, value: 0, type: rewardData.rewardType };
    
    // Mark as used
    await updateDoc(rewardRef, {
      isUsed: true,
      usedAt: Date.now(),
    });
    
    // Update user's loyalty profile
    if (user && profile) {
      const loyaltyRef = doc(db, "loyalty", user.uid);
      const updatedRewards = profile.redeemedRewards.map(r => 
        r.code === rewardCode ? { ...r, isUsed: true, usedAt: Date.now() } : r
      );
      await updateDoc(loyaltyRef, { redeemedRewards: updatedRewards });
    }
    
    return {
      valid: true,
      value: rewardData.rewardValue,
      type: rewardData.rewardType,
    };
  };

  // Apply referral code
  const applyReferralCode = async (code: string): Promise<boolean> => {
    if (!user || !profile) return false;
    
    // Find the referrer
    const loyaltyQuery = query(
      collection(db, "loyalty"),
      where("referralCode", "==", code.toUpperCase())
    );
    
    const querySnap = await getDocs(loyaltyQuery);
    if (querySnap.empty) return false;
    
    const referrerDoc = querySnap.docs[0];
    const referrerId = referrerDoc.id;
    
    // Can't refer yourself
    if (referrerId === user.uid) return false;
    
    // Give points to referrer
    const referrerRef = doc(db, "loyalty", referrerId);
    const referrerData = referrerDoc.data() as LoyaltyProfile;
    
    const referrerTransaction: PointsTransaction = {
      id: `referral-${Date.now()}`,
      userId: referrerId,
      type: "referral",
      points: POINTS_CONFIG.referralPoints,
      description: "Referral bonus - A friend joined using your code!",
      createdAt: Date.now(),
    };
    
    await updateDoc(referrerRef, {
      totalPoints: increment(POINTS_CONFIG.referralPoints),
      availablePoints: increment(POINTS_CONFIG.referralPoints),
      lifetimePoints: increment(POINTS_CONFIG.referralPoints),
      referralCount: increment(1),
      lastActivityAt: Date.now(),
      transactions: [...referrerData.transactions, referrerTransaction],
    });
    
    // Give points to new user
    const userTransaction: PointsTransaction = {
      id: `referral-bonus-${Date.now()}`,
      userId: user.uid,
      type: "referral",
      points: POINTS_CONFIG.referralPoints / 2, // New user gets half
      description: "Referral bonus - Thanks for joining with a friend's code!",
      createdAt: Date.now(),
    };
    
    const loyaltyRef = doc(db, "loyalty", user.uid);
    await updateDoc(loyaltyRef, {
      totalPoints: increment(POINTS_CONFIG.referralPoints / 2),
      availablePoints: increment(POINTS_CONFIG.referralPoints / 2),
      lifetimePoints: increment(POINTS_CONFIG.referralPoints / 2),
      lastActivityAt: Date.now(),
      transactions: [...profile.transactions, userTransaction],
    });
    
    return true;
  };

  // Set birthday
  const setBirthday = async (birthday: string) => {
    if (!user) return;
    
    const loyaltyRef = doc(db, "loyalty", user.uid);
    await updateDoc(loyaltyRef, { birthday });
  };

  // Admin: Adjust points
  const adjustPoints = async (userId: string, points: number, reason: string) => {
    const loyaltyRef = doc(db, "loyalty", userId);
    const loyaltySnap = await getDoc(loyaltyRef);
    
    if (!loyaltySnap.exists()) return;
    
    const loyaltyData = loyaltySnap.data() as LoyaltyProfile;
    
    const transaction: PointsTransaction = {
      id: `adjustment-${Date.now()}`,
      userId,
      type: "adjustment",
      points,
      description: reason,
      createdAt: Date.now(),
    };
    
    const newAvailable = Math.max(0, loyaltyData.availablePoints + points);
    const newTotal = Math.max(0, loyaltyData.totalPoints + points);
    const newLifetime = points > 0 
      ? loyaltyData.lifetimePoints + points 
      : loyaltyData.lifetimePoints;
    
    await updateDoc(loyaltyRef, {
      totalPoints: newTotal,
      availablePoints: newAvailable,
      lifetimePoints: newLifetime,
      lastActivityAt: Date.now(),
      transactions: [...loyaltyData.transactions, transaction],
    });
  };

  // Admin: Get all loyalty profiles
  const getAllLoyaltyProfiles = async (): Promise<LoyaltyProfile[]> => {
    const loyaltyQuery = query(
      collection(db, "loyalty"),
      orderBy("lifetimePoints", "desc"),
      firestoreLimit(100)
    );
    
    const querySnap = await getDocs(loyaltyQuery);
    return querySnap.docs.map(doc => doc.data() as LoyaltyProfile);
  };

  return (
    <LoyaltyContext.Provider value={{
      profile,
      loading,
      tierConfig: TIER_CONFIG,
      rewardOptions: REWARD_OPTIONS,
      earnPoints,
      redeemReward,
      useReward,
      generateReferralCode,
      applyReferralCode,
      setBirthday,
      calculateTier,
      getNextTier,
      getTierProgress,
      adjustPoints,
      getAllLoyaltyProfiles,
    }}>
      {children}
    </LoyaltyContext.Provider>
  );
}

export function useLoyalty() {
  const context = useContext(LoyaltyContext);
  if (context === undefined) {
    throw new Error("useLoyalty must be used within a LoyaltyProvider");
  }
  return context;
}
