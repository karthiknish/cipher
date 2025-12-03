"use client";
import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { db, doc, getDoc, setDoc, updateDoc, serverTimestamp } from "@/lib/firebase";

export type BadgeCategory = 
  | "shopping" 
  | "engagement" 
  | "social" 
  | "loyalty" 
  | "special" 
  | "creator";

export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  requirement: {
    type: string;
    value: number;
    description: string;
  };
  points: number;
  unlockedCount: number; // How many users have this badge
}

export interface UserBadge {
  badgeId: string;
  unlockedAt: number;
  progress: number; // 0-100
  isNew: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  milestones: {
    level: number;
    name: string;
    requirement: number;
    badgeId: string;
    points: number;
  }[];
  currentValue: number;
  icon: string;
}

export interface UserAchievements {
  userId: string;
  badges: UserBadge[];
  totalPoints: number;
  rank: number;
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string;
  };
  stats: {
    totalPurchases: number;
    totalSpent: number;
    reviewsWritten: number;
    referrals: number;
    challengesEntered: number;
    challengesWon: number;
    votesGiven: number;
    itemsWishlisted: number;
    daysAsMember: number;
  };
}

interface AchievementContextType {
  badges: Badge[];
  achievements: Achievement[];
  userAchievements: UserAchievements | null;
  loading: boolean;
  getUserBadges: () => (Badge & { unlockedAt: number; isNew: boolean })[];
  getLockedBadges: () => (Badge & { progress: number })[];
  getBadgeById: (id: string) => Badge | null;
  hasBadge: (badgeId: string) => boolean;
  markBadgeAsSeen: (badgeId: string) => void;
  getNewBadgesCount: () => number;
  checkAndUnlockBadges: () => Promise<Badge[]>;
  unlockBadge: (badgeId: string) => Promise<boolean>;
  updateStats: (stats: Partial<UserAchievements["stats"]>) => Promise<void>;
  getLeaderboard: () => { userId: string; userName: string; points: number; badgeCount: number }[];
  getAchievementProgress: (achievementId: string) => { current: number; next: number; progress: number } | null;
}

