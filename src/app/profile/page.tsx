"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile, SavedAddress } from "@/context/UserProfileContext";
import { signOut } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Envelope, MapPin, Plus, PencilSimple, Trash,
  Heart, Palette, Ruler, FloppyDisk, Camera, SignOut,
  CaretRight, Package, Gear, Gift, Medal, Trophy, Fire
} from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";

import { LoyaltySection, StyleQuizSection, AddressFormModal } from "./components";
import { useAchievements } from "@/context/AchievementContext";

export default function ProfilePage() {
  const { user } = useAuth();
  const { 
    profile, 
    loading,
    updateAvatar, 
    updateStylePreferences,
    addAddress, 
    updateAddress,
    deleteAddress, 
    setDefaultAddress 
  } = useUserProfile();
  const { 
    getUserBadges, 
    getLockedBadges, 
    userAchievements, 
    markBadgeAsSeen,
    loading: badgesLoading 
  } = useAchievements();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"profile" | "badges" | "addresses" | "preferences" | "style" | "rewards">("profile");
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states for preferences
  const [favoriteColors, setFavoriteColors] = useState<string[]>([]);
  const [preferredFit, setPreferredFit] = useState<string>("");

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile?.stylePreferences) {
      setFavoriteColors(profile.stylePreferences.favoriteColors || []);
      setPreferredFit(profile.stylePreferences.preferredFit || "");
    }
  }, [profile?.stylePreferences]);

  const handleSavePreferences = async () => {
    setIsSaving(true);
    await updateStylePreferences({ 
      favoriteColors, 
      preferredFit: preferredFit as "slim" | "regular" | "oversized" | "" 
    });
    setIsSaving(false);
  };

  const handleEditAddress = (address: SavedAddress) => {
    setEditingAddress(address);
    setIsAddressModalOpen(true);
  };

  const handleDeleteAddress = (addressId: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      deleteAddress(addressId);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const toggleColor = (color: string) => {
    setFavoriteColors(prev => 
      prev.includes(color) 
        ? prev.filter(c => c !== color) 
        : [...prev, color]
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const colors = ["Black", "White", "Gray", "Navy", "Brown", "Olive", "Burgundy"];
  const fits = ["slim", "regular", "oversized"];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              {profile?.avatar ? (
                <Image 
                  src={profile.avatar} 
                  alt="Avatar" 
                  width={80} 
                  height={80} 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-black text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition">
                <Camera className="w-4 h-4" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        updateAvatar(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-light tracking-tight">
                {profile?.displayName || user.displayName || "CIPHER Member"}
              </h1>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex gap-8 overflow-x-auto">
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "badges", label: "Badges", icon: Medal },
              { id: "rewards", label: "Rewards", icon: Gift },
              { id: "addresses", label: "Addresses", icon: MapPin },
              { id: "preferences", label: "Preferences", icon: Gear },
              { id: "style", label: "Style Quiz", icon: Palette },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-4 text-sm tracking-wider border-b-2 transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-black font-medium"
                    : "border-transparent text-gray-500 hover:text-black"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-gray-50 p-6">
                <h3 className="font-medium mb-4">Account Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Envelope className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p>{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p>{profile?.displayName || user.displayName || "Not set"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/orders" className="group p-6 border border-gray-200 hover:border-black transition">
                  <Package className="w-6 h-6 mb-4 text-gray-400 group-hover:text-black transition" />
                  <h4 className="font-medium mb-1">Orders</h4>
                  <p className="text-sm text-gray-500">View order history</p>
                  <CaretRight className="w-5 h-5 mt-4 text-gray-300 group-hover:text-black transition" />
                </Link>

                <Link href="/wishlist" className="group p-6 border border-gray-200 hover:border-black transition">
                  <Heart className="w-6 h-6 mb-4 text-gray-400 group-hover:text-black transition" />
                  <h4 className="font-medium mb-1">Wishlist</h4>
                  <p className="text-sm text-gray-500">Saved items</p>
                  <CaretRight className="w-5 h-5 mt-4 text-gray-300 group-hover:text-black transition" />
                </Link>

                <button 
                  onClick={() => setActiveTab("rewards")}
                  className="group p-6 border border-gray-200 hover:border-black transition text-left"
                >
                  <Gift className="w-6 h-6 mb-4 text-gray-400 group-hover:text-black transition" />
                  <h4 className="font-medium mb-1">Rewards</h4>
                  <p className="text-sm text-gray-500">Earn & redeem points</p>
                  <CaretRight className="w-5 h-5 mt-4 text-gray-300 group-hover:text-black transition" />
                </button>
              </div>

              <div className="pt-8 border-t border-gray-200">
                <button 
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 transition"
                >
                  <SignOut className="w-5 h-5" />
                  <span className="text-sm tracking-wider">LOG OUT</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Badges Tab */}
          {activeTab === "badges" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="mb-8">
                <h2 className="text-lg font-light tracking-tight mb-2">ACHIEVEMENT BADGES</h2>
                <p className="text-sm text-gray-500">
                  Earn badges by shopping, engaging with the community, and completing challenges.
                </p>
              </div>

              {/* Stats Overview */}
              {userAchievements && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 text-center">
                    <Trophy className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                    <p className="text-2xl font-bold">{userAchievements.totalPoints.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 tracking-wider">TOTAL POINTS</p>
                  </div>
                  <div className="bg-gray-50 p-4 text-center">
                    <Medal className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-2xl font-bold">{getUserBadges().length}</p>
                    <p className="text-xs text-gray-500 tracking-wider">BADGES EARNED</p>
                  </div>
                  <div className="bg-gray-50 p-4 text-center">
                    <Fire className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                    <p className="text-2xl font-bold">{userAchievements.streak.current}</p>
                    <p className="text-xs text-gray-500 tracking-wider">DAY STREAK</p>
                  </div>
                  <div className="bg-gray-50 p-4 text-center">
                    <User className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                    <p className="text-2xl font-bold">#{userAchievements.rank || "—"}</p>
                    <p className="text-xs text-gray-500 tracking-wider">GLOBAL RANK</p>
                  </div>
                </div>
              )}

              {/* Unlocked Badges */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Medal className="w-5 h-5" /> Unlocked Badges ({getUserBadges().length})
                </h3>
                {badgesLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading badges...</div>
                ) : getUserBadges().length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {getUserBadges().map((badge) => (
                      <div
                        key={badge.id}
                        onClick={() => badge.isNew && markBadgeAsSeen(badge.id)}
                        className={`relative p-4 border text-center transition cursor-pointer hover:border-black ${
                          badge.isNew ? "border-amber-400 bg-amber-50" : "border-gray-200"
                        }`}
                      >
                        {badge.isNew && (
                          <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-400 text-white text-[10px] tracking-wider">
                            NEW
                          </span>
                        )}
                        <span className="text-3xl block mb-2">{badge.icon}</span>
                        <p className="font-medium text-sm">{badge.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                        <div className="mt-2 flex items-center justify-center gap-1">
                          <span className={`text-xs px-2 py-0.5 ${
                            badge.rarity === "legendary" ? "bg-purple-100 text-purple-700" :
                            badge.rarity === "epic" ? "bg-blue-100 text-blue-700" :
                            badge.rarity === "rare" ? "bg-green-100 text-green-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {badge.rarity.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400">+{badge.points} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50">
                    <Medal className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 mb-2">No badges earned yet</p>
                    <p className="text-sm text-gray-400">Start shopping and engaging to earn your first badge!</p>
                  </div>
                )}
              </div>

              {/* Locked Badges */}
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5" /> Available Badges ({getLockedBadges().length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {getLockedBadges().slice(0, 8).map((badge) => (
                    <div
                      key={badge.id}
                      className="relative p-4 border border-gray-200 text-center opacity-60"
                    >
                      <span className="text-3xl block mb-2 grayscale">{badge.icon}</span>
                      <p className="font-medium text-sm">{badge.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{badge.requirement.description}</p>
                      {badge.progress > 0 && (
                        <div className="mt-3">
                          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-black transition-all"
                              style={{ width: `${badge.progress}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{Math.round(badge.progress)}% complete</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {getLockedBadges().length > 8 && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    + {getLockedBadges().length - 8} more badges to unlock
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Rewards Tab */}
          {activeTab === "rewards" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-8">
                <h2 className="text-lg font-light tracking-tight mb-2">CIPHER REWARDS</h2>
                <p className="text-sm text-gray-500">
                  Earn points on purchases, reviews, and referrals. Redeem for discounts and exclusive perks.
                </p>
              </div>
              <LoyaltySection />
            </motion.div>
          )}

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-light tracking-tight">SAVED ADDRESSES</h2>
                <button 
                  onClick={() => {
                    setEditingAddress(null);
                    setIsAddressModalOpen(true);
                  }}
                  className="flex items-center gap-2 text-sm tracking-wider hover:underline"
                >
                  <Plus className="w-4 h-4" /> Add New
                </button>
              </div>

              {profile?.savedAddresses && profile.savedAddresses.length > 0 ? (
                <div className="grid gap-4">
                  {profile.savedAddresses.map((address) => (
                    <div 
                      key={address.id}
                      className={`p-6 border transition ${
                        address.isDefault ? "border-black" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{address.label}</span>
                          {address.isDefault && (
                            <span className="px-2 py-0.5 bg-black text-white text-xs">Default</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEditAddress(address)}
                            className="p-2 hover:bg-gray-100 transition"
                          >
                            <PencilSimple className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteAddress(address.id)}
                            className="p-2 hover:bg-red-50 text-red-500 transition"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{address.firstName} {address.lastName}</p>
                      <p className="text-sm text-gray-600">{address.street}</p>
                      <p className="text-sm text-gray-600">
                        {address.city}, {address.state} {address.zip}
                      </p>
                      <p className="text-sm text-gray-600">{address.country}</p>
                      {address.phone && (
                        <p className="text-sm text-gray-500 mt-2">{address.phone}</p>
                      )}
                      {!address.isDefault && (
                        <button
                          onClick={() => setDefaultAddress(address.id)}
                          className="mt-4 text-xs tracking-wider underline underline-offset-4 hover:no-underline"
                        >
                          Set as default
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">No saved addresses yet</p>
                  <button 
                    onClick={() => setIsAddressModalOpen(true)}
                    className="bg-black text-white px-6 py-3 text-sm tracking-wider hover:bg-gray-900 transition"
                  >
                    ADD ADDRESS
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-lg font-light tracking-tight mb-2">SHOPPING PREFERENCES</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Help us personalize your experience
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Favorite Colors
                </h3>
                <div className="flex flex-wrap gap-3">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => toggleColor(color)}
                      className={`px-6 py-3 border text-sm tracking-wider transition ${
                        favoriteColors.includes(color)
                          ? "border-black bg-black text-white"
                          : "border-gray-200 hover:border-black"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Ruler className="w-4 h-4" /> Preferred Fit
                </h3>
                <div className="flex flex-wrap gap-3">
                  {fits.map((fit) => (
                    <button
                      key={fit}
                      onClick={() => setPreferredFit(fit)}
                      className={`px-6 py-3 border text-sm tracking-wider capitalize transition ${
                        preferredFit === fit
                          ? "border-black bg-black text-white"
                          : "border-gray-200 hover:border-black"
                      }`}
                    >
                      {fit}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSavePreferences}
                disabled={isSaving}
                className="bg-black text-white px-8 py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 flex items-center gap-2"
              >
                <FloppyDisk className="w-4 h-4" />
                {isSaving ? "SAVING..." : "SAVE PREFERENCES"}
              </button>
            </motion.div>
          )}

          {/* Style Quiz Tab */}
          {activeTab === "style" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-8">
                <h2 className="text-lg font-light tracking-tight mb-2">STYLE PROFILE</h2>
                <p className="text-sm text-gray-500">
                  Complete our style quiz to get personalized product recommendations
                </p>
              </div>
              <StyleQuizSection />
            </motion.div>
          )}
        </div>
      </div>

      {/* Address Modal */}
      <AnimatePresence>
        <AddressFormModal
          isOpen={isAddressModalOpen}
          onClose={() => {
            setIsAddressModalOpen(false);
            setEditingAddress(null);
          }}
          editAddress={editingAddress}
        />
      </AnimatePresence>
    </div>
  );
}
