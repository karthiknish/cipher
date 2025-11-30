"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ProductProvider } from "@/context/ProductContext";
import { OrderProvider } from "@/context/OrderContext";
import { ToastProvider } from "@/context/ToastContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { ReviewProvider } from "@/context/ReviewContext";
import { SizeRecommendationProvider } from "@/context/SizeRecommendationContext";
import { RecentlyViewedProvider } from "@/context/RecentlyViewedContext";
import { CompareProvider } from "@/context/CompareContext";
import { InventoryProvider } from "@/context/InventoryContext";
import { StockNotificationProvider } from "@/context/StockNotificationContext";
import { UserProfileProvider } from "@/context/UserProfileContext";
import { PromoCodeProvider } from "@/context/PromoCodeContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <ProductProvider>
          <CartProvider>
            <OrderProvider>
              <WishlistProvider>
                <ReviewProvider>
                  <SizeRecommendationProvider>
                    <RecentlyViewedProvider>
                      <CompareProvider>
                        <InventoryProvider>
                          <StockNotificationProvider>
                            <UserProfileProvider>
                              <PromoCodeProvider>
                                {children}
                              </PromoCodeProvider>
                            </UserProfileProvider>
                          </StockNotificationProvider>
                        </InventoryProvider>
                      </CompareProvider>
                    </RecentlyViewedProvider>
                  </SizeRecommendationProvider>
                </ReviewProvider>
              </WishlistProvider>
            </OrderProvider>
          </CartProvider>
        </ProductProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
