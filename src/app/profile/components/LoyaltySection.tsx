"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "@/lib/motion";
import { 
  Gift, Crown, CheckCircle, ShareNetwork, Copy, Check, 
  CalendarBlank, SpinnerGap, X, Ticket 
} from "@phosphor-icons/react";
import { useLoyalty, TIER_CONFIG, LoyaltyTier, REWARD_OPTIONS } from "@/context/LoyaltyContext";
import { Medal, Star, Trophy, Diamond } from "@phosphor-icons/react";

// Tier icons
const TIER_ICONS: Record<LoyaltyTier, React.ElementType> = {
  bronze: Medal,
  silver: Star,
  gold: Trophy,
  platinum: Diamond,
};

export default function LoyaltySection() {
  const { profile, redeemReward, applyReferralCode, setBirthday, loading } = useLoyalty();
  const [referralInput, setReferralInput] = useState("");
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralSuccess, setReferralSuccess] = useState(false);
  const [referralError, setReferralError] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [birthdayInput, setBirthdayInput] = useState("");
  const [redeemingReward, setRedeemingReward] = useState<string | null>(null);
  const [showRewards, setShowRewards] = useState(false);

  useEffect(() => {
    if (profile?.birthday) {
      setBirthdayInput(profile.birthday);
    }
  }, [profile?.birthday]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12 bg-gray-50">
        <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500 mb-4">Sign in to join CIPHER Rewards</p>
      </div>
    );
  }

  const tierConfig = TIER_CONFIG[profile.currentTier];
  const TierIcon = TIER_ICONS[profile.currentTier];
  const nextTier = profile.currentTier !== "platinum" 
    ? (["bronze", "silver", "gold", "platinum"] as LoyaltyTier[])[
        ["bronze", "silver", "gold", "platinum"].indexOf(profile.currentTier) + 1
      ]
    : null;

  const handleApplyReferral = async () => {
    if (!referralInput.trim()) return;
    setReferralLoading(true);
    setReferralError("");
    
    const success = await applyReferralCode(referralInput.trim());
    if (success) {
      setReferralSuccess(true);
      setReferralInput("");
    } else {
      setReferralError("Invalid or already used code");
    }
    setReferralLoading(false);
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(profile.referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveBirthday = async () => {
    if (birthdayInput) {
      await setBirthday(birthdayInput);
    }
  };

  const handleRedeemReward = async (rewardId: string) => {
    setRedeemingReward(rewardId);
    const result = await redeemReward(rewardId);
    setRedeemingReward(null);
    if (result) {
      setShowRewards(false);
    }
  };

  // Filter available rewards based on tier and points
  const availableRewards = REWARD_OPTIONS.filter(reward => {
    if (reward.minTier) {
      const tierOrder: LoyaltyTier[] = ["bronze", "silver", "gold", "platinum"];
      const requiredTierIndex = tierOrder.indexOf(reward.minTier);
      const currentTierIndex = tierOrder.indexOf(profile.currentTier);
      if (currentTierIndex < requiredTierIndex) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Tier Card */}
      <div 
        className="relative overflow-hidden p-6 rounded-xl text-white"
        style={{ 
          background: `linear-gradient(135deg, ${tierConfig.color}dd 0%, ${tierConfig.color}99 100%)` 
        }}
      >
        <div className="absolute top-0 right-0 opacity-10">
          <TierIcon className="w-40 h-40 -mt-8 -mr-8" />
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <TierIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/70 text-xs tracking-wider">CIPHER REWARDS</p>
              <h3 className="text-xl font-medium capitalize">{tierConfig.name} Member</h3>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-white/60 text-xs mb-1">AVAILABLE POINTS</p>
              <p className="text-3xl font-light">{profile.availablePoints.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs mb-1">LIFETIME POINTS</p>
              <p className="text-3xl font-light">{profile.lifetimePoints.toLocaleString()}</p>
            </div>
          </div>
          
          {nextTier && (
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60">Progress to {TIER_CONFIG[nextTier].name}</span>
                <span>{profile.pointsToNextTier} pts to go</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${profile.tierProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setShowRewards(true)}
          className="p-4 border border-gray-200 hover:border-black transition text-left"
        >
          <Gift className="w-5 h-5 mb-2 text-purple-500" />
          <p className="font-medium">Redeem Rewards</p>
          <p className="text-xs text-gray-500">{availableRewards.length} rewards available</p>
        </button>
        
        <button
          onClick={handleCopyReferral}
          className="p-4 border border-gray-200 hover:border-black transition text-left"
        >
          <ShareNetwork className="w-5 h-5 mb-2 text-blue-500" />
          <p className="font-medium">Share & Earn</p>
          <p className="text-xs text-gray-500">
            {copiedCode ? "Code copied!" : `${profile.referralCount} referrals`}
          </p>
        </button>
      </div>

      {/* Tier Benefits */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500" />
          Your {tierConfig.name} Benefits
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">{tierConfig.pointsMultiplier}x points on purchases</span>
          </div>
          {tierConfig.discountPercentage > 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">{tierConfig.discountPercentage}% member discount</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">
              Free shipping over ${tierConfig.freeShippingThreshold}
              {tierConfig.freeShippingThreshold === 0 && " (always free!)"}
            </span>
          </div>
          {tierConfig.earlyAccess && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Early access to drops</span>
            </div>
          )}
          {tierConfig.exclusiveProducts && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Exclusive products</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm">{tierConfig.birthdayBonus} birthday bonus pts</span>
          </div>
        </div>
      </div>

      {/* Referral Section */}
      <div className="border border-gray-200 p-6">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <ShareNetwork className="w-4 h-4" />
          Refer Friends & Earn
        </h4>
        
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Your referral code:</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 p-3 font-mono tracking-wider">
              {profile.referralCode}
            </div>
            <button 
              onClick={handleCopyReferral}
              className="px-4 bg-black text-white hover:bg-gray-800 transition flex items-center gap-2"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Earn 200 points for each friend who joins. They get 100 points too!
          </p>
        </div>
        
        {!referralSuccess && (
          <div>
            <p className="text-sm text-gray-500 mb-2">Have a referral code?</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1 px-4 py-3 border border-gray-200 focus:border-black outline-none"
              />
              <button
                onClick={handleApplyReferral}
                disabled={referralLoading || !referralInput.trim()}
                className="bg-black text-white px-6 py-3 text-sm tracking-wider hover:bg-gray-800 disabled:opacity-50"
              >
                {referralLoading ? "..." : "APPLY"}
              </button>
            </div>
            {referralError && (
              <p className="text-xs text-red-500 mt-2">{referralError}</p>
            )}
          </div>
        )}
        
        {referralSuccess && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">Referral code applied! 100 bonus points added.</span>
          </div>
        )}
      </div>

      {/* Birthday Bonus */}
      <div className="border border-gray-200 p-6">
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <CalendarBlank className="w-4 h-4" />
          Birthday Bonus
        </h4>
        <p className="text-sm text-gray-500 mb-4">
          Set your birthday to earn {tierConfig.birthdayBonus} bonus points and 2x points all month!
        </p>
        <div className="flex gap-2">
          <input
            type="date"
            value={birthdayInput}
            onChange={(e) => setBirthdayInput(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-200 focus:border-black outline-none"
          />
          <button
            onClick={handleSaveBirthday}
            disabled={!birthdayInput || birthdayInput === profile.birthday}
            className="bg-black text-white px-6 py-3 text-sm tracking-wider hover:bg-gray-800 disabled:opacity-50"
          >
            SAVE
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <h4 className="font-medium">Recent Activity</h4>
        </div>
        <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
          {profile.transactions.slice(-5).reverse().map((tx, i) => (
            <div key={i} className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm">{tx.description}</p>
                <p className="text-xs text-gray-500">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`font-medium ${tx.points > 0 ? "text-green-600" : "text-red-600"}`}>
                {tx.points > 0 ? "+" : ""}{tx.points}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Rewards */}
      {profile.redeemedRewards.filter(r => !r.isUsed && r.expiresAt > Date.now()).length > 0 && (
        <div className="border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h4 className="font-medium flex items-center gap-2">
              <Ticket className="w-4 h-4 text-purple-500" />
              Your Active Rewards
            </h4>
          </div>
          <div className="divide-y divide-gray-100">
            {profile.redeemedRewards
              .filter(r => !r.isUsed && r.expiresAt > Date.now())
              .map((reward, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{reward.rewardName}</p>
                    <p className="text-xs text-gray-500">
                      Code: <span className="font-mono">{reward.code}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Expires: {new Date(reward.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(reward.code)}
                    className="p-2 hover:bg-gray-100 transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Rewards Modal */}
      <AnimatePresence>
        {showRewards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowRewards(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 sticky top-0 bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-light tracking-tight">REDEEM REWARDS</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Available: {profile.availablePoints.toLocaleString()} pts
                    </p>
                  </div>
                  <button onClick={() => setShowRewards(false)} className="p-2 hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {availableRewards.map((reward) => {
                  const canAfford = profile.availablePoints >= reward.pointsCost;
                  
                  return (
                    <div 
                      key={reward.id}
                      className={`p-4 border transition ${
                        canAfford ? "border-gray-200 hover:border-black" : "border-gray-100 opacity-50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{reward.name}</h4>
                          <p className="text-sm text-gray-500">{reward.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-purple-600">{reward.pointsCost} pts</p>
                          {reward.minTier && (
                            <p className="text-xs text-gray-400 capitalize">{reward.minTier}+</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRedeemReward(reward.id)}
                        disabled={!canAfford || redeemingReward === reward.id}
                        className="w-full mt-2 bg-black text-white py-2 text-sm tracking-wider hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {redeemingReward === reward.id ? (
                          <SpinnerGap className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Gift className="w-4 h-4" />
                            {canAfford ? "REDEEM" : "NOT ENOUGH POINTS"}
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
