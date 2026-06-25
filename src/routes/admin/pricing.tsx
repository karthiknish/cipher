import { createFileRoute } from "@tanstack/react-router";
import { useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductContext";
import { useDynamicPricing, PricingRule } from "@/context/DynamicPricingContext";
import { useRouter } from "@/lib/navigation";
import { SpinnerGap, ShieldWarning } from "@phosphor-icons/react";
import { PricingTab } from "@/components/admin-layout/PricingTab";
import AdminLayout from "@/components/admin-layout/AdminLayout";

function PricingPageContent() {
  const { user, loading: authLoading, userRole } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const {
    pricingRules,
    createRule,
    deleteRule,
    toggleRule,
    getActiveFlashSales,
  } = useDynamicPricing();
  const { push } = useRouter();

  const isAdmin = userRole?.isAdmin ?? false;

  useEffect(() => {
    if (!authLoading && !user) {
      push("/login");
    }
  }, [user, authLoading, push]);

  const handleCreatePricingRule = async (rule: Omit<PricingRule, "id" | "createdAt" | "updatedAt">) => {
    await createRule(rule);
  };

  if (authLoading || productsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpinnerGap className="size-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="size-20 bg-red-100 flex items-center justify-center mb-6">
          <ShieldWarning className="size-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-light tracking-tight mb-4">ACCESS DENIED</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          You don&apos;t have permission to access the admin panel.
        </p>
        <button type="button" onClick={() => push("/")}
          className="bg-gray-950 text-white px-8 py-4 text-sm tracking-wider hover:bg-gray-900 transition"
        >
          RETURN HOME
        </button>
      </div>
    );
  }

  return (
    <AdminLayout title="Pricing" activeTab="pricing">
      <PricingTab
        products={products}
        pricingRules={pricingRules}
        activeFlashSalesCount={getActiveFlashSales().length}
        onCreateRule={handleCreatePricingRule}
        onToggleRule={toggleRule}
        onDeleteRule={deleteRule}
      />
    </AdminLayout>
  );
}

function PricingPageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <SpinnerGap className="size-8 animate-spin text-gray-400" />
    </div>
  );
}

function PricingPage() {
  return (
    <Suspense fallback={<PricingPageLoading />}>
      <PricingPageContent />
    </Suspense>
  );
}

export const Route = createFileRoute("/admin/pricing")({ component: PricingPage });
