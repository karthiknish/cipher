"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  where,
  updateDoc,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { useAuth } from "./AuthContext";

// ============================================================================
// TYPES
// ============================================================================

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: "homepage" | "events" | "checkout" | "popup" | "other";
  status: "active" | "unsubscribed" | "bounced";
  subscribedAt: Date;
  unsubscribedAt?: Date;
  tags: string[];
  firstName?: string;
  lastName?: string;
  promoCodeSent?: boolean;
  openRate?: number;
  clickRate?: number;
}

export interface NewsletterCampaign {
  id: string;
  subject: string;
  previewText: string;
  content: string;
  status: "draft" | "scheduled" | "sent";
  scheduledFor?: Date;
  sentAt?: Date;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  createdAt: Date;
  createdBy: string;
  tags: string[];
}

interface NewsletterContextType {
  subscribers: NewsletterSubscriber[];
  campaigns: NewsletterCampaign[];
  loading: boolean;
  
  // Subscriber actions
  subscribe: (email: string, source?: NewsletterSubscriber["source"], firstName?: string) => Promise<{ success: boolean; message: string }>;
  unsubscribe: (email: string) => Promise<boolean>;
  updateSubscriber: (id: string, updates: Partial<NewsletterSubscriber>) => Promise<boolean>;
  deleteSubscriber: (id: string) => Promise<boolean>;
  getSubscriberByEmail: (email: string) => NewsletterSubscriber | undefined;
  
  // Stats
  getStats: () => {
    total: number;
    active: number;
    unsubscribed: number;
    thisMonth: number;
    bySource: Record<string, number>;
  };
  
  // Campaign actions (admin)
  createCampaign: (campaign: Omit<NewsletterCampaign, "id" | "createdAt" | "openCount" | "clickCount">) => Promise<string | null>;
  updateCampaign: (id: string, updates: Partial<NewsletterCampaign>) => Promise<boolean>;
  deleteCampaign: (id: string) => Promise<boolean>;
  
  // Admin
  loadAllSubscribers: () => Promise<void>;
  exportSubscribers: () => string;
}

const NewsletterContext = createContext<NewsletterContextType | undefined>(undefined);

