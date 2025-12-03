"use client";
import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOrders, Order } from "@/context/OrderContext";
import { useRouter } from "next/navigation";
import { SpinnerGap, ShieldWarning, MagnifyingGlass } from "@phosphor-icons/react";
import { OrdersTab } from "../components/OrdersTab";
import AdminLayout from "../components/AdminLayout";

function OrdersPageContent() {
  const { user, loading: authLoading, userRole } = useAuth();
  const { allOrders, loadAllOrders, updateOrderStatus } = useOrders();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = userRole?.isAdmin ?? false;

  useEffect(() => {
    if (isAdmin) {
      loadAllOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const filteredOrders = allOrders.filter(o =>
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.shippingAddress.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.shippingAddress.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    await updateOrderStatus(orderId, newStatus);
  };

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
    <AdminLayout title="Orders" activeTab="orders">
      <div className="mb-6">
        <div className="relative">
          <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search orders..."
            className="w-full pl-12 pr-4 py-3 border border-gray-200 focus:border-black outline-none transition"
          />
        </div>
      </div>
      <OrdersTab orders={filteredOrders} onStatusChange={handleStatusChange} />
    </AdminLayout>
  );
}

function OrdersPageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersPageLoading />}>
      <OrdersPageContent />
    </Suspense>
  );
}