// Badge definitions
const ALL_BADGES: Badge[] = [
  // Shopping Badges
  {
    id: "first-purchase",
    name: "First Steps",
    description: "Complete your first purchase",
    icon: "🛍️",
    category: "shopping",
    rarity: "common",
    requirement: { type: "purchases", value: 1, description: "Make 1 purchase" },
    points: 100,
    unlockedCount: 15420,
  },
  {
    id: "big-spender-1",
    name: "Big Spender",
    description: "Spend $500 on CIPHER products",
    icon: "💰",
    category: "shopping",
    rarity: "rare",
    requirement: { type: "total_spent", value: 500, description: "Spend $500" },
    points: 500,
    unlockedCount: 3240,
  },
  {
    id: "big-spender-2",
    name: "Whale Status",
    description: "Spend $2000 on CIPHER products",
    icon: "🐋",
    category: "shopping",
    rarity: "epic",
    requirement: { type: "total_spent", value: 2000, description: "Spend $2000" },
    points: 2000,
    unlockedCount: 456,
  },
  {
    id: "collector-1",
    name: "Collector",
    description: "Own 10 CIPHER products",
    icon: "📦",
    category: "shopping",
    rarity: "rare",
    requirement: { type: "products_owned", value: 10, description: "Own 10 products" },
    points: 300,
    unlockedCount: 2100,
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Purchase from a new drop within 24 hours",
    icon: "🐦",
    category: "shopping",
    rarity: "rare",
    requirement: { type: "early_purchase", value: 1, description: "Buy within 24h of drop" },
    points: 250,
    unlockedCount: 1890,
  },

  // Engagement Badges
  {
    id: "first-review",
    name: "Voice Heard",
    description: "Write your first product review",
    icon: "✍️",
    category: "engagement",
    rarity: "common",
    requirement: { type: "reviews", value: 1, description: "Write 1 review" },
    points: 50,
    unlockedCount: 8900,
  },
  {
    id: "reviewer-pro",
    name: "Trusted Reviewer",
    description: "Write 10 product reviews",
    icon: "⭐",
    category: "engagement",
    rarity: "rare",
    requirement: { type: "reviews", value: 10, description: "Write 10 reviews" },
    points: 500,
    unlockedCount: 1200,
  },
  {
    id: "wishlist-master",
    name: "Wishlist Master",
    description: "Add 25 items to your wishlist",
    icon: "💝",
    category: "engagement",
    rarity: "common",
    requirement: { type: "wishlist", value: 25, description: "Wishlist 25 items" },
    points: 100,
    unlockedCount: 5600,
  },

  // Social Badges
  {
    id: "first-referral",
    name: "Connector",
    description: "Refer your first friend",
    icon: "🤝",
    category: "social",
    rarity: "common",
    requirement: { type: "referrals", value: 1, description: "Refer 1 friend" },
    points: 200,
    unlockedCount: 4500,
  },
  {
    id: "influencer",
    name: "Influencer",
    description: "Refer 10 friends who make purchases",
    icon: "📢",
    category: "social",
    rarity: "epic",
    requirement: { type: "referrals", value: 10, description: "Refer 10 friends" },
    points: 1000,
    unlockedCount: 320,
  },
  {
    id: "community-pillar",
    name: "Community Pillar",
    description: "Refer 25 friends who make purchases",
    icon: "🏛️",
    category: "social",
    rarity: "legendary",
    requirement: { type: "referrals", value: 25, description: "Refer 25 friends" },
    points: 5000,
    unlockedCount: 45,
  },

  // Loyalty Badges
  {
    id: "week-streak",
    name: "Weekly Warrior",
    description: "Visit the store 7 days in a row",
    icon: "🔥",
    category: "loyalty",
    rarity: "common",
    requirement: { type: "streak", value: 7, description: "7-day visit streak" },
    points: 150,
    unlockedCount: 6700,
  },
  {
    id: "month-streak",
    name: "Dedicated Fan",
    description: "Visit the store 30 days in a row",
    icon: "💪",
    category: "loyalty",
    rarity: "rare",
    requirement: { type: "streak", value: 30, description: "30-day visit streak" },
    points: 750,
    unlockedCount: 890,
  },
  {
    id: "year-member",
    name: "OG Member",
    description: "Be a member for 1 year",
    icon: "🎂",
    category: "loyalty",
    rarity: "epic",
    requirement: { type: "membership_days", value: 365, description: "1 year membership" },
    points: 1500,
    unlockedCount: 2340,
  },
  {
    id: "founding-member",
    name: "Founding Member",
    description: "Be among the first 1000 members",
    icon: "🏆",
    category: "loyalty",
    rarity: "legendary",
    requirement: { type: "founding", value: 1000, description: "First 1000 members" },
    points: 3000,
    unlockedCount: 1000,
  },

  // Style Challenge Badges
  {
    id: "first-challenge",
    name: "Challenger",
    description: "Enter your first style challenge",
    icon: "🎯",
    category: "creator",
    rarity: "common",
    requirement: { type: "challenges_entered", value: 1, description: "Enter 1 challenge" },
    points: 100,
    unlockedCount: 3400,
  },
  {
    id: "challenge-winner",
    name: "Style Champion",
    description: "Win a style challenge",
    icon: "👑",
    category: "creator",
    rarity: "epic",
    requirement: { type: "challenges_won", value: 1, description: "Win 1 challenge" },
    points: 2000,
    unlockedCount: 156,
  },
  {
    id: "triple-crown",
    name: "Triple Crown",
    description: "Win 3 style challenges",
    icon: "👸",
    category: "creator",
    rarity: "legendary",
    requirement: { type: "challenges_won", value: 3, description: "Win 3 challenges" },
    points: 5000,
    unlockedCount: 23,
  },
  {
    id: "voter",
    name: "Democracy Supporter",
    description: "Vote on 50 challenge submissions",
    icon: "🗳️",
    category: "creator",
    rarity: "rare",
    requirement: { type: "votes_given", value: 50, description: "Cast 50 votes" },
    points: 300,
    unlockedCount: 1890,
  },

  // Special Badges
  {
    id: "beta-tester",
    name: "Beta Tester",
    description: "Helped test new features",
    icon: "🧪",
    category: "special",
    rarity: "legendary",
    requirement: { type: "special", value: 1, description: "Beta program participant" },
    points: 1000,
    unlockedCount: 250,
  },
  {
    id: "holiday-shopper",
    name: "Holiday Spirit",
    description: "Made a purchase during holiday season",
    icon: "🎄",
    category: "special",
    rarity: "rare",
    requirement: { type: "special", value: 1, description: "Holiday purchase" },
    points: 200,
    unlockedCount: 8900,
  },
];

