"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  increment,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
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

export function InfluencerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [currentInfluencer, setCurrentInfluencer] = useState<Influencer | null>(null);
  const [sales, setSales] = useState<InfluencerSale[]>([]);
  const [applications, setApplications] = useState<InfluencerApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to influencers
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "influencers"),
      (snapshot) => {
        const data: Influencer[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          data.push({
            ...docData,
            id: doc.id,
            joinedAt: docData.joinedAt?.toDate() || new Date(),
            lastActiveAt: docData.lastActiveAt?.toDate() || new Date(),
          } as Influencer);
        });
        setInfluencers(data);
        setLoading(false);
        
        // Check if current user is an influencer
        if (user) {
          const userInfluencer = data.find(i => i.userId === user.uid);
          setCurrentInfluencer(userInfluencer || null);
        }
      },
      (error) => {
        console.error("Error fetching influencers:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Subscribe to sales for current influencer
  useEffect(() => {
    if (!currentInfluencer) {
      setSales([]);
      return;
    }

    const q = query(
      collection(db, "influencerSales"),
      where("influencerId", "==", currentInfluencer.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: InfluencerSale[] = [];
      snapshot.forEach((doc) => {
        const docData = doc.data();
        data.push({
          ...docData,
          id: doc.id,
          createdAt: docData.createdAt?.toDate() || new Date(),
          paidAt: docData.paidAt?.toDate(),
        } as InfluencerSale);
      });
      setSales(data.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    }, (error) => {
      // Permission denied is expected for non-admin users
      if (error.code !== "permission-denied") {
        console.error("Error fetching influencer sales:", error);
      }
      setSales([]);
    });

    return () => unsubscribe();
  }, [currentInfluencer]);

  // Subscribe to applications (for admin) - only set up if user is authenticated
  useEffect(() => {
    if (!user) {
      setApplications([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "influencerApplications"),
      (snapshot) => {
        const data: InfluencerApplication[] = [];
        snapshot.forEach((doc) => {
          const docData = doc.data();
          data.push({
            ...docData,
            id: doc.id,
            submittedAt: docData.submittedAt?.toDate() || new Date(),
            reviewedAt: docData.reviewedAt?.toDate(),
          } as InfluencerApplication);
        });
        setApplications(data.sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()));
      },
      (error) => {
        // Permission denied is expected for non-admin users
        if (error.code !== "permission-denied") {
          console.error("Error fetching applications:", error);
        }
        setApplications([]);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const getInfluencerByUsername = useCallback((username: string): Influencer | null => {
    return influencers.find(i => i.username.toLowerCase() === username.toLowerCase()) || null;
  }, [influencers]);

  const getInfluencerById = useCallback((id: string): Influencer | null => {
    return influencers.find(i => i.id === id) || null;
  }, [influencers]);

  const updateCuratedProducts = async (productIds: string[]): Promise<boolean> => {
    if (!currentInfluencer) return false;
    try {
      await updateDoc(doc(db, "influencers", currentInfluencer.id), {
        curatedProducts: productIds,
        lastActiveAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error updating curated products:", error);
      return false;
    }
  };

  const updateFeaturedProducts = async (productIds: string[]): Promise<boolean> => {
    if (!currentInfluencer) return false;
    try {
      await updateDoc(doc(db, "influencers", currentInfluencer.id), {
        featuredProducts: productIds.slice(0, 4), // Max 4 featured
        lastActiveAt: serverTimestamp(),
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
      const { id, userId, totalEarnings, pendingEarnings, totalSales, totalClicks, totalConversions, ...safeUpdates } = updates;
      await updateDoc(doc(db, "influencers", currentInfluencer.id), {
        ...safeUpdates,
        lastActiveAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  const goLive = async (streamUrl: string): Promise<boolean> => {
    if (!currentInfluencer) return false;
    try {
      await updateDoc(doc(db, "influencers", currentInfluencer.id), {
        isLive: true,
        liveStreamUrl: streamUrl,
        lastActiveAt: serverTimestamp(),
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
      await updateDoc(doc(db, "influencers", currentInfluencer.id), {
        isLive: false,
        liveStreamUrl: null,
        lastActiveAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error ending live:", error);
      return false;
    }
  };

  const trackClick = async (influencerId: string, productId?: string, source: string = "direct"): Promise<void> => {
    try {
      const clickId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await setDoc(doc(db, "influencerClicks", clickId), {
        influencerId,
        productId,
        source,
        timestamp: serverTimestamp(),
        converted: false,
      });
      
      // Update influencer click count
      await updateDoc(doc(db, "influencers", influencerId), {
        totalClicks: increment(1),
      });
      
      // Store in session for conversion tracking
      if (typeof window !== "undefined") {
        sessionStorage.setItem("influencer_ref", influencerId);
        sessionStorage.setItem("influencer_click_id", clickId);
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
      const influencer = getInfluencerById(influencerId);
      if (!influencer) return;

      const commission = (orderTotal * influencer.commissionRate) / 100;
      const saleId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await setDoc(doc(db, "influencerSales", saleId), {
        influencerId,
        orderId,
        orderTotal,
        commission,
        products,
        customerEmail,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Update influencer stats
      await updateDoc(doc(db, "influencers", influencerId), {
        totalSales: increment(1),
        totalConversions: increment(1),
        pendingEarnings: increment(commission),
      });

      // Mark click as converted if exists
      const clickId = typeof window !== "undefined" ? sessionStorage.getItem("influencer_click_id") : null;
      if (clickId) {
        try {
          await updateDoc(doc(db, "influencerClicks", clickId), {
            converted: true,
            orderId,
          });
        } catch {
          // Click may not exist
        }
        sessionStorage.removeItem("influencer_ref");
        sessionStorage.removeItem("influencer_click_id");
      }
    } catch (error) {
      console.error("Error recording sale:", error);
    }
  };

  const approveApplication = async (applicationId: string): Promise<boolean> => {
    try {
      const application = applications.find(a => a.id === applicationId);
      if (!application) return false;

      // Create influencer profile
      const influencerId = `inf_${Date.now()}`;
      await setDoc(doc(db, "influencers", influencerId), {
        userId: application.userId,
        username: application.username,
        displayName: application.name,
        bio: application.bio,
        avatar: "",
        socialLinks: application.socialLinks,
        commissionRate: TIER_COMMISSION_RATES.bronze,
        tier: "bronze",
        isActive: true,
        isVerified: false,
        curatedProducts: [],
        featuredProducts: [],
        totalEarnings: 0,
        pendingEarnings: 0,
        totalSales: 0,
        totalClicks: 0,
        totalConversions: 0,
        conversionRate: 0,
        joinedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        isLive: false,
        followers: application.followerCount,
      });

      // Update application status
      await updateDoc(doc(db, "influencerApplications", applicationId), {
        status: "approved",
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.uid,
      });

      return true;
    } catch (error) {
      console.error("Error approving application:", error);
      return false;
    }
  };

  const rejectApplication = async (applicationId: string, notes?: string): Promise<boolean> => {
    try {
      await updateDoc(doc(db, "influencerApplications", applicationId), {
        status: "rejected",
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.uid,
        notes,
      });
      return true;
    } catch (error) {
      console.error("Error rejecting application:", error);
      return false;
    }
  };

  const updateInfluencerTier = async (influencerId: string, tier: Influencer["tier"]): Promise<boolean> => {
    try {
      await updateDoc(doc(db, "influencers", influencerId), {
        tier,
        commissionRate: TIER_COMMISSION_RATES[tier],
      });
      return true;
    } catch (error) {
      console.error("Error updating tier:", error);
      return false;
    }
  };

  const updateCommissionRate = async (influencerId: string, rate: number): Promise<boolean> => {
    try {
      await updateDoc(doc(db, "influencers", influencerId), {
        commissionRate: Math.min(30, Math.max(5, rate)), // 5-30% range
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
      
      await updateDoc(doc(db, "influencers", influencerId), {
        isActive: !influencer.isActive,
      });
      return true;
    } catch (error) {
      console.error("Error toggling active status:", error);
      return false;
    }
  };

  const markSaleAsPaid = async (saleId: string): Promise<boolean> => {
    try {
      const sale = sales.find(s => s.id === saleId);
      if (!sale) return false;

      await updateDoc(doc(db, "influencerSales", saleId), {
        status: "paid",
        paidAt: serverTimestamp(),
      });

      // Move from pending to total earnings
      await updateDoc(doc(db, "influencers", sale.influencerId), {
        pendingEarnings: increment(-sale.commission),
        totalEarnings: increment(sale.commission),
      });

      return true;
    } catch (error) {
      console.error("Error marking sale as paid:", error);
      return false;
    }
  };

  const applyAsInfluencer = async (application: Omit<InfluencerApplication, "id" | "status" | "submittedAt">): Promise<boolean> => {
    try {
      // Check if username is taken
      const existingInfluencer = getInfluencerByUsername(application.username);
      if (existingInfluencer) {
        throw new Error("Username already taken");
      }

      // Check for existing application
      const existingApp = applications.find(a => a.userId === application.userId && a.status === "pending");
      if (existingApp) {
        throw new Error("You already have a pending application");
      }

      const appId = `app_${Date.now()}`;
      await setDoc(doc(db, "influencerApplications", appId), {
        ...application,
        status: "pending",
        submittedAt: serverTimestamp(),
      });
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

  return (
    <InfluencerContext.Provider
      value={{
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
      }}
    >
      {children}
    </InfluencerContext.Provider>
  );
}

export function useInfluencer() {
  const context = useContext(InfluencerContext);
  if (context === undefined) {
    throw new Error("useInfluencer must be used within an InfluencerProvider");
  }
  return context;
}
