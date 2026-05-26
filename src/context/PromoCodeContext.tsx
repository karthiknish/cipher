"use client";
import { createContext, use, useState, useEffect, useCallback, ReactNode, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export interface PromoCode {
  code: string;
  type: "percentage" | "fixed" | "freeShipping";
  value: number;
  minPurchase: number;
  maxDiscount?: number;
  validUntil: number;
  usageLimit?: number;
  usedCount: number;
  description: string;
  applicableCategories?: string[];
}

interface PromoCodeContextType {
  appliedCode: PromoCode | null;
  discount: number;
  applyCode: (
    code: string,
    subtotal: number,
    categories?: string[]
  ) => { success: boolean; message: string };
  removeCode: () => void;
  validateCode: (code: string) => PromoCode | null;
  calculateDiscount: (code: PromoCode, subtotal: number) => number;
  getAvailableCodes: () => PromoCode[];
}

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

export const usePromoCode = () => use(PromoCodeContext);

function calculateDiscount(code: PromoCode, subtotal: number): number {
  if (subtotal < code.minPurchase) return 0;
  if (code.validUntil < Date.now()) return 0;
  if (code.usageLimit && code.usedCount >= code.usageLimit) return 0;

  switch (code.type) {
    case "percentage": {
      const raw = (subtotal * code.value) / 100;
      return code.maxDiscount ? Math.min(raw, code.maxDiscount) : raw;
    }
    case "fixed":
      return Math.min(code.value, subtotal);
    case "freeShipping":
      return 0;
    default:
      return 0;
  }
}

export const PromoCodeProvider = ({ children }: { children: ReactNode }) => {
  const convexCodes = useQuery(api.promoCodes.listActive);
  const incrementUsage = useMutation(api.promoCodes.incrementUsage);

  const promoCodes: PromoCode[] =
    convexCodes?.map((p) => ({
      code: p.code,
      type: p.type,
      value: p.value,
      minPurchase: p.minPurchase,
      maxDiscount: p.maxDiscount,
      validUntil: p.validUntil,
      usageLimit: p.usageLimit,
      usedCount: p.usedCount,
      description: p.description,
      applicableCategories: p.applicableCategories,
    })) ?? [];

  const [appliedCode, setAppliedCode] = useState<PromoCode | null>(null);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored || promoCodes.length === 0) return;
    try {
      const { code, discount: savedDiscount } = JSON.parse(stored);
      const validCode = promoCodes.find((p) => p.code === code);
      if (validCode && validCode.validUntil > Date.now()) {
        setAppliedCode(validCode);
        setDiscount(savedDiscount);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [promoCodes]);

  const validateCode = useCallback(
    (code: string): PromoCode | null => {
      const found = promoCodes.find(
        (p) => p.code.toUpperCase() === code.toUpperCase()
      );
      if (!found || found.validUntil < Date.now()) return null;
      if (found.usageLimit && found.usedCount >= found.usageLimit) return null;
      return found;
    },
    [promoCodes]
  );

  const applyCode = useCallback(
    (
      code: string,
      subtotal: number,
      categories: string[] = []
    ): { success: boolean; message: string } => {
      const promo = validateCode(code);
      if (!promo) {
        return { success: false, message: "Invalid or expired promo code" };
      }

      if (promo.minPurchase > 0 && subtotal < promo.minPurchase) {
        return {
          success: false,
          message: `Minimum purchase of $${promo.minPurchase} required`,
        };
      }

      if (
        promo.applicableCategories?.length &&
        !categories.some((c) => promo.applicableCategories!.includes(c))
      ) {
        return {
          success: false,
          message: "Code not valid for items in your cart",
        };
      }

      const discountAmount = calculateDiscount(promo, subtotal);
      setAppliedCode(promo);
      setDiscount(discountAmount);

      if (typeof window !== "undefined") {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ code: promo.code, discount: discountAmount })
        );
      }

      return { success: true, message: promo.description };
    },
    [validateCode]
  );

  const removeCode = useCallback(() => {
    setAppliedCode(null);
    setDiscount(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const getAvailableCodes = useCallback(() => promoCodes, [promoCodes]);

  const contextValue = useMemo(
    () => ({
        appliedCode,
        discount,
        applyCode,
        removeCode,
        validateCode,
        calculateDiscount,
        getAvailableCodes,
      }),
    [appliedCode, applyCode, calculateDiscount, discount, getAvailableCodes, removeCode, validateCode]
  );

  return (
    <PromoCodeContext.Provider value={contextValue}>
      {children}
    </PromoCodeContext.Provider>
  );
};

/** Call after successful checkout to track usage */
export function useRecordPromoUsage() {
  return useMutation(api.promoCodes.incrementUsage);
}
