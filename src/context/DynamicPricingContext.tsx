"use client";
import { createContext, use, ReactNode, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

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
  const convexRules = useQuery(api.pricingRules.list);
  const createRuleMut = useMutation(api.pricingRules.create);
  const updateRuleMut = useMutation(api.pricingRules.update);
  const removeRuleMut = useMutation(api.pricingRules.remove);
  const toggleRuleMut = useMutation(api.pricingRules.toggle);

  const pricingRules: PricingRule[] = (convexRules ?? []).map((r) => ({
    id: r.id,
    type: r.type as PricingRule["type"],
    productId: r.productId,
    category: r.category,
    discountPercent: r.discountPercent,
    discountAmount: r.discountAmount,
    multiplier: r.multiplier,
    minQuantity: r.minQuantity,
    startTime: r.startTime ? new Date(r.startTime) : undefined,
    endTime: r.endTime ? new Date(r.endTime) : undefined,
    isActive: r.isActive,
    priority: r.priority,
    conditions: r.conditions as PricingRule["conditions"],
  }));

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
      const id = await createRuleMut({
        type: rule.type,
        productId: rule.productId,
        category: rule.category,
        discountPercent: rule.discountPercent,
        discountAmount: rule.discountAmount,
        multiplier: rule.multiplier,
        minQuantity: rule.minQuantity,
        startTime: rule.startTime?.getTime(),
        endTime: rule.endTime?.getTime(),
        isActive: rule.isActive,
        priority: rule.priority,
        conditions: rule.conditions,
      });
      return id;
    } catch (error) {
      console.error("Error creating pricing rule:", error);
      return null;
    }
  };

  const updateRule = async (id: string, updates: Partial<PricingRule>): Promise<boolean> => {
    try {
      const existing = pricingRules.find((r) => r.id === id);
      if (!existing) return false;
      await updateRuleMut({
        id,
        patch: {
          type: updates.type ?? existing.type,
          productId: updates.productId ?? existing.productId,
          category: updates.category ?? existing.category,
          discountPercent: updates.discountPercent ?? existing.discountPercent,
          discountAmount: updates.discountAmount ?? existing.discountAmount,
          multiplier: updates.multiplier ?? existing.multiplier,
          minQuantity: updates.minQuantity ?? existing.minQuantity,
          startTime: (updates.startTime ?? existing.startTime)?.getTime(),
          endTime: (updates.endTime ?? existing.endTime)?.getTime(),
          isActive: updates.isActive ?? existing.isActive,
          priority: updates.priority ?? existing.priority,
          conditions: updates.conditions ?? existing.conditions,
        },
      });
      return true;
    } catch (error) {
      console.error("Error updating pricing rule:", error);
      return false;
    }
  };

  const deleteRule = async (id: string): Promise<boolean> => {
    try {
      await removeRuleMut({ id });
      return true;
    } catch (error) {
      console.error("Error deleting pricing rule:", error);
      return false;
    }
  };

  const toggleRule = async (id: string): Promise<boolean> => {
    try {
      await toggleRuleMut({ id });
      return true;
    } catch {
      return false;
    }
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

  const contextValue = useMemo(
    () => ({
      pricingRules,
      getDynamicPrice,
      createRule,
      updateRule,
      deleteRule,
      toggleRule,
      getActiveFlashSales,
      getProductRules,
    }),
    [createRule, deleteRule, getActiveFlashSales, getDynamicPrice, getProductRules, pricingRules, toggleRule, updateRule]
  );

  return (
    <DynamicPricingContext.Provider value={contextValue}>
      {children}
    </DynamicPricingContext.Provider>
  );
}

export function useDynamicPricing() {
  const context = use(DynamicPricingContext);
  if (!context) {
    throw new Error("useDynamicPricing must be used within a DynamicPricingProvider");
  }
  return context;
}