// Sample user achievements
const SAMPLE_USER_ACHIEVEMENTS: UserAchievements = {
  userId: "current-user",
  badges: [
    { badgeId: "first-purchase", unlockedAt: Date.now() - 90 * 24 * 60 * 60 * 1000, progress: 100, isNew: false },
    { badgeId: "first-review", unlockedAt: Date.now() - 60 * 24 * 60 * 60 * 1000, progress: 100, isNew: false },
    { badgeId: "first-referral", unlockedAt: Date.now() - 30 * 24 * 60 * 60 * 1000, progress: 100, isNew: false },
    { badgeId: "week-streak", unlockedAt: Date.now() - 14 * 24 * 60 * 60 * 1000, progress: 100, isNew: false },
    { badgeId: "wishlist-master", unlockedAt: Date.now() - 7 * 24 * 60 * 60 * 1000, progress: 100, isNew: false },
    { badgeId: "first-challenge", unlockedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, progress: 100, isNew: true },
  ],
  totalPoints: 700,
  rank: 1245,
  streak: {
    current: 12,
    longest: 23,
    lastActiveDate: new Date().toISOString().split("T")[0],
  },
  stats: {
    totalPurchases: 5,
    totalSpent: 420,
    reviewsWritten: 3,
    referrals: 2,
    challengesEntered: 1,
    challengesWon: 0,
    votesGiven: 15,
    itemsWishlisted: 28,
    daysAsMember: 95,
  },
};

const AchievementContext = createContext<AchievementContextType>({
  badges: [],
  achievements: [],
  userAchievements: null,
  loading: true,
  getUserBadges: () => [],
  getLockedBadges: () => [],
  getBadgeById: () => null,
  hasBadge: () => false,
  markBadgeAsSeen: () => {},
  getNewBadgesCount: () => 0,
  checkAndUnlockBadges: async () => [],
  unlockBadge: async () => false,
  updateStats: async () => {},
  getLeaderboard: () => [],
  getAchievementProgress: () => null,
});

export const useAchievements = () => useContext(AchievementContext);

