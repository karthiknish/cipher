"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAbandonedCart } from "@/context/AbandonedCartContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { SpinnerGap, ShieldWarning } from "@phosphor-icons/react";
import { AbandonedTab } from "../components/AbandonedTab";
import AdminLayout from "../components/AdminLayout";

function AbandonedPageContent() {
  const { user, loading: authLoading, userRole } = useAuth();
  const { 
    abandonedCarts, 
    loading: abandonedCartsLoading, 
    sendReminder, 
    sendBulkReminders, 
    deleteAbandonedCart,
    refreshCarts 
  } = useAbandonedCart();
  const toast = useToast();
  const router = useRouter();

  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [sendingBulk, setSendingBulk] = useState(false);

  const isAdmin = userRole?.isAdmin ?? false;

  const abandonedCartMetrics = useMemo(() => {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    return {
      total: abandonedCarts.length,
      potentialRevenue: abandonedCarts.reduce((sum, cart) => sum + cart.total, 0),
      remindersSent: abandonedCarts.filter(cart => cart.remindersSent > 0).length,
      recovered: abandonedCarts.filter(cart => cart.recovered).length,
      hotLeads: abandonedCarts.filter(cart => {
        const abandonedTime = cart.abandonedAt instanceof Date 
          ? cart.abandonedAt.getTime() 
          : new Date(cart.abandonedAt).getTime();
        return (now - abandonedTime) < dayInMs;
      }).length,
      noReminders: abandonedCarts.filter(cart => cart.email && cart.remindersSent === 0).length,
    };
  }, [abandonedCarts]);

  const handleSendReminder = async (cartId: string) => {
    setSendingReminder(cartId);
    try {
      const result = await sendReminder(cartId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to send reminder");
    } finally {
      setSendingReminder(null);
    }
  };

  const handleBulkReminders = async () => {
    setSendingBulk(true);
    try {
      const result = await sendBulkReminders();
      toast.success(`Sent ${result.sent} reminders${result.failed > 0 ? `, ${result.failed} failed` : ""}`);
    } catch {
      toast.error("Failed to send bulk reminders");
    } finally {
      setSendingBulk(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-red-100 flex items-center justify-center mb-6">
          <ShieldWarning className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-light tracking-tight mb-4">ACCESS DENIED</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          You don&apos;t have permission to access the admin panel.
        </p>
        <button 
          onClick={() => router.push("/")}
          className="bg-black text-white px-8 py-4 text-sm tracking-wider hover:bg-gray-900 transition"
        >
          RETURN HOME
        </button>
      </div>
    );
  }

  return (
    <AdminLayout title="Abandoned Carts" activeTab="abandoned">
      <AbandonedTab
        abandonedCarts={abandonedCarts}
        abandonedCartsLoading={abandonedCartsLoading}
        abandonedCartMetrics={abandonedCartMetrics}
        sendingReminder={sendingReminder}
        sendingBulk={sendingBulk}
        onSendReminder={handleSendReminder}
        onBulkReminders={handleBulkReminders}
        onDeleteCart={deleteAbandonedCart}
        onRefreshCarts={refreshCarts}
      />
    </AdminLayout>
  );
}

function AbandonedPageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function AbandonedPage() {
  return (
    <Suspense fallback={<AbandonedPageLoading />}>
      <AbandonedPageContent />
    </Suspense>
  );
}
