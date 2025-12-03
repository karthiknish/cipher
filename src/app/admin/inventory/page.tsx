"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductContext";
import { useOrders, Order } from "@/context/OrderContext";
import { useInventory } from "@/context/InventoryContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { SpinnerGap, ShieldWarning } from "@phosphor-icons/react";
import { InventoryForecastItem } from "../components";
import { InventoryTab } from "../components/InventoryTab";
import AdminLayout from "../components/AdminLayout";

function InventoryPageContent() {
  const { user, loading: authLoading, userRole } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { allOrders, loadAllOrders } = useOrders();
  const {
    inventory,
    loading: inventoryLoading,
    getProductStock,
    updateStock,
    restockProduct,
    initializeInventory,
  } = useInventory();
  const toast = useToast();
  const router = useRouter();

  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockInput, setStockInput] = useState("");
  const [restockInput, setRestockInput] = useState("");
  const [updatingStock, setUpdatingStock] = useState(false);

  const isAdmin = userRole?.isAdmin ?? false;

  useEffect(() => {
    if (isAdmin) {
      loadAllOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  useEffect(() => {
    if (!inventoryLoading && products.length > 0) {
      products.forEach(product => {
        if (!inventory[product.id]) {
          initializeInventory(product.id, product.name);
        }
      });
    }
  }, [products, inventory, inventoryLoading, initializeInventory]);

  const inventoryForecast: InventoryForecastItem[] = useMemo(() => {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    const getOrderTime = (order: Order) => order.createdAt instanceof Date ? order.createdAt.getTime() : new Date(order.createdAt).getTime();

    return products.map(product => {
      const last30Sales = allOrders
        .filter(o => getOrderTime(o) > now - 30 * dayInMs)
        .reduce((sum, o) => {
          const item = o.items.find(i => i.productId === product.id || i.name === product.name);
          return sum + (item?.quantity || 0);
        }, 0);

      const last7Sales = allOrders
        .filter(o => getOrderTime(o) > now - 7 * dayInMs)
        .reduce((sum, o) => {
          const item = o.items.find(i => i.productId === product.id || i.name === product.name);
          return sum + (item?.quantity || 0);
        }, 0);

      const avgDaily30 = last30Sales / 30;
      const avgDaily7 = last7Sales / 7;
      
      const stockLevel = getProductStock(product.id);
      const daysUntilStockout = avgDaily30 > 0 ? Math.floor(stockLevel / avgDaily30) : 999;
      
      let trend: "up" | "down" | "stable" = "stable";
      if (avgDaily7 > avgDaily30 * 1.2) trend = "up";
      else if (avgDaily7 < avgDaily30 * 0.8) trend = "down";

      return {
        product: {
          id: product.id,
          name: product.name,
          image: product.image,
          category: product.category,
          price: product.price,
        },
        salesLast30: last30Sales,
        salesLast7: last7Sales,
        avgDailySales: avgDaily30,
        currentStock: stockLevel,
        daysUntilStockout,
        reorderSuggested: daysUntilStockout < 14,
        trend
      };
    }).sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
  }, [allOrders, products, getProductStock]);

  const handleUpdateStock = async (productId: string) => {
    const newStock = parseInt(stockInput);
    if (isNaN(newStock) || newStock < 0) {
      toast.error("Please enter a valid stock number");
      return;
    }
    setUpdatingStock(true);
    const success = await updateStock(productId, newStock, "Manual adjustment from admin");
    if (success) {
      toast.success("Stock updated successfully");
      setEditingStock(null);
      setStockInput("");
    } else {
      toast.error("Failed to update stock");
    }
    setUpdatingStock(false);
  };

  const handleRestock = async (productId: string) => {
    const quantity = parseInt(restockInput);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    setUpdatingStock(true);
    const success = await restockProduct(productId, quantity, "Restocked from admin");
    if (success) {
      toast.success(`Added ${quantity} units to stock`);
      setEditingStock(null);
      setRestockInput("");
    } else {
      toast.error("Failed to restock product");
    }
    setUpdatingStock(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || productsLoading) {
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
    <AdminLayout title="Inventory" activeTab="inventory">
      <InventoryTab
        inventoryForecast={inventoryForecast}
        editingStock={editingStock}
        stockInput={stockInput}
        restockInput={restockInput}
        updatingStock={updatingStock}
        setEditingStock={setEditingStock}
        setStockInput={setStockInput}
        setRestockInput={setRestockInput}
        onUpdateStock={handleUpdateStock}
        onRestock={handleRestock}
      />
    </AdminLayout>
  );
}

function InventoryPageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<InventoryPageLoading />}>
      <InventoryPageContent />
    </Suspense>
  );
}
