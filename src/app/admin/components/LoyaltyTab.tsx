"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Medal,
  Trophy,
  Diamond,
  Users,
  TrendUp,
  Gift,
  Star,
  Coins,
  MagnifyingGlass,
  CaretDown,
  CaretUp,
  PencilSimple,
  X,
  SpinnerGap,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Confetti,
  Ticket,
  HandHeart,
  ChartLineUp,
} from "@phosphor-icons/react";
import { 
  useLoyalty, 
  LoyaltyProfile, 
  TIER_CONFIG, 
  LoyaltyTier,
  PointsTransaction
} from "@/context/LoyaltyContext";

// Tier icons
const TIER_ICONS: Record<LoyaltyTier, React.ElementType> = {
  bronze: Medal,
  silver: Star,
  gold: Trophy,
  platinum: Diamond,
};

// Format date
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Points Adjustment Modal
function AdjustPointsModal({
  isOpen,
  onClose,
  profile,
  onAdjust,
}: {
  isOpen: boolean;
  onClose: () => void;
  profile: LoyaltyProfile | null;
  onAdjust: (points: number, reason: string) => Promise<void>;
}) {
  const [points, setPoints] = useState(0);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (points === 0 || !reason.trim()) return;
    setSubmitting(true);
    await onAdjust(points, reason);
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
      setPoints(0);
      setReason("");
    }, 1500);
  };

  if (!isOpen || !profile) return null;

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
        className="bg-white w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-light tracking-tight">Adjust Points</h2>
              <p className="text-sm text-gray-500 mt-1">User ID: {profile.userId.slice(0, 8)}...</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-black" weight="fill" />
              </div>
              <h3 className="text-lg font-medium">Points Adjusted!</h3>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Current Balance</span>
                  <span className="font-medium">{profile.availablePoints.toLocaleString()} pts</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">After Adjustment</span>
                  <span className={`font-medium ${points > 0 ? "text-black" : points < 0 ? "text-gray-500" : ""}`}>
                    {Math.max(0, profile.availablePoints + points).toLocaleString()} pts
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">POINTS TO ADD/REMOVE</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPoints(p => p - 100)}
                    className="p-3 border border-gray-200 hover:border-black"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="flex-1 px-4 py-3 border border-gray-200 focus:border-black outline-none text-center"
                    placeholder="0"
                  />
                  <button
                    onClick={() => setPoints(p => p + 100)}
                    className="p-3 border border-gray-200 hover:border-black"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs tracking-wider text-gray-500 mb-2">REASON</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none resize-none"
                  placeholder="Reason for adjustment..."
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || points === 0 || !reason.trim()}
                className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <SpinnerGap className="w-4 h-4 animate-spin" />
                    PROCESSING...
                  </>
                ) : (
                  <>
                    <PencilSimple className="w-4 h-4" />
                    {points > 0 ? "ADD" : "REMOVE"} {Math.abs(points)} POINTS
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Member Details Modal
function MemberDetailsModal({
  isOpen,
  onClose,
  profile,
  onAdjustPoints,
}: {
  isOpen: boolean;
  onClose: () => void;
  profile: LoyaltyProfile | null;
  onAdjustPoints: () => void;
}) {
  if (!isOpen || !profile) return null;

  const TierIcon = TIER_ICONS[profile.currentTier];
  const tierConfig = TIER_CONFIG[profile.currentTier];

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
        className="bg-white w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 flex items-center justify-center">
                <TierIcon className="w-6 h-6 text-gray-800" />
              </div>
              <div>
                <h2 className="text-xl font-light tracking-tight">Member Profile</h2>
                <p className="text-sm text-gray-500">{profile.userId.slice(0, 16)}...</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4">
              <p className="text-xs text-gray-500 mb-1">CURRENT TIER</p>
              <p className="font-medium capitalize flex items-center gap-2">
                {tierConfig.icon} {tierConfig.name}
              </p>
            </div>
            <div className="bg-gray-50 p-4">
              <p className="text-xs text-gray-500 mb-1">AVAILABLE POINTS</p>
              <p className="font-medium text-black">{profile.availablePoints.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4">
              <p className="text-xs text-gray-500 mb-1">LIFETIME POINTS</p>
              <p className="font-medium">{profile.lifetimePoints.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4">
              <p className="text-xs text-gray-500 mb-1">REFERRALS</p>
              <p className="font-medium">{profile.referralCount}</p>
            </div>
          </div>

          {/* Tier Progress */}
          <div className="border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium">Tier Progress</h4>
              <span className="text-sm text-gray-500">{profile.tierProgress}%</span>
            </div>
            <div className="h-2 bg-gray-200 overflow-hidden">
              <div 
                className="h-full bg-black transition-all"
                style={{ width: `${profile.tierProgress}%` }}
              />
            </div>
            {profile.pointsToNextTier > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {profile.pointsToNextTier.toLocaleString()} points to next tier
              </p>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h4 className="font-medium">Recent Transactions</h4>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
              {profile.transactions.slice(-10).reverse().map((tx, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm">{tx.description}</p>
                    <p className="text-xs text-gray-500">{formatDate(tx.createdAt)}</p>
                  </div>
                  <span className={`font-medium ${tx.points > 0 ? "text-green-600" : "text-red-600"}`}>
                    {tx.points > 0 ? "+" : ""}{tx.points}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onAdjustPoints}
              className="flex-1 bg-black text-white py-3 text-sm tracking-wider font-medium hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              <PencilSimple className="w-4 h-4" />
              ADJUST POINTS
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function LoyaltyTab() {
  const { getAllLoyaltyProfiles, adjustPoints, tierConfig } = useLoyalty();
  const [profiles, setProfiles] = useState<LoyaltyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState<LoyaltyTier | "all">("all");
  const [selectedProfile, setSelectedProfile] = useState<LoyaltyProfile | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>("overview");

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const data = await getAllLoyaltyProfiles();
    setProfiles(data);
    setLoading(false);
  };

  const handleAdjustPoints = async (points: number, reason: string) => {
    if (!selectedProfile) return;
    await adjustPoints(selectedProfile.userId, points, reason);
    await loadProfiles();
  };

  // Calculate stats
  const stats = {
    totalMembers: profiles.length,
    totalPointsIssued: profiles.reduce((sum, p) => sum + p.lifetimePoints, 0),
    totalPointsRedeemed: profiles.reduce((sum, p) => sum + (p.lifetimePoints - p.availablePoints), 0),
    tierDistribution: {
      bronze: profiles.filter(p => p.currentTier === "bronze").length,
      silver: profiles.filter(p => p.currentTier === "silver").length,
      gold: profiles.filter(p => p.currentTier === "gold").length,
      platinum: profiles.filter(p => p.currentTier === "platinum").length,
    },
    totalReferrals: profiles.reduce((sum, p) => sum + p.referralCount, 0),
  };

  // Filter profiles
  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = searchQuery === "" || 
      p.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.referralCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === "all" || p.currentTier === filterTier;
    return matchesSearch && matchesTier;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Program Overview */}
      <div className="bg-black text-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Crown className="w-5 h-5" />
              CIPHER Rewards Program
            </h3>
            <p className="text-white/60 text-sm mt-1">Loyalty program overview and management</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white/10 p-4">
            <p className="text-white/60 text-xs mb-1">TOTAL MEMBERS</p>
            <p className="text-3xl font-light">{stats.totalMembers}</p>
          </div>
          <div className="bg-white/10 p-4">
            <p className="text-white/60 text-xs mb-1">POINTS ISSUED</p>
            <p className="text-3xl font-light">{stats.totalPointsIssued.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 p-4">
            <p className="text-white/60 text-xs mb-1">POINTS REDEEMED</p>
            <p className="text-3xl font-light">{stats.totalPointsRedeemed.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 p-4">
            <p className="text-white/60 text-xs mb-1">REFERRALS</p>
            <p className="text-3xl font-light">{stats.totalReferrals}</p>
          </div>
          <div className="bg-white/10 p-4">
            <p className="text-white/60 text-xs mb-1">REDEMPTION RATE</p>
            <p className="text-3xl font-light">
              {stats.totalPointsIssued > 0 
                ? Math.round((stats.totalPointsRedeemed / stats.totalPointsIssued) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Tier Distribution */}
      <div className="grid md:grid-cols-4 gap-4">
        {(Object.entries(stats.tierDistribution) as [LoyaltyTier, number][]).map(([tier, count]) => {
          const config = tierConfig[tier];
          const TierIcon = TIER_ICONS[tier];
          const percentage = stats.totalMembers > 0 
            ? Math.round((count / stats.totalMembers) * 100) 
            : 0;
          
          return (
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 p-4 hover:border-black transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center">
                  <TierIcon className="w-5 h-5 text-gray-800" />
                </div>
                <div>
                  <p className="font-medium capitalize">{config.name}</p>
                  <p className="text-xs text-gray-500">{config.minPoints}+ points</p>
                </div>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-light">{count}</p>
                <p className="text-sm text-gray-500">{percentage}%</p>
              </div>
              <div className="h-1 bg-gray-200 mt-3 overflow-hidden">
                <div 
                  className="h-full bg-black transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Tier Benefits Reference */}
      <div className="bg-white border border-gray-200">
        <button
          onClick={() => setExpandedSection(expandedSection === "benefits" ? null : "benefits")}
          className="w-full p-6 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-medium">Tier Benefits</h3>
              <p className="text-xs text-gray-500 mt-1">What each tier offers</p>
            </div>
          </div>
          {expandedSection === "benefits" ? <CaretUp className="w-5 h-5" /> : <CaretDown className="w-5 h-5" />}
        </button>
        
        <AnimatePresence>
          {expandedSection === "benefits" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 text-xs tracking-wider text-gray-500 font-medium">BENEFIT</th>
                      {(Object.keys(tierConfig) as LoyaltyTier[]).map(tier => (
                        <th key={tier} className="text-center py-3 text-xs tracking-wider font-medium capitalize text-black">
                          {tierConfig[tier].icon} {tier}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3 text-sm">Points Multiplier</td>
                      {(Object.keys(tierConfig) as LoyaltyTier[]).map(tier => (
                        <td key={tier} className="py-3 text-sm text-center font-medium">
                          {tierConfig[tier].pointsMultiplier}x
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-sm">Member Discount</td>
                      {(Object.keys(tierConfig) as LoyaltyTier[]).map(tier => (
                        <td key={tier} className="py-3 text-sm text-center">
                          {tierConfig[tier].discountPercentage > 0 
                            ? `${tierConfig[tier].discountPercentage}%` 
                            : "-"}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-sm">Free Shipping Threshold</td>
                      {(Object.keys(tierConfig) as LoyaltyTier[]).map(tier => (
                        <td key={tier} className="py-3 text-sm text-center">
                          {tierConfig[tier].freeShippingThreshold === 0 
                            ? "FREE" 
                            : `$${tierConfig[tier].freeShippingThreshold}+`}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-sm">Early Access</td>
                      {(Object.keys(tierConfig) as LoyaltyTier[]).map(tier => (
                        <td key={tier} className="py-3 text-center">
                          {tierConfig[tier].earlyAccess 
                            ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> 
                            : <span className="text-gray-300">-</span>}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-sm">Exclusive Products</td>
                      {(Object.keys(tierConfig) as LoyaltyTier[]).map(tier => (
                        <td key={tier} className="py-3 text-center">
                          {tierConfig[tier].exclusiveProducts 
                            ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> 
                            : <span className="text-gray-300">-</span>}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 text-sm">Birthday Bonus Points</td>
                      {(Object.keys(tierConfig) as LoyaltyTier[]).map(tier => (
                        <td key={tier} className="py-3 text-sm text-center font-medium">
                          {tierConfig[tier].birthdayBonus}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Members List */}
      <div className="bg-white border border-gray-200">
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium">Program Members</h3>
              <p className="text-xs text-gray-500 mt-1">{filteredProfiles.length} members</p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by ID or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 focus:border-black outline-none w-64"
                />
              </div>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value as LoyaltyTier | "all")}
                className="px-4 py-2 border border-gray-200 focus:border-black outline-none bg-white"
              >
                <option value="all">All Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">MEMBER</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">TIER</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">AVAILABLE</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">LIFETIME</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">REFERRALS</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">JOINED</th>
                <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProfiles.slice(0, 20).map((profile, i) => {
                const config = tierConfig[profile.currentTier];
                const TierIcon = TIER_ICONS[profile.currentTier];
                
                return (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-6">
                      <p className="text-sm font-medium">{profile.userId.slice(0, 12)}...</p>
                      <p className="text-xs text-gray-500">{profile.referralCode}</p>
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <TierIcon className="w-4 h-4 text-gray-800" />
                        <span className="text-sm capitalize">{profile.currentTier}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <span className="text-sm font-medium">
                        {profile.availablePoints.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-sm">
                      {profile.lifetimePoints.toLocaleString()}
                    </td>
                    <td className="py-3 px-6 text-sm">
                      {profile.referralCount}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-500">
                      {formatDate(profile.joinedAt)}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedProfile(profile);
                            setShowDetailsModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 text-gray-500 hover:text-black transition"
                          title="View Details"
                        >
                          <ChartLineUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedProfile(profile);
                            setShowAdjustModal(true);
                          }}
                          className="p-2 hover:bg-gray-100 text-gray-500 hover:text-black transition"
                          title="Adjust Points"
                        >
                          <PencilSimple className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Details Modal */}
      <AnimatePresence>
        <MemberDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProfile(null);
          }}
          profile={selectedProfile}
          onAdjustPoints={() => {
            setShowDetailsModal(false);
            setShowAdjustModal(true);
          }}
        />
      </AnimatePresence>

      {/* Adjust Points Modal */}
      <AnimatePresence>
        <AdjustPointsModal
          isOpen={showAdjustModal}
          onClose={() => {
            setShowAdjustModal(false);
            setSelectedProfile(null);
          }}
          profile={selectedProfile}
          onAdjust={handleAdjustPoints}
        />
      </AnimatePresence>
    </div>
  );
}
