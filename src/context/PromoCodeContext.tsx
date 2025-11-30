"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface PromoCode {
  code: string;
  type: "percentage" | "fixed" | "freeShipping";
  value: number; // percentage (0-100) or fixed amount
  minPurchase: number;
  maxDiscount?: number; // cap for percentage discounts
  validUntil: number; // timestamp
  usageLimit?: number;
  usedCount: number;
  description: string;
  applicableCategories?: string[]; // empty = all categories
}

interface PromoCodeContextType {
  appliedCode: PromoCode | null;
  discount: number;
  applyCode: (code: string, subtotal: number, categories?: string[]) => { success: boolean; message: string };
  removeCode: () => void;
  validateCode: (code: string) => PromoCode | null;
  calculateDiscount: (code: PromoCode, subtotal: number) => number;
  getAvailableCodes: () => PromoCode[];
}

// Available promo codes (in production, these would come from a database)
const PROMO_CODES: PromoCode[] = [
  {
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    minPurchase: 0,
    validUntil: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
    usedCount: 0,
    description: "10% off your first order",
  },
  {
    code: "CIPHER20",
    type: "percentage",
    value: 20,
    minPurchase: 100,
    maxDiscount: 50,
    validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    usedCount: 0,
    description: "20% off orders over $100 (max $50 off)",
  },
  {
    code: "FREESHIP",
    type: "freeShipping",
    value: 0,
    minPurchase: 50,
    validUntil: Date.now() + 60 * 24 * 60 * 60 * 1000, // 60 days
    usedCount: 0,
    description: "Free shipping on orders over $50",
  },
  {
    code: "SAVE25",
    type: "fixed",
    value: 25,
    minPurchase: 150,
    validUntil: Date.now() + 14 * 24 * 60 * 60 * 1000, // 14 days
    usedCount: 0,
    description: "$25 off orders over $150",
  },
  {
    code: "HOODIE15",
    type: "percentage",
    value: 15,
    minPurchase: 0,
    validUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
    usedCount: 0,
    description: "15% off all hoodies",
    applicableCategories: ["Hoodies"],
  },
  {
    code: "NEWSEASON",
    type: "percentage",
    value: 30,
    minPurchase: 200,
    maxDiscount: 100,
    validUntil: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    usedCount: 0,
    description: "30% off orders over $200 (max $100 off) - Limited time!",
  },
];

const STORAGE_KEY = "cipher_applied_promo";

const PromoCodeContext = createContext<PromoCodeContextType>({
  appliedCode: null,
  discount: 0,
  applyCode: () => ({ success: false, message: "" }),
  removeCode: () => {},
  validateCode: () => null,
  calculateDiscount: () => 0,
  getAvailableCodes: () => [],
});

export const usePromoCode = () => useContext(PromoCodeContext);

export const PromoCodeProvider = ({ children }: { children: ReactNode }) => {
  const [appliedCode, setAppliedCode] = useState<PromoCode | null>(null);
  const [discount, setDiscount] = useState(0);

  // Load applied code from storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const { code, discount: savedDiscount } = JSON.parse(stored);
          const validCode = PROMO_CODES.find(p => p.code === code);
          if (validCode && validCode.validUntil > Date.now()) {
            setAppliedCode(validCode);
            setDiscount(savedDiscount);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        } catch {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    }
  }, []);

  const validateCode = useCallback((code: string): PromoCode | null => {
    const upperCode = code.toUpperCase().trim();
    const promo = PROMO_CODES.find(p => p.code === upperCode);
    
    if (!promo) return null;
    if (promo.validUntil < Date.now()) return null;
    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) return null;
    
    return promo;
  }, []);

  const calculateDiscount = useCallback((code: PromoCode, subtotal: number): number => {
    if (code.type === "freeShipping") {
      return 0; // Free shipping handled separately in checkout
    }

    if (code.type === "fixed") {
      return Math.min(code.value, subtotal);
    }

    if (code.type === "percentage") {
      let discountAmount = (subtotal * code.value) / 100;
      if (code.maxDiscount) {
        discountAmount = Math.min(discountAmount, code.maxDiscount);
      }
      return Math.round(discountAmount * 100) / 100;
    }

    return 0;
  }, []);

  const applyCode = useCallback((code: string, subtotal: number, categories?: string[]): { success: boolean; message: string } => {
    const promo = validateCode(code);

    if (!promo) {
      return { success: false, message: "Invalid or expired promo code" };
    }

    if (subtotal < promo.minPurchase) {
      return { 
        success: false, 
        message: `Minimum purchase of $${promo.minPurchase} required for this code` 
      };
    }

    // Check category restrictions
    if (promo.applicableCategories && promo.applicableCategories.length > 0) {
      if (!categories || !categories.some(c => promo.applicableCategories!.includes(c))) {
        return {
          success: false,
          message: `This code only applies to: ${promo.applicableCategories.join(", ")}`,
        };
      }
    }

    const discountAmount = calculateDiscount(promo, subtotal);
    
    setAppliedCode(promo);
    setDiscount(discountAmount);

    // Save to storage
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: promo.code, discount: discountAmount }));
    }

    if (promo.type === "freeShipping") {
      return { success: true, message: "Free shipping applied!" };
    }

    return { 
      success: true, 
      message: `Code applied! You save $${discountAmount.toFixed(2)}` 
    };
  }, [validateCode, calculateDiscount]);

  const removeCode = useCallback(() => {
    setAppliedCode(null);
    setDiscount(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const getAvailableCodes = useCallback((): PromoCode[] => {
    return PROMO_CODES.filter(p => 
      p.validUntil > Date.now() && 
      (!p.usageLimit || p.usedCount < p.usageLimit)
    );
  }, []);

  return (
    <PromoCodeContext.Provider
      value={{
        appliedCode,
        discount,
        applyCode,
        removeCode,
        validateCode,
        calculateDiscount,
        getAvailableCodes,
      }}
    >
      {children}
    </PromoCodeContext.Provider>
  );
};
