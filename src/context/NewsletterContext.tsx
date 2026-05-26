"use client";

import { createContext, use, useState, useEffect, ReactNode, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
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
  const context = use(NewsletterContext);
  if (!context) {
    throw new Error("useNewsletter must be used within a NewsletterProvider");
  }
  return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

export function NewsletterProvider({ children }: { children: ReactNode }) {
  const { userRole } = useAuth();
  const isAdmin = userRole?.isAdmin ?? false;
  const convexSubs = useQuery(
    api.newsletter.listSubscribers,
    isAdmin ? {} : "skip"
  );
  const convexCampaigns = useQuery(
    api.newsletter.listCampaigns,
    isAdmin ? {} : "skip"
  );
  const subscribeMut = useMutation(api.newsletter.subscribe);
  const unsubscribeMut = useMutation(api.newsletter.unsubscribe);
  const updateSubscriberMut = useMutation(api.newsletter.updateSubscriber);
  const removeSubscriberMut = useMutation(api.newsletter.removeSubscriber);
  const createCampaignMut = useMutation(api.newsletter.createCampaign);
  const updateCampaignMut = useMutation(api.newsletter.updateCampaign);
  const removeCampaignMut = useMutation(api.newsletter.removeCampaign);

  const subscribers: NewsletterSubscriber[] = (convexSubs ?? []).map((s) => ({
    id: s.id,
    email: s.email,
    source: s.source as NewsletterSubscriber["source"],
    status: s.status as NewsletterSubscriber["status"],
    subscribedAt: new Date(s.subscribedAt),
    unsubscribedAt: s.unsubscribedAt ? new Date(s.unsubscribedAt) : undefined,
    tags: s.tags,
    firstName: s.firstName,
    lastName: s.lastName,
    promoCodeSent: s.promoCodeSent,
  }));

  const campaigns: NewsletterCampaign[] = (convexCampaigns ?? []).map((c) => ({
    id: c.id,
    subject: c.subject,
    previewText: c.previewText,
    content: c.content,
    status: c.status as NewsletterCampaign["status"],
    scheduledFor: c.scheduledFor ? new Date(c.scheduledFor) : undefined,
    sentAt: c.sentAt ? new Date(c.sentAt) : undefined,
    recipientCount: c.recipientCount,
    openCount: c.openCount,
    clickCount: c.clickCount,
    createdAt: new Date(c.createdAt),
    createdBy: c.createdBy,
    tags: c.tags,
  }));

  const loading = isAdmin && (convexSubs === undefined || convexCampaigns === undefined);

  const loadAllSubscribers = async () => {};
  const loadCampaigns = async () => {};

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
      return await subscribeMut({
        email: email.toLowerCase(),
        source,
        firstName,
      });
    } catch (error) {
      console.error("Error subscribing:", error);
      return { success: false, message: "Something went wrong. Please try again." };
    }
  };

  const unsubscribe = async (email: string): Promise<boolean> => {
    try {
      return await unsubscribeMut({ email: email.toLowerCase() });
    } catch (error) {
      console.error("Error unsubscribing:", error);
      return false;
    }
  };

  const updateSubscriber = async (
    id: string,
    updates: Partial<NewsletterSubscriber>
  ): Promise<boolean> => {
    try {
      await updateSubscriberMut({ id, patch: updates });
      return true;
    } catch (error) {
      console.error("Error updating subscriber:", error);
      return false;
    }
  };

  const deleteSubscriber = async (id: string): Promise<boolean> => {
    try {
      await removeSubscriberMut({ id });
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
      return await createCampaignMut({
        subject: campaign.subject,
        previewText: campaign.previewText,
        content: campaign.content,
        status: campaign.status,
        scheduledFor: campaign.scheduledFor?.getTime(),
        recipientCount: campaign.recipientCount,
        createdBy: campaign.createdBy,
        tags: campaign.tags,
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
      return null;
    }
  };

  const updateCampaign = async (
    id: string,
    updates: Partial<NewsletterCampaign>
  ): Promise<boolean> => {
    try {
      const patch: Record<string, unknown> = { ...updates };
      if (updates.scheduledFor)
        patch.scheduledFor = updates.scheduledFor.getTime();
      if (updates.sentAt) patch.sentAt = updates.sentAt.getTime();
      await updateCampaignMut({ id, patch });
      return true;
    } catch (error) {
      console.error("Error updating campaign:", error);
      return false;
    }
  };

  const deleteCampaign = async (id: string): Promise<boolean> => {
    try {
      await removeCampaignMut({ id });
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

  const contextValue = useMemo(
    () => ({
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
    }),
    [campaigns, createCampaign, deleteCampaign, deleteSubscriber, exportSubscribers, getStats, getSubscriberByEmail, loadAllSubscribers, loading, subscribe, subscribers, unsubscribe, updateCampaign, updateSubscriber]
  );

  return (
    <NewsletterContext.Provider value={contextValue}>
      {children}
    </NewsletterContext.Provider>
  );
}