export const useNewsletter = () => {
  const context = useContext(NewsletterContext);
  if (!context) {
    throw new Error("useNewsletter must be used within a NewsletterProvider");
  }
  return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

export function NewsletterProvider({ children }: { children: ReactNode }) {
  const { user, userRole } = useAuth();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [campaigns, setCampaigns] = useState<NewsletterCampaign[]>([]);
  const [loading, setLoading] = useState(false);

  const isAdmin = userRole?.isAdmin ?? false;

  // Load subscribers for admin
  useEffect(() => {
    if (isAdmin) {
      loadAllSubscribers();
      loadCampaigns();
    }
  }, [isAdmin]);

  const loadAllSubscribers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "newsletter_subscribers"), orderBy("subscribedAt", "desc"));
      const snapshot = await getDocs(q);
      const subs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        subscribedAt: doc.data().subscribedAt?.toDate() || new Date(),
        unsubscribedAt: doc.data().unsubscribedAt?.toDate(),
      })) as NewsletterSubscriber[];
      setSubscribers(subs);
    } catch (error) {
      console.error("Error loading subscribers:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const q = query(collection(db, "newsletter_campaigns"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const camps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        sentAt: doc.data().sentAt?.toDate(),
        scheduledFor: doc.data().scheduledFor?.toDate(),
      })) as NewsletterCampaign[];
      setCampaigns(camps);
    } catch (error) {
      console.error("Error loading campaigns:", error);
    }
  };

  const subscribe = async (
    email: string, 
    source: NewsletterSubscriber["source"] = "homepage",
    firstName?: string
  ): Promise<{ success: boolean; message: string }> => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: "Please enter a valid email address" };
    }

    try {
      // Check if already subscribed
      const q = query(collection(db, "newsletter_subscribers"), where("email", "==", email.toLowerCase()));
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        const existingDoc = existing.docs[0];
        const data = existingDoc.data();
        
        if (data.status === "active") {
          return { success: false, message: "You're already subscribed!" };
        } else {
          // Reactivate subscription
          await updateDoc(doc(db, "newsletter_subscribers", existingDoc.id), {
            status: "active",
            subscribedAt: serverTimestamp(),
            unsubscribedAt: null,
          });
          return { success: true, message: "Welcome back! Your subscription has been reactivated." };
        }
      }

      // Create new subscriber
      await addDoc(collection(db, "newsletter_subscribers"), {
        email: email.toLowerCase(),
        source,
        status: "active",
        subscribedAt: serverTimestamp(),
        tags: ["new"],
        firstName: firstName || "",
        promoCodeSent: false,
      });

      return { success: true, message: "Thanks for subscribing! Check your email for 10% off." };
    } catch (error) {
      console.error("Error subscribing:", error);
      return { success: false, message: "Something went wrong. Please try again." };
    }
  };

  const unsubscribe = async (email: string): Promise<boolean> => {
    try {
      const q = query(collection(db, "newsletter_subscribers"), where("email", "==", email.toLowerCase()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return false;

      await updateDoc(doc(db, "newsletter_subscribers", snapshot.docs[0].id), {
        status: "unsubscribed",
        unsubscribedAt: serverTimestamp(),
      });

      if (isAdmin) await loadAllSubscribers();
      return true;
    } catch (error) {
      console.error("Error unsubscribing:", error);
      return false;
    }
  };

  const updateSubscriber = async (id: string, updates: Partial<NewsletterSubscriber>): Promise<boolean> => {
    try {
      await updateDoc(doc(db, "newsletter_subscribers", id), updates);
      if (isAdmin) await loadAllSubscribers();
      return true;
    } catch (error) {
      console.error("Error updating subscriber:", error);
      return false;
    }
  };

  const deleteSubscriber = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, "newsletter_subscribers", id));
      setSubscribers(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      return false;
    }
  };

  const getSubscriberByEmail = (email: string): NewsletterSubscriber | undefined => {
    return subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());
  };

  const getStats = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const active = subscribers.filter(s => s.status === "active");
    const unsubscribed = subscribers.filter(s => s.status === "unsubscribed");
    const thisMonth = subscribers.filter(s => s.subscribedAt >= startOfMonth && s.status === "active");
    
    const bySource: Record<string, number> = {};
    active.forEach(s => {
      bySource[s.source] = (bySource[s.source] || 0) + 1;
    });

    return {
      total: subscribers.length,
      active: active.length,
      unsubscribed: unsubscribed.length,
      thisMonth: thisMonth.length,
      bySource,
    };
  };

  const createCampaign = async (
    campaign: Omit<NewsletterCampaign, "id" | "createdAt" | "openCount" | "clickCount">
  ): Promise<string | null> => {
    try {
      const docRef = await addDoc(collection(db, "newsletter_campaigns"), {
        ...campaign,
        createdAt: serverTimestamp(),
        openCount: 0,
        clickCount: 0,
      });
      await loadCampaigns();
      return docRef.id;
    } catch (error) {
      console.error("Error creating campaign:", error);
      return null;
    }
  };

  const updateCampaign = async (id: string, updates: Partial<NewsletterCampaign>): Promise<boolean> => {
    try {
      await updateDoc(doc(db, "newsletter_campaigns", id), updates);
      await loadCampaigns();
      return true;
    } catch (error) {
      console.error("Error updating campaign:", error);
      return false;
    }
  };

  const deleteCampaign = async (id: string): Promise<boolean> => {
    try {
      await deleteDoc(doc(db, "newsletter_campaigns", id));
      setCampaigns(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (error) {
      console.error("Error deleting campaign:", error);
      return false;
    }
  };

  const exportSubscribers = (): string => {
    const header = "email,firstName,lastName,status,source,subscribedAt,tags\n";
    const rows = subscribers
      .filter(s => s.status === "active")
      .map(s => 
        `${s.email},${s.firstName || ""},${s.lastName || ""},${s.status},${s.source},${s.subscribedAt.toISOString()},${s.tags.join(";")}`
      )
      .join("\n");
    return header + rows;
  };

  return (
    <NewsletterContext.Provider value={{
      subscribers,
      campaigns,
      loading,
      subscribe,
      unsubscribe,
      updateSubscriber,
      deleteSubscriber,
      getSubscriberByEmail,
      getStats,
      createCampaign,
      updateCampaign,
      deleteCampaign,
      loadAllSubscribers,
      exportSubscribers,
    }}>
      {children}
    </NewsletterContext.Provider>
  );
}
