import { createContext, use, useMemo, ReactNode, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "./AuthContext";

export interface Influencer {
  id: string;
  userId: string;
  username: string; // @username for URL
  displayName: string;
  bio: string;
  avatar: string;
  coverImage?: string;
  socialLinks: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  };
  commissionRate: number; // percentage (10-15%)
  tier: "bronze" | "silver" | "gold" | "platinum";
  isActive: boolean;
  isVerified: boolean;
  curatedProducts: string[]; // product IDs
  featuredProducts: string[]; // highlighted picks
  totalEarnings: number;
  pendingEarnings: number;
  totalSales: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  joinedAt: Date;
  lastActiveAt: Date;
  payoutInfo?: {
    method: "paypal" | "bank" | "venmo";
    email?: string;
    accountDetails?: string;
  };
  liveStreamUrl?: string;
  isLive: boolean;
  followers: number;
}

export interface InfluencerSale {
  id: string;
  influencerId: string;
  orderId: string;
  orderTotal: number;
  commission: number;
  products: {
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  customerEmail: string;
  status: "pending" | "confirmed" | "paid" | "cancelled";
  createdAt: Date;
  paidAt?: Date;
}

export interface InfluencerClick {
  id: string;
  influencerId: string;
  productId?: string;
  source: string; // instagram, tiktok, direct, etc.
  timestamp: Date;
  converted: boolean;
  orderId?: string;
}

export interface InfluencerApplication {
  id: string;
  userId: string;
  email: string;
  name: string;
  username: string;
  bio: string;
  socialLinks: {
    instagram?: string;
    tiktok?: string;
    youtube?: string;
  };
  followerCount: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  notes?: string;
}

interface InfluencerContextType {
  influencers: Influencer[];
  currentInfluencer: Influencer | null;
  sales: InfluencerSale[];
  applications: InfluencerApplication[];
  isInfluencer: boolean;
  loading: boolean;
  
  // Influencer actions
  getInfluencerByUsername: (username: string) => Influencer | null;
  getInfluencerById: (id: string) => Influencer | null;
  updateCuratedProducts: (productIds: string[]) => Promise<boolean>;
  updateFeaturedProducts: (productIds: string[]) => Promise<boolean>;
  updateProfile: (updates: Partial<Influencer>) => Promise<boolean>;
  goLive: (streamUrl: string) => Promise<boolean>;
  endLive: () => Promise<boolean>;
  
  // Tracking
  trackClick: (influencerId: string, productId?: string, source?: string) => Promise<void>;
  recordSale: (influencerId: string, orderId: string, orderTotal: number, products: InfluencerSale["products"], customerEmail: string) => Promise<void>;
  
  // Admin actions
  approveApplication: (applicationId: string) => Promise<boolean>;
  rejectApplication: (applicationId: string, notes?: string) => Promise<boolean>;
  updateInfluencerTier: (influencerId: string, tier: Influencer["tier"]) => Promise<boolean>;
  updateCommissionRate: (influencerId: string, rate: number) => Promise<boolean>;
  toggleInfluencerActive: (influencerId: string) => Promise<boolean>;
  markSaleAsPaid: (saleId: string) => Promise<boolean>;
  
  // Applications
  applyAsInfluencer: (application: Omit<InfluencerApplication, "id" | "status" | "submittedAt">) => Promise<boolean>;
  
  // Analytics
  getInfluencerStats: (influencerId: string) => {
    totalEarnings: number;
    pendingEarnings: number;
    totalSales: number;
    totalClicks: number;
    conversionRate: number;
    recentSales: InfluencerSale[];
  };
  getLiveInfluencers: () => Influencer[];
}

const TIER_COMMISSION_RATES: Record<Influencer["tier"], number> = {
  bronze: 10,
  silver: 12,
  gold: 15,
  platinum: 18,
};

const InfluencerContext = createContext<InfluencerContextType | undefined>(undefined);

function mapInfluencer(i: Record<string, unknown>): Influencer {
  return {
    ...(i as Omit<Influencer, "joinedAt" | "lastActiveAt" | "tier" | "socialLinks">),
    socialLinks: (i.socialLinks ?? {}) as Influencer["socialLinks"],
    tier: String(i.tier) as Influencer["tier"],
    joinedAt: new Date(Number(i.joinedAt)),
    lastActiveAt: new Date(Number(i.lastActiveAt)),
  };
}

export function InfluencerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const convexInfluencers = useQuery(api.influencers.list);
  const convexApplications = useQuery(api.influencers.listApplications);
  const patchMut = useMutation(api.influencers.patchInfluencer);
  const trackClickMut = useMutation(api.influencers.trackClick);
  const recordSaleMut = useMutation(api.influencers.recordSale);
  const applyMut = useMutation(api.influencers.apply);
  const approveMut = useMutation(api.influencers.approveApplication);
  const rejectMut = useMutation(api.influencers.rejectApplication);
  const markPaidMut = useMutation(api.influencers.markSalePaid);

