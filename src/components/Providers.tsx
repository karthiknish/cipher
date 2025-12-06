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
import { BundleProvider } from "@/context/BundleContext";
import { RecommendationProvider } from "@/context/RecommendationContext";
import { AbandonedCartProvider } from "@/context/AbandonedCartContext";
import { DesignVotingProvider } from "@/context/DesignVotingContext";
import { LiveActivityProvider } from "@/context/LiveActivityContext";
import { DynamicPricingProvider } from "@/context/DynamicPricingContext";
import { MoodStyleProvider } from "@/context/MoodStyleContext";
import { InfluencerProvider } from "@/context/InfluencerContext";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import { LoyaltyProvider } from "@/context/LoyaltyContext";
import { StyleChallengeProvider } from "@/context/StyleChallengeContext";
import { AchievementProvider } from "@/context/AchievementContext";
import { BlogProvider } from "@/context/BlogContext";
import { SpinWheelProvider } from "@/context/SpinWheelContext";
import { CustomerBehaviorProvider } from "@/context/CustomerBehaviorContext";
import { LocalSceneProvider } from "@/context/LocalSceneContext";
import { NewsletterProvider } from "@/context/NewsletterContext";
import { ReactNode, Suspense } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <Suspense fallback={null}>
          <AnalyticsProvider>
            <ProductProvider>
              <CartProvider>
                <AbandonedCartProvider>
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
                                      <BundleProvider>
                                        <RecommendationProvider>
                                          <DesignVotingProvider>
                                            <LiveActivityProvider>
                                              <DynamicPricingProvider>
                                                <MoodStyleProvider>
                                                  <InfluencerProvider>
                                                    <LoyaltyProvider>
                                                      <StyleChallengeProvider>
                                                        <AchievementProvider>
                                                          <BlogProvider>
                                                            <SpinWheelProvider>
                                                              <CustomerBehaviorProvider>
                                                                <LocalSceneProvider>
                                                                  <NewsletterProvider>
                                                                    {children}
                                                                  </NewsletterProvider>
                                                                </LocalSceneProvider>
                                                              </CustomerBehaviorProvider>
                                                            </SpinWheelProvider>
                                                          </BlogProvider>
                                                        </AchievementProvider>
                                                      </StyleChallengeProvider>
                                                    </LoyaltyProvider>
                                                  </InfluencerProvider>
                                                </MoodStyleProvider>
                                              </DynamicPricingProvider>
                                            </LiveActivityProvider>
                                          </DesignVotingProvider>
                                        </RecommendationProvider>
                                      </BundleProvider>
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
                </AbandonedCartProvider>
              </CartProvider>
            </ProductProvider>
          </AnalyticsProvider>
        </Suspense>
      </ToastProvider>
    </AuthProvider>
  );
}
