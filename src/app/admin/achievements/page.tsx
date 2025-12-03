"use client";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAchievements, Badge } from "@/context/AchievementContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  SpinnerGap, 
  ShieldWarning, 
  Plus,
  Medal,
  Pencil,
  Trash,
  Eye,
  Users,
  X,
  Star,
  ShoppingBag,
  ChatCircle,
  Heart,
  Crown,
  Sparkle,
} from "@phosphor-icons/react";
import AdminLayout from "../components/AdminLayout";

function AchievementsPageContent() {
  const { user, loading: authLoading, userRole } = useAuth();
  const { badges, getLeaderboard } = useAchievements();
  const toast = useToast();
  const router = useRouter();
  
  const [showModal, setShowModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterRarity, setFilterRarity] = useState<string>("all");

  const isAdmin = userRole?.isAdmin ?? false;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const categories = ["all", "shopping", "engagement", "social", "loyalty", "creator", "special"];
  const rarities = ["all", "common", "rare", "epic", "legendary"];

  const filteredBadges = badges.filter(b => {
    const matchCategory = filterCategory === "all" || b.category === filterCategory;
    const matchRarity = filterRarity === "all" || b.rarity === filterRarity;
    return matchCategory && matchRarity;
  });

  const handleDelete = (badgeId: string) => {
    if (!confirm("Are you sure you want to delete this badge?")) return;
    // In a real app, this would delete from the database
    toast.success("Badge deleted successfully");
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "shopping": return <ShoppingBag className="w-4 h-4" />;
      case "engagement": return <ChatCircle className="w-4 h-4" />;
      case "social": return <Heart className="w-4 h-4" />;
      case "loyalty": return <Crown className="w-4 h-4" />;
      case "creator": return <Sparkle className="w-4 h-4" />;
      case "special": return <Star className="w-4 h-4" />;
      default: return <Medal className="w-4 h-4" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "bg-gray-100 text-gray-600";
      case "rare": return "bg-blue-100 text-blue-600";
      case "epic": return "bg-purple-100 text-purple-600";
      case "legendary": return "bg-amber-100 text-amber-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-red-100 flex items-center justify-center mb-6">
          <ShieldWarning className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-light tracking-tight mb-4">ACCESS DENIED</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          You don&apos;t have permission to access the admin panel.
        </p>
        <button 
          onClick={() => router.push("/")}
          className="bg-black text-white px-8 py-4 text-sm tracking-wider hover:bg-gray-900 transition"
        >
          RETURN HOME
        </button>
      </div>
    );
  }

  // Stats
  const stats = {
    totalBadges: badges.length,
    byRarity: {
      common: badges.filter(b => b.rarity === "common").length,
      rare: badges.filter(b => b.rarity === "rare").length,
      epic: badges.filter(b => b.rarity === "epic").length,
      legendary: badges.filter(b => b.rarity === "legendary").length,
    },
    totalUsers: getLeaderboard().length,
    totalPointsIssued: getLeaderboard().reduce((sum, u) => sum + u.points, 0),
  };

  return (
    <AdminLayout 
      title="Achievements & Badges" 
      activeTab="achievements"
      actions={
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 text-xs tracking-wider hover:bg-gray-100 transition"
        >
          <Plus className="w-4 h-4" /> CREATE BADGE
        </button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 border border-gray-100">
          <p className="text-2xl font-bold">{stats.totalBadges}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Badges</p>
        </div>
        <div className="bg-gray-50 p-4 border border-gray-100">
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Active Users</p>
        </div>
        <div className="bg-gray-50 p-4 border border-gray-100">
          <p className="text-2xl font-bold">{stats.totalPointsIssued.toLocaleString()}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Points Issued</p>
        </div>
        <div className="bg-gray-50 p-4 border border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{stats.byRarity.common}C</span>
            <span className="text-xs text-blue-500">{stats.byRarity.rare}R</span>
            <span className="text-xs text-purple-500">{stats.byRarity.epic}E</span>
            <span className="text-xs text-amber-500">{stats.byRarity.legendary}L</span>
          </div>
          <p className="text-xs text-gray-500 uppercase tracking-wider">By Rarity</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 text-xs ${
                filterCategory === cat
                  ? "bg-black text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Rarity:</span>
          {rarities.map((rarity) => (
            <button
              key={rarity}
              onClick={() => setFilterRarity(rarity)}
              className={`px-3 py-1 text-xs ${
                filterRarity === rarity
                  ? "bg-black text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map((badge) => (
          <div key={badge.id} className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">{badge.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-sm truncate">{badge.name}</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-medium uppercase ${getRarityColor(badge.rarity)}`}>
                    {badge.rarity}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{badge.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    {getCategoryIcon(badge.category)}
                    {badge.category}
                  </span>
                  <span>+{badge.points} pts</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setEditingBadge(badge);
                  setShowModal(true);
                }}
                className="p-2 hover:bg-gray-100 text-gray-500 hover:text-black transition"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(badge.id)}
                className="p-2 hover:bg-gray-100 text-gray-500 hover:text-red-500 transition"
                title="Delete"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-12 bg-gray-50 border border-gray-100">
          <Medal className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No badges found</p>
        </div>
      )}

      {/* Leaderboard Section */}
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4">Top Achievement Earners</h3>
        <div className="bg-white border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs tracking-wider text-gray-500 font-medium">RANK</th>
                <th className="text-left py-3 px-4 text-xs tracking-wider text-gray-500 font-medium">USER</th>
                <th className="text-left py-3 px-4 text-xs tracking-wider text-gray-500 font-medium">BADGES</th>
                <th className="text-left py-3 px-4 text-xs tracking-wider text-gray-500 font-medium">POINTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {getLeaderboard().slice(0, 10).map((entry, index) => (
                <tr key={entry.userId} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    <span className={`w-6 h-6 inline-flex items-center justify-center text-sm font-bold ${
                      index === 0 ? "bg-amber-100 text-amber-700" :
                      index === 1 ? "bg-gray-200 text-gray-700" :
                      index === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-gray-50 text-gray-500"
                    }`}>
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 bg-gray-100 flex items-center justify-center overflow-hidden">
                        <Users className="w-4 h-4 text-gray-400" />
                      </div>
                      <span className="font-medium text-sm">{entry.userName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm">{entry.badgeCount} badges</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold">{entry.points.toLocaleString()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-lg font-bold">
                {editingBadge ? "Edit Badge" : "Create New Badge"}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingBadge(null);
                }}
                className="p-2 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-center py-8">
                Badge creation form would go here.
                <br />
                This is a placeholder for the full implementation.
              </p>
              <button
                onClick={() => {
                  toast.success(editingBadge ? "Badge updated!" : "Badge created!");
                  setShowModal(false);
                  setEditingBadge(null);
                }}
                className="w-full bg-black text-white py-3 text-sm tracking-wider hover:bg-gray-800 transition"
              >
                {editingBadge ? "UPDATE BADGE" : "CREATE BADGE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function AchievementsPageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function AchievementsPage() {
  return (
    <Suspense fallback={<AchievementsPageLoading />}>
      <AchievementsPageContent />
    </Suspense>
  );
}