  const influencers = useMemo(
    () => (convexInfluencers ?? []).map(mapInfluencer),
    [convexInfluencers]
  );
  const loading = convexInfluencers === undefined;

  const currentInfluencer = useMemo(
    () => (user ? influencers.find((i) => i.userId === user.uid) ?? null : null),
    [influencers, user]
  );

  const convexSales = useQuery(
    api.influencers.listSales,
    currentInfluencer ? { influencerId: currentInfluencer.id } : "skip"
  );

  const sales: InfluencerSale[] = useMemo(
    () =>
      (convexSales ?? []).map((s) => ({
        ...s,
        status: s.status as InfluencerSale["status"],
        createdAt: new Date(s.createdAt),
        paidAt: s.paidAt ? new Date(s.paidAt) : undefined,
      })),
    [convexSales]
  );

  const applications: InfluencerApplication[] = useMemo(
    () =>
      (convexApplications ?? []).map((a) => ({
        ...a,
        status: a.status as InfluencerApplication["status"],
        socialLinks: a.socialLinks as InfluencerApplication["socialLinks"],
        submittedAt: new Date(a.submittedAt),
        reviewedAt: a.reviewedAt ? new Date(a.reviewedAt) : undefined,
      })),
    [convexApplications]
  );

  const getInfluencerByUsername = useCallback((username: string): Influencer | null => {
    return influencers.find(i => i.username.toLowerCase() === username.toLowerCase()) || null;
  }, [influencers]);

  const getInfluencerById = useCallback((id: string): Influencer | null => {
    return influencers.find(i => i.id === id) || null;
  }, [influencers]);

  const updateCuratedProducts = async (productIds: string[]): Promise<boolean> => {
    if (!currentInfluencer) return false;
    try {
      await patchMut({ id: currentInfluencer.id, patch: { curatedProducts: productIds } });
      return true;
    } catch (error) {
      console.error("Error updating curated products:", error);
      return false;
    }
  };

  const updateFeaturedProducts = async (productIds: string[]): Promise<boolean> => {
    if (!currentInfluencer) return false;
    try {
      await patchMut({
        id: currentInfluencer.id,
        patch: { featuredProducts: productIds.slice(0, 4) },
      });
      return true;
    } catch (error) {
      console.error("Error updating featured products:", error);
      return false;
    }
  };

