"use client";
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot, setDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

export interface PricingRule {
  id: string;
  type: "flash_sale" | "demand_surge" | "low_stock" | "time_based" | "bulk_discount" | "happy_hour";
  productId?: string; // specific product or null for global
  category?: string; // specific category or null for all
  discountPercent?: number; // percentage off
  discountAmount?: number; // fixed amount off
  multiplier?: number; // price multiplier for surge pricing
  minQuantity?: number; // for bulk discounts
  startTime?: Date;
  endTime?: Date;
  isActive: boolean;
  priority: number; // higher priority rules override lower ones
  conditions?: {
    minViewers?: number; // surge when viewers exceed this
    maxStock?: number; // discount when stock below this
    daysOfWeek?: number[]; // 0-6 for specific days
    hourStart?: number; // 0-23
    hourEnd?: number; // 0-23
  };
}

export interface DynamicPrice {
  originalPrice: number;
  currentPrice: number;
  discountPercent: number;
  activeRules: string[];
  expiresAt?: Date;
  reason?: string;
}

interface DynamicPricingContextType {
  pricingRules: PricingRule[];
  getDynamicPrice: (productId: string, originalPrice: number, category?: string, quantity?: number, stockLevel?: number, viewerCount?: number) => DynamicPrice;
  createRule: (rule: Omit<PricingRule, "id">) => Promise<string | null>;
  updateRule: (id: string, updates: Partial<PricingRule>) => Promise<boolean>;
  deleteRule: (id: string) => Promise<boolean>;
  toggleRule: (id: string) => Promise<boolean>;
  getActiveFlashSales: () => PricingRule[];
  getProductRules: (productId: string) => PricingRule[];
}

const DynamicPricingContext = createContext<DynamicPricingContextType | undefined>(undefined);