export const AchievementProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [badges] = useState<Badge[]>(ALL_BADGES);
  const [achievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievements | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user achievements from Firebase
  useEffect(() => {
    const loadUserAchievements = async () => {
      if (!user) {
        setUserAchievements(null);
        setLoading(false);
        return;
      }

      try {
        const userAchievementsRef = doc(db, "userAchievements", user.uid);
        const snapshot = await getDoc(userAchievementsRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserAchievements({
            userId: user.uid,
            badges: data.badges || [],
            totalPoints: data.totalPoints || 0,
            rank: data.rank || 0,
            streak: data.streak || { current: 0, longest: 0, lastActiveDate: "" },
            stats: data.stats || {
              totalPurchases: 0,
              totalSpent: 0,
              reviewsWritten: 0,
              referrals: 0,
              challengesEntered: 0,
              challengesWon: 0,
              votesGiven: 0,
              itemsWishlisted: 0,
              daysAsMember: 0,
            },
          });
        } else {
          // Create initial achievements document for new user
          const initialAchievements: UserAchievements = {
            userId: user.uid,
            badges: [],
            totalPoints: 0,
            rank: 0,
            streak: { current: 0, longest: 0, lastActiveDate: new Date().toISOString().split("T")[0] },
            stats: {
              totalPurchases: 0,
              totalSpent: 0,
              reviewsWritten: 0,
              referrals: 0,
              challengesEntered: 0,
              challengesWon: 0,
              votesGiven: 0,
              itemsWishlisted: 0,
              daysAsMember: Math.floor((Date.now() - (user.metadata.creationTime ? new Date(user.metadata.creationTime).getTime() : Date.now())) / (1000 * 60 * 60 * 24)),
            },
          };
          await setDoc(userAchievementsRef, {
            ...initialAchievements,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setUserAchievements(initialAchievements);
        }
      } catch (error) {
        console.error("Error loading user achievements:", error);
        // Fallback to empty achievements
        setUserAchievements({
          userId: user.uid,
          badges: [],
          totalPoints: 0,
          rank: 0,
          streak: { current: 0, longest: 0, lastActiveDate: "" },
          stats: {
            totalPurchases: 0,
            totalSpent: 0,
            reviewsWritten: 0,
            referrals: 0,
            challengesEntered: 0,
            challengesWon: 0,
            votesGiven: 0,
            itemsWishlisted: 0,
            daysAsMember: 0,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserAchievements();
  }, [user]);

  const getUserBadges = useCallback(() => {
    if (!userAchievements) return [];
    return userAchievements.badges
      .map(ub => {
        const badge = badges.find(b => b.id === ub.badgeId);
        if (!badge) return null;
        return { ...badge, unlockedAt: ub.unlockedAt, isNew: ub.isNew };
      })
      .filter((b): b is Badge & { unlockedAt: number; isNew: boolean } => b !== null)
      .sort((a, b) => b.unlockedAt - a.unlockedAt);
  }, [userAchievements, badges]);

  const getLockedBadges = useCallback(() => {
    if (!userAchievements) {
      return badges.map(b => ({ ...b, progress: 0 }));
    }
    const unlockedIds = new Set(userAchievements.badges.map(ub => ub.badgeId));
    return badges
      .filter(b => !unlockedIds.has(b.id))
      .map(b => {
        // Calculate progress based on requirement type
        let progress = 0;
        const stats = userAchievements.stats;
        switch (b.requirement.type) {
          case "purchases":
            progress = Math.min(100, (stats.totalPurchases / b.requirement.value) * 100);
            break;
          case "total_spent":
            progress = Math.min(100, (stats.totalSpent / b.requirement.value) * 100);
            break;
          case "reviews":
            progress = Math.min(100, (stats.reviewsWritten / b.requirement.value) * 100);
            break;
          case "referrals":
            progress = Math.min(100, (stats.referrals / b.requirement.value) * 100);
            break;
          case "streak":
            progress = Math.min(100, (userAchievements.streak.longest / b.requirement.value) * 100);
            break;
          case "challenges_entered":
            progress = Math.min(100, (stats.challengesEntered / b.requirement.value) * 100);
            break;
          case "challenges_won":
            progress = Math.min(100, (stats.challengesWon / b.requirement.value) * 100);
            break;
          case "votes_given":
            progress = Math.min(100, (stats.votesGiven / b.requirement.value) * 100);
            break;
          case "wishlist":
            progress = Math.min(100, (stats.itemsWishlisted / b.requirement.value) * 100);
            break;
          case "membership_days":
            progress = Math.min(100, (stats.daysAsMember / b.requirement.value) * 100);
            break;
        }
        return { ...b, progress };
      });
  }, [userAchievements, badges]);

  const getBadgeById = useCallback((id: string) => {
    return badges.find(b => b.id === id) || null;
  }, [badges]);

  const hasBadge = useCallback((badgeId: string) => {
    return userAchievements?.badges.some(ub => ub.badgeId === badgeId) || false;
  }, [userAchievements]);

  const markBadgeAsSeen = useCallback((badgeId: string) => {
    setUserAchievements(prev => {
      if (!prev) return null;
      return {
        ...prev,
        badges: prev.badges.map(ub => 
          ub.badgeId === badgeId ? { ...ub, isNew: false } : ub
        ),
      };
    });
  }, []);

  const getNewBadgesCount = useCallback(() => {
    return userAchievements?.badges.filter(ub => ub.isNew).length || 0;
  }, [userAchievements]);

  // Unlock a badge and save to Firebase
  const unlockBadge = useCallback(async (badgeId: string): Promise<boolean> => {
    if (!user || !userAchievements) return false;
    
    // Check if already has badge
    if (userAchievements.badges.some(ub => ub.badgeId === badgeId)) {
      return false;
    }

    const badge = badges.find(b => b.id === badgeId);
    if (!badge) return false;

    const newUserBadge: UserBadge = {
      badgeId,
      unlockedAt: Date.now(),
      progress: 100,
      isNew: true,
    };

    const updatedBadges = [...userAchievements.badges, newUserBadge];
    const updatedPoints = userAchievements.totalPoints + badge.points;

    try {
      const userAchievementsRef = doc(db, "userAchievements", user.uid);
      await updateDoc(userAchievementsRef, {
        badges: updatedBadges,
        totalPoints: updatedPoints,
        updatedAt: serverTimestamp(),
      });

      setUserAchievements(prev => prev ? {
        ...prev,
        badges: updatedBadges,
        totalPoints: updatedPoints,
      } : null);

      return true;
    } catch (error) {
      console.error("Error unlocking badge:", error);
      return false;
    }
  }, [user, userAchievements, badges]);

  // Update user stats and check for badge unlocks
  const updateStats = useCallback(async (newStats: Partial<UserAchievements["stats"]>): Promise<void> => {
    if (!user || !userAchievements) return;

    const updatedStats = { ...userAchievements.stats, ...newStats };

    try {
      const userAchievementsRef = doc(db, "userAchievements", user.uid);
      await updateDoc(userAchievementsRef, {
        stats: updatedStats,
        updatedAt: serverTimestamp(),
      });

      setUserAchievements(prev => prev ? {
        ...prev,
        stats: updatedStats,
      } : null);

      // Check for badge unlocks based on new stats
      const badgesToUnlock: string[] = [];
      
      // Check purchase badges
      if (updatedStats.totalPurchases >= 1 && !userAchievements.badges.some(b => b.badgeId === "first-purchase")) {
        badgesToUnlock.push("first-purchase");
      }
      
      // Check spending badges
      if (updatedStats.totalSpent >= 500 && !userAchievements.badges.some(b => b.badgeId === "big-spender-1")) {
        badgesToUnlock.push("big-spender-1");
      }
      if (updatedStats.totalSpent >= 2000 && !userAchievements.badges.some(b => b.badgeId === "big-spender-2")) {
        badgesToUnlock.push("big-spender-2");
      }

      // Check review badges
      if (updatedStats.reviewsWritten >= 1 && !userAchievements.badges.some(b => b.badgeId === "first-review")) {
        badgesToUnlock.push("first-review");
      }
      if (updatedStats.reviewsWritten >= 10 && !userAchievements.badges.some(b => b.badgeId === "reviewer-pro")) {
        badgesToUnlock.push("reviewer-pro");
      }

      // Check referral badges
      if (updatedStats.referrals >= 1 && !userAchievements.badges.some(b => b.badgeId === "first-referral")) {
        badgesToUnlock.push("first-referral");
      }
      if (updatedStats.referrals >= 10 && !userAchievements.badges.some(b => b.badgeId === "influencer")) {
        badgesToUnlock.push("influencer");
      }

      // Check wishlist badges
      if (updatedStats.itemsWishlisted >= 25 && !userAchievements.badges.some(b => b.badgeId === "wishlist-master")) {
        badgesToUnlock.push("wishlist-master");
      }

      // Check challenge badges
      if (updatedStats.challengesEntered >= 1 && !userAchievements.badges.some(b => b.badgeId === "first-challenge")) {
        badgesToUnlock.push("first-challenge");
      }
      if (updatedStats.challengesWon >= 1 && !userAchievements.badges.some(b => b.badgeId === "challenge-winner")) {
        badgesToUnlock.push("challenge-winner");
      }

      // Unlock badges
      for (const badgeId of badgesToUnlock) {
        await unlockBadge(badgeId);
      }
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  }, [user, userAchievements, unlockBadge]);

  const checkAndUnlockBadges = useCallback(async (): Promise<Badge[]> => {
    // This would normally check server-side
    // For now, return empty array (badges are unlocked through actions)
    return [];
  }, []);

  const getLeaderboard = useCallback(() => {
    // Sample leaderboard data
    return [
      { userId: "user-1", userName: "StyleKing", points: 12500, badgeCount: 18 },
      { userId: "user-2", userName: "FashionQueen", points: 11200, badgeCount: 16 },
      { userId: "user-3", userName: "StreetLegend", points: 9800, badgeCount: 15 },
      { userId: "user-4", userName: "TrendSetter", points: 8500, badgeCount: 14 },
      { userId: "user-5", userName: "VibeMaster", points: 7200, badgeCount: 12 },
    ];
  }, []);

  const getAchievementProgress = useCallback((achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return null;
    
    const currentMilestone = achievement.milestones.find(
      m => achievement.currentValue < m.requirement
    );
    const prevMilestone = achievement.milestones
      .filter(m => achievement.currentValue >= m.requirement)
      .pop();

    const prevValue = prevMilestone?.requirement || 0;
    const nextValue = currentMilestone?.requirement || achievement.milestones[achievement.milestones.length - 1].requirement;
    const progress = ((achievement.currentValue - prevValue) / (nextValue - prevValue)) * 100;

    return { current: achievement.currentValue, next: nextValue, progress };
  }, [achievements]);

  return (
    <AchievementContext.Provider value={{
      badges,
      achievements,
      userAchievements,
      loading,
      getUserBadges,
      getLockedBadges,
      getBadgeById,
      hasBadge,
      markBadgeAsSeen,
      getNewBadgesCount,
      checkAndUnlockBadges,
      unlockBadge,
      updateStats,
      getLeaderboard,
      getAchievementProgress,
    }}>
      {children}
    </AchievementContext.Provider>
  );
};