  const updateProfile = async (updates: Partial<Influencer>): Promise<boolean> => {
    if (!currentInfluencer) return false;
    try {
      const {
        id: _id,
        userId: _userId,
        totalEarnings: _te,
        pendingEarnings: _pe,
        totalSales: _ts,
        totalClicks: _tc,
        totalConversions: _tconv,
        joinedAt: _ja,
        lastActiveAt: _la,
        ...safeUpdates
      } = updates;
      await patchMut({ id: currentInfluencer.id, patch: safeUpdates });
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  const goLive = async (streamUrl: string): Promise<boolean> => {
    if (!currentInfluencer) return false;
    try {
      await patchMut({
        id: currentInfluencer.id,
        patch: { isLive: true, liveStreamUrl: streamUrl },
      });
      return true;
    } catch (error) {
      console.error("Error going live:", error);
      return false;
    }
  };

  const endLive = async (): Promise<boolean> => {
    if (!currentInfluencer) return false;
    try {
      await patchMut({
        id: currentInfluencer.id,
        patch: { isLive: false, liveStreamUrl: undefined },
      });
      return true;
    } catch (error) {
      console.error("Error ending live:", error);
      return false;
    }
  };

  const trackClick = async (
    influencerId: string,
    productId?: string,
    source: string = "direct"
  ): Promise<void> => {
    try {
      await trackClickMut({ influencerId, productId, source });
      if (typeof window !== "undefined") {
        sessionStorage.setItem("influencer_ref", influencerId);
      }
    } catch (error) {
      console.error("Error tracking click:", error);
    }
  };

  const recordSale = async (
    influencerId: string,
    orderId: string,
    orderTotal: number,
    products: InfluencerSale["products"],
    customerEmail: string
  ): Promise<void> => {
    try {
      const clickLegacyId =
        typeof window !== "undefined"
          ? sessionStorage.getItem("influencer_click_id") ?? undefined
          : undefined;
      await recordSaleMut({
        influencerId,
        orderId,
        orderTotal,
        products,
        customerEmail,
        clickLegacyId,
      });
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("influencer_ref");
        sessionStorage.removeItem("influencer_click_id");
      }
    } catch (error) {
      console.error("Error recording sale:", error);
    }
  };

  const approveApplication = async (applicationId: string): Promise<boolean> => {
    try {
      await approveMut({ applicationId, reviewedBy: user?.uid });
      return true;
    } catch (error) {
      console.error("Error approving application:", error);
      return false;
    }
  };

  const rejectApplication = async (applicationId: string, notes?: string): Promise<boolean> => {
    try {
      await rejectMut({ applicationId, notes, reviewedBy: user?.uid });
      return true;
    } catch (error) {
      console.error("Error rejecting application:", error);
      return false;
    }
  };

  const updateInfluencerTier = async (
    influencerId: string,
    tier: Influencer["tier"]
  ): Promise<boolean> => {
    try {
      await patchMut({
        id: influencerId,
        patch: { tier, commissionRate: TIER_COMMISSION_RATES[tier] },
      });
      return true;
    } catch (error) {
      console.error("Error updating tier:", error);
      return false;
    }
  };

  const updateCommissionRate = async (influencerId: string, rate: number): Promise<boolean> => {
    try {
      await patchMut({
        id: influencerId,
        patch: { commissionRate: Math.min(30, Math.max(5, rate)) },
      });
      return true;
    } catch (error) {
      console.error("Error updating commission rate:", error);
      return false;
    }
  };

  const toggleInfluencerActive = async (influencerId: string): Promise<boolean> => {
    try {
      const influencer = getInfluencerById(influencerId);
      if (!influencer) return false;
      await patchMut({ id: influencerId, patch: { isActive: !influencer.isActive } });
      return true;
    } catch (error) {
      console.error("Error toggling active status:", error);
      return false;
    }
  };

  const markSaleAsPaid = async (saleId: string): Promise<boolean> => {
    try {
      await markPaidMut({ saleId });
      return true;
    } catch (error) {
      console.error("Error marking sale as paid:", error);
      return false;
    }
  };

  const applyAsInfluencer = async (
    application: Omit<InfluencerApplication, "id" | "status" | "submittedAt">
  ): Promise<boolean> => {
    try {
      const existingInfluencer = getInfluencerByUsername(application.username);
      if (existingInfluencer) throw new Error("Username already taken");
      const existingApp = applications.find(
        (a) => a.userId === application.userId && a.status === "pending"
      );
      if (existingApp) throw new Error("You already have a pending application");
      await applyMut(application);
      return true;
    } catch (error) {
      console.error("Error submitting application:", error);
      return false;
    }
  };

  const getInfluencerStats = useCallback((influencerId: string) => {
    const influencer = getInfluencerById(influencerId);
    const influencerSales = sales.filter(s => s.influencerId === influencerId);
    
    return {
      totalEarnings: influencer?.totalEarnings || 0,
      pendingEarnings: influencer?.pendingEarnings || 0,
      totalSales: influencer?.totalSales || 0,
      totalClicks: influencer?.totalClicks || 0,
      conversionRate: influencer?.totalClicks ? ((influencer.totalConversions / influencer.totalClicks) * 100) : 0,
      recentSales: influencerSales.slice(0, 10),
    };
  }, [sales, getInfluencerById]);

  const getLiveInfluencers = useCallback((): Influencer[] => {
    return influencers.filter(i => i.isLive && i.isActive);
  }, [influencers]);

  const contextValue = useMemo(
    () => ({
        influencers,
        currentInfluencer,
        sales,
        applications,
        isInfluencer: !!currentInfluencer,
        loading,
        getInfluencerByUsername,
        getInfluencerById,
        updateCuratedProducts,
        updateFeaturedProducts,
        updateProfile,
        goLive,
        endLive,
        trackClick,
        recordSale,
        approveApplication,
        rejectApplication,
        updateInfluencerTier,
        updateCommissionRate,
        toggleInfluencerActive,
        markSaleAsPaid,
        applyAsInfluencer,
        getInfluencerStats,
        getLiveInfluencers,
      }),
    [applications, applyAsInfluencer, approveApplication, currentInfluencer, endLive, getInfluencerById, getInfluencerByUsername, getInfluencerStats, getLiveInfluencers, goLive, influencers, loading, markSaleAsPaid, recordSale, rejectApplication, sales, toggleInfluencerActive, trackClick, updateCommissionRate, updateCuratedProducts, updateFeaturedProducts, updateInfluencerTier, updateProfile]
  );

  return (
    <InfluencerContext.Provider value={contextValue}>
      {children}
    </InfluencerContext.Provider>
  );
}

export function useInfluencer() {
  const context = use(InfluencerContext);
  if (context === undefined) {
    throw new Error("useInfluencer must be used within an InfluencerProvider");
  }
  return context;
}