export function DynamicPricingProvider({ children }: { children: ReactNode }) {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);

  // Subscribe to pricing rules
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "pricingRules"),
      (snapshot) => {
        const rules: PricingRule[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          rules.push({
            id: doc.id,
            type: data.type,
            productId: data.productId,
            category: data.category,
            discountPercent: data.discountPercent,
            discountAmount: data.discountAmount,
            multiplier: data.multiplier,
            minQuantity: data.minQuantity,
            startTime: data.startTime?.toDate(),
            endTime: data.endTime?.toDate(),
            isActive: data.isActive,
            priority: data.priority || 0,
            conditions: data.conditions,
          });
        });
        // Sort by priority (higher first)
        rules.sort((a, b) => b.priority - a.priority);
        setPricingRules(rules);
      },
      (error) => {
        console.error("Error fetching pricing rules:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const isRuleApplicable = useCallback((
    rule: PricingRule,
    productId: string,
    category?: string,
    quantity?: number,
    stockLevel?: number,
    viewerCount?: number
  ): boolean => {
    // Check if rule is active
    if (!rule.isActive) return false;

    // Check product/category match
    if (rule.productId && rule.productId !== productId) return false;
    if (rule.category && rule.category !== category) return false;

    // Check time constraints
    const now = new Date();
    if (rule.startTime && now < rule.startTime) return false;
    if (rule.endTime && now > rule.endTime) return false;

    // Check conditions
    if (rule.conditions) {
      // Check viewer threshold for surge pricing
      if (rule.conditions.minViewers !== undefined && viewerCount !== undefined) {
        if (viewerCount < rule.conditions.minViewers) return false;
      }

      // Check stock level for low stock discounts
      if (rule.conditions.maxStock !== undefined && stockLevel !== undefined) {
        if (stockLevel > rule.conditions.maxStock) return false;
      }

      // Check day of week
      if (rule.conditions.daysOfWeek && rule.conditions.daysOfWeek.length > 0) {
        if (!rule.conditions.daysOfWeek.includes(now.getDay())) return false;
      }

      // Check hour range (happy hour)
      if (rule.conditions.hourStart !== undefined && rule.conditions.hourEnd !== undefined) {
        const currentHour = now.getHours();
        if (currentHour < rule.conditions.hourStart || currentHour >= rule.conditions.hourEnd) {
          return false;
        }
      }
    }

    // Check minimum quantity for bulk discounts
    if (rule.minQuantity !== undefined && quantity !== undefined) {
      if (quantity < rule.minQuantity) return false;
    }

    return true;
  }, []);

  const getDynamicPrice = useCallback((
    productId: string,
    originalPrice: number,
    category?: string,
    quantity: number = 1,
    stockLevel?: number,
    viewerCount?: number
  ): DynamicPrice => {
    let currentPrice = originalPrice;
    const activeRules: string[] = [];
    let totalDiscountPercent = 0;
    let expiresAt: Date | undefined;
    const reasons: string[] = [];

    // Find applicable rules (already sorted by priority)
    const applicableRules = pricingRules.filter(rule =>
      isRuleApplicable(rule, productId, category, quantity, stockLevel, viewerCount)
    );

    for (const rule of applicableRules) {
      let ruleDiscount = 0;

      switch (rule.type) {
        case "flash_sale":
          if (rule.discountPercent) {
            ruleDiscount = rule.discountPercent;
            reasons.push(`Flash Sale: ${rule.discountPercent}% off`);
          } else if (rule.discountAmount) {
            ruleDiscount = (rule.discountAmount / originalPrice) * 100;
            reasons.push(`Flash Sale: $${rule.discountAmount} off`);
          }
          if (rule.endTime) expiresAt = rule.endTime;
          break;

        case "demand_surge":
          // Surge pricing increases price
          if (rule.multiplier && rule.multiplier > 1) {
            currentPrice = currentPrice * rule.multiplier;
            reasons.push(`High Demand: ${((rule.multiplier - 1) * 100).toFixed(0)}% surge`);
          }
          break;

        case "low_stock":
          // Low stock can either discount (clearance) or surge (scarcity)
          if (rule.discountPercent) {
            ruleDiscount = rule.discountPercent;
            reasons.push(`Low Stock: ${rule.discountPercent}% off`);
          } else if (rule.multiplier && rule.multiplier > 1) {
            currentPrice = currentPrice * rule.multiplier;
            reasons.push(`Limited Stock`);
          }
          break;

        case "time_based":
          if (rule.discountPercent) {
            ruleDiscount = rule.discountPercent;
            reasons.push(`Limited Time: ${rule.discountPercent}% off`);
          }
          if (rule.endTime) expiresAt = rule.endTime;
          break;

        case "bulk_discount":
          if (rule.discountPercent) {
            ruleDiscount = rule.discountPercent;
            reasons.push(`Bulk Discount: ${rule.discountPercent}% off for ${rule.minQuantity}+ items`);
          }
          break;

        case "happy_hour":
          if (rule.discountPercent) {
            ruleDiscount = rule.discountPercent;
            reasons.push(`Happy Hour: ${rule.discountPercent}% off`);
          }
          break;
      }

      if (ruleDiscount > 0) {
        totalDiscountPercent += ruleDiscount;
        currentPrice = currentPrice * (1 - ruleDiscount / 100);
        activeRules.push(rule.id);
      } else if (rule.multiplier) {
        activeRules.push(rule.id);
      }
    }

    // Cap discount at 70%
    if (totalDiscountPercent > 70) {
      totalDiscountPercent = 70;
      currentPrice = originalPrice * 0.3;
    }

    // Round to 2 decimal places
    currentPrice = Math.round(currentPrice * 100) / 100;

    return {
      originalPrice,
      currentPrice,
      discountPercent: Math.round(totalDiscountPercent),
      activeRules,
      expiresAt,
      reason: reasons.join(" + "),
    };
  }, [pricingRules, isRuleApplicable]);

  const createRule = async (rule: Omit<PricingRule, "id">): Promise<string | null> => {
    try {
      const id = `rule_${Date.now()}`;
      await setDoc(doc(db, "pricingRules", id), {
        ...rule,
        createdAt: serverTimestamp(),
      });
      return id;
    } catch (error) {
      console.error("Error creating pricing rule:", error);
      return null;
    }
  };

  const updateRule = async (id: string, updates: Partial<PricingRule>): Promise<boolean> => {
    try {
      await setDoc(doc(db, "pricingRules", id), {
        ...updates,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Error updating pricing rule:", error);
      return false;
    }
  };

  const deleteRule = async (id: string): Promise<boolean> => {
    try {
      const { deleteDoc } = await import("firebase/firestore");
      await deleteDoc(doc(db, "pricingRules", id));
      return true;
    } catch (error) {
      console.error("Error deleting pricing rule:", error);
      return false;
    }
  };

  const toggleRule = async (id: string): Promise<boolean> => {
    const rule = pricingRules.find(r => r.id === id);
    if (!rule) return false;
    return updateRule(id, { isActive: !rule.isActive });
  };

  const getActiveFlashSales = useCallback((): PricingRule[] => {
    const now = new Date();
    return pricingRules.filter(rule =>
      rule.isActive &&
      rule.type === "flash_sale" &&
      (!rule.startTime || now >= rule.startTime) &&
      (!rule.endTime || now <= rule.endTime)
    );
  }, [pricingRules]);

  const getProductRules = useCallback((productId: string): PricingRule[] => {
    return pricingRules.filter(rule =>
      rule.isActive && (!rule.productId || rule.productId === productId)
    );
  }, [pricingRules]);

  return (
    <DynamicPricingContext.Provider value={{
      pricingRules,
      getDynamicPrice,
      createRule,
      updateRule,
      deleteRule,
      toggleRule,
      getActiveFlashSales,
      getProductRules,
    }}>
      {children}
    </DynamicPricingContext.Provider>
  );
}

export function useDynamicPricing() {
  const context = useContext(DynamicPricingContext);
  if (!context) {
    throw new Error("useDynamicPricing must be used within a DynamicPricingProvider");
  }
  return context;
}
