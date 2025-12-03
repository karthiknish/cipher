"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Trophy,
  Medal,
  Star,
  Crown,
  Fire,
  Lightning,
  Heart,
  Gift,
  Users,
  Target,
  CheckCircle,
  Lock,
  CaretRight,
  Info,
  SpinnerGap,
  X,
} from "@phosphor-icons/react";
import { useAchievements, Badge, BadgeCategory, BadgeRarity } from "@/context/AchievementContext";
import { useAuth } from "@/context/AuthContext";

// Category icons and colors
const CATEGORY_CONFIG: Record<BadgeCategory, { icon: React.ElementType; label: string; color: string }> = {
  shopping: { icon: Gift, label: "Shopping", color: "bg-gray-100" },
  engagement: { icon: Star, label: "Engagement", color: "bg-gray-100" },
  social: { icon: Users, label: "Social", color: "bg-gray-100" },
  loyalty: { icon: Heart, label: "Loyalty", color: "bg-gray-100" },
  creator: { icon: Crown, label: "Creator", color: "bg-gray-100" },
  special: { icon: Lightning, label: "Special", color: "bg-gray-100" },
};

// Rarity config
const RARITY_CONFIG: Record<BadgeRarity, { label: string; border: string; bg: string }> = {
  common: { label: "Common", border: "border-gray-300", bg: "bg-gray-50" },
  rare: { label: "Rare", border: "border-gray-500", bg: "bg-gray-100" },
  epic: { label: "Epic", border: "border-gray-700", bg: "bg-gray-200" },
  legendary: { label: "Legendary", border: "border-black", bg: "bg-black" },
};

// Badge Card Component
function BadgeCard({
  badge,
  isUnlocked,
  unlockedAt,
  isNew,
  progress,
  onView,
}: {
  badge: Badge;
  isUnlocked: boolean;
  unlockedAt?: number;
  isNew?: boolean;
  progress?: number;
  onView: () => void;
}) {
  const rarityConfig = RARITY_CONFIG[badge.rarity];
  
  return (
    <motion.button
      onClick={onView}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`relative p-4 border-2 text-left transition group ${
        isUnlocked
          ? `${rarityConfig.border} bg-white hover:shadow-lg`
          : "border-gray-200 bg-gray-50 opacity-60 hover:opacity-80"
      }`}
    >
      {/* New indicator */}
      {isNew && (
        <div className="absolute -top-2 -right-2 bg-black text-white px-2 py-0.5 text-xs">
          NEW
        </div>
      )}

      {/* Lock overlay for locked badges */}
      {!isUnlocked && (
        <div className="absolute top-3 right-3">
          <Lock className="w-4 h-4 text-gray-400" />
        </div>
      )}

      {/* Badge icon */}
      <div className={`text-4xl mb-3 ${!isUnlocked ? "grayscale" : ""}`}>
        {badge.icon}
      </div>

      {/* Badge info */}
      <h3 className={`font-bold text-sm mb-1 ${!isUnlocked ? "text-gray-500" : ""}`}>
        {badge.name}
      </h3>
      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{badge.description}</p>

      {/* Rarity & Points */}
      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-0.5 ${rarityConfig.bg} ${
          badge.rarity === "legendary" ? "text-white" : ""
        }`}>
          {rarityConfig.label}
        </span>
        <span className="text-xs text-gray-500">+{badge.points} pts</span>
      </div>

      {/* Progress bar for locked badges */}
      {!isUnlocked && progress !== undefined && progress > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-gray-200 overflow-hidden">
            <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Unlock date for unlocked badges */}
      {isUnlocked && unlockedAt && (
        <p className="text-xs text-gray-400 mt-3">
          Unlocked {new Date(unlockedAt).toLocaleDateString()}
        </p>
      )}
    </motion.button>
  );
}

// Badge Detail Modal
function BadgeDetailModal({
  badge,
  isUnlocked,
  unlockedAt,
  progress,
  onClose,
  onMarkSeen,
}: {
  badge: Badge | null;
  isUnlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  onClose: () => void;
  onMarkSeen?: () => void;
}) {
  if (!badge) return null;

  const rarityConfig = RARITY_CONFIG[badge.rarity];
  const categoryConfig = CATEGORY_CONFIG[badge.category];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 text-xs ${rarityConfig.bg} ${
              badge.rarity === "legendary" ? "text-white" : ""
            }`}>
              {rarityConfig.label}
            </span>
            <span className="px-2 py-0.5 text-xs bg-gray-100 flex items-center gap-1">
              <categoryConfig.icon className="w-3 h-3" />
              {categoryConfig.label}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 text-center">
          <div className={`text-7xl mb-4 ${!isUnlocked ? "grayscale opacity-50" : ""}`}>
            {badge.icon}
          </div>
          <h2 className="text-2xl font-bold mb-2">{badge.name}</h2>
          <p className="text-gray-500 mb-6">{badge.description}</p>

          {isUnlocked ? (
            <div className="bg-gray-50 p-4 border border-gray-200">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                <CheckCircle className="w-5 h-5" weight="fill" />
                <span className="font-medium">Unlocked!</span>
              </div>
              {unlockedAt && (
                <p className="text-sm text-gray-500">
                  Earned on {new Date(unlockedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
              <p className="text-lg font-bold mt-2">+{badge.points} points</p>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 border border-gray-200">
              <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
                <Lock className="w-5 h-5" />
                <span className="font-medium">Locked</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{badge.requirement.description}</p>
              {progress !== undefined && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 overflow-hidden">
                    <div className="h-full bg-black transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4">
            {badge.unlockedCount.toLocaleString()} users have this badge
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Leaderboard Component
function Leaderboard() {
  const { getLeaderboard, userAchievements } = useAchievements();
  const leaderboard = getLeaderboard();

  return (
    <div className="bg-white border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Top Collectors
        </h3>
      </div>
      <div className="divide-y divide-gray-100">
        {leaderboard.map((entry, index) => (
          <div key={entry.userId} className="p-4 flex items-center gap-4">
            <div className={`w-8 h-8 flex items-center justify-center text-sm font-bold ${
              index === 0 ? "bg-yellow-100 text-yellow-700" :
              index === 1 ? "bg-gray-100 text-gray-600" :
              index === 2 ? "bg-amber-50 text-amber-700" :
              "bg-gray-50 text-gray-500"
            }`}>
              {index + 1}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{entry.userName}</p>
              <p className="text-xs text-gray-500">{entry.badgeCount} badges</p>
            </div>
            <p className="font-bold">{entry.points.toLocaleString()}</p>
          </div>
        ))}
      </div>
      {userAchievements && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 flex items-center justify-center text-sm font-bold bg-black text-white">
              {userAchievements.rank}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">You</p>
              <p className="text-xs text-gray-500">{userAchievements.badges.length} badges</p>
            </div>
            <p className="font-bold">{userAchievements.totalPoints.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Stats Component
function UserStats() {
  const { userAchievements } = useAchievements();

  if (!userAchievements) return null;

  const stats = [
    { label: "Total Points", value: userAchievements.totalPoints.toLocaleString() },
    { label: "Badges Earned", value: userAchievements.badges.length },
    { label: "Global Rank", value: `#${userAchievements.rank}` },
    { label: "Current Streak", value: `${userAchievements.streak.current} days` },
    { label: "Longest Streak", value: `${userAchievements.streak.longest} days` },
    { label: "Member For", value: `${userAchievements.stats.daysAsMember} days` },
  ];

  return (
    <div className="bg-black text-white p-6">
      <h3 className="font-bold mb-4 flex items-center gap-2">
        <Target className="w-5 h-5" />
        Your Stats
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-white/60">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const { user } = useAuth();
  const { 
    badges, 
    loading, 
    getUserBadges, 
    getLockedBadges, 
    hasBadge,
    markBadgeAsSeen,
    getNewBadgesCount,
  } = useAchievements();

  const [selectedBadge, setSelectedBadge] = useState<{
    badge: Badge;
    isUnlocked: boolean;
    unlockedAt?: number;
    progress?: number;
  } | null>(null);
  const [filterCategory, setFilterCategory] = useState<BadgeCategory | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "unlocked" | "locked">("all");

  const userBadges = getUserBadges();
  const lockedBadges = getLockedBadges();
  const newBadgesCount = getNewBadgesCount();

  // Combine and filter badges
  const allBadges = [
    ...userBadges.map(b => ({ ...b, isUnlocked: true, progress: 100 })),
    ...lockedBadges.map(b => ({ ...b, isUnlocked: false, unlockedAt: undefined, isNew: false })),
  ];

  const filteredBadges = allBadges.filter(b => {
    if (filterCategory !== "all" && b.category !== filterCategory) return false;
    if (filterStatus === "unlocked" && !b.isUnlocked) return false;
    if (filterStatus === "locked" && b.isUnlocked) return false;
    return true;
  });

  const handleViewBadge = (badge: typeof allBadges[0]) => {
    setSelectedBadge({
      badge,
      isUnlocked: badge.isUnlocked,
      unlockedAt: badge.unlockedAt,
      progress: badge.progress,
    });
    if (badge.isNew && badge.isUnlocked) {
      markBadgeAsSeen(badge.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-black text-white py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Medal className="w-8 h-8" />
              <h1 className="text-4xl md:text-5xl font-light tracking-tight">
                Achievements <span className="font-bold">& Badges</span>
              </h1>
            </div>
            <p className="text-white/60 max-w-2xl mx-auto mb-8">
              Collect badges, earn points, and unlock exclusive rewards. 
              Your style journey, gamified.
            </p>
            {user ? (
              <div className="flex items-center justify-center gap-8 text-sm">
                <div>
                  <p className="text-2xl font-bold">{userBadges.length}/{badges.length}</p>
                  <p className="text-white/60">Badges Collected</p>
                </div>
                <div className="w-px h-12 bg-white/20" />
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round((userBadges.length / badges.length) * 100)}%
                  </p>
                  <p className="text-white/60">Completion</p>
                </div>
                {newBadgesCount > 0 && (
                  <>
                    <div className="w-px h-12 bg-white/20" />
                    <div>
                      <p className="text-2xl font-bold text-yellow-400">{newBadgesCount}</p>
                      <p className="text-white/60">New Badges!</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-sm tracking-wider hover:bg-gray-100 transition"
              >
                LOG IN TO TRACK PROGRESS
                <CaretRight className="w-4 h-4" />
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Category:</span>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as BadgeCategory | "all")}
                  className="px-3 py-2 border border-gray-200 bg-white text-sm focus:border-black outline-none"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Status:</span>
                <div className="flex border border-gray-200">
                  {[
                    { key: "all", label: "All" },
                    { key: "unlocked", label: "Unlocked" },
                    { key: "locked", label: "Locked" },
                  ].map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setFilterStatus(option.key as typeof filterStatus)}
                      className={`px-3 py-2 text-sm ${
                        filterStatus === option.key
                          ? "bg-black text-white"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-500 ml-auto">
                {filteredBadges.length} badges
              </p>
            </div>

            {/* Badges Grid */}
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredBadges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  isUnlocked={badge.isUnlocked}
                  unlockedAt={badge.unlockedAt}
                  isNew={badge.isNew}
                  progress={badge.progress}
                  onView={() => handleViewBadge(badge)}
                />
              ))}
            </div>

            {filteredBadges.length === 0 && (
              <div className="text-center py-16 bg-white border border-gray-200">
                <Medal className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No badges found</h3>
                <p className="text-gray-500">Try adjusting your filters</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {user && <UserStats />}
            <Leaderboard />

            {/* How to Earn */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                How to Earn
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Gift className="w-4 h-4 mt-0.5 text-gray-400" />
                  <span>Make purchases and build your collection</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 mt-0.5 text-gray-400" />
                  <span>Write reviews and engage with products</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 text-gray-400" />
                  <span>Refer friends and grow the community</span>
                </li>
                <li className="flex items-start gap-2">
                  <Fire className="w-4 h-4 mt-0.5 text-gray-400" />
                  <span>Maintain visit streaks</span>
                </li>
                <li className="flex items-start gap-2">
                  <Trophy className="w-4 h-4 mt-0.5 text-gray-400" />
                  <span>Enter and win style challenges</span>
                </li>
              </ul>
              <Link
                href="/challenges"
                className="block mt-4 text-center py-2 border border-gray-200 text-sm hover:border-black transition"
              >
                VIEW CHALLENGES
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <BadgeDetailModal
            badge={selectedBadge.badge}
            isUnlocked={selectedBadge.isUnlocked}
            unlockedAt={selectedBadge.unlockedAt}
            progress={selectedBadge.progress}
            onClose={() => setSelectedBadge(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
