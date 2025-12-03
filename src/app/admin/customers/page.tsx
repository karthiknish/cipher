"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductContext";
import { useOrders, Order } from "@/context/OrderContext";
import { useAbandonedCart } from "@/context/AbandonedCartContext";
import { useInventory } from "@/context/InventoryContext";
import { useRouter } from "next/navigation";
import { SpinnerGap, ShieldWarning } from "@phosphor-icons/react";
import { Metrics, CustomerData, InventoryForecastItem } from "../components";
import { CustomersTab } from "../components/customers";
import AdminLayout from "../components/AdminLayout";

const STATUS_OPTIONS: Order["status"][] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

function CustomersPageContent() {
  const { user, loading: authLoading, userRole } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { allOrders, loadAllOrders } = useOrders();
  const { abandonedCarts } = useAbandonedCart();
  const { inventory, getProductStock, initializeInventory, loading: inventoryLoading } = useInventory();
  const router = useRouter();

  const isAdmin = userRole?.isAdmin ?? false;

  useEffect(() => {
    if (isAdmin) {
      loadAllOrders();
    }
    // loadAllOrders is stable via useCallback, but we only want to run once when isAdmin becomes true
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

  const metrics: Metrics = useMemo(() => {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    const dateRange = "30d";
    
    const rangeMs = {
      "7d": 7 * dayInMs,
      "30d": 30 * dayInMs,
      "90d": 90 * dayInMs,
      "all": Infinity,
    }[dateRange];
    
    const getOrderTime = (order: Order) => order.createdAt instanceof Date ? order.createdAt.getTime() : new Date(order.createdAt).getTime();
    
    const filteredOrders = allOrders.filter(o => now - getOrderTime(o) < rangeMs);
    const previousOrders = allOrders.filter(o => {
      const age = now - getOrderTime(o);
      return age >= rangeMs && age < rangeMs * 2;
    });

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const previousRevenue = previousOrders.reduce((sum, o) => sum + o.total, 0);
    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : totalRevenue > 0 ? 100 : 0;

    const totalOrders = filteredOrders.length;
    const previousOrderCount = previousOrders.length;
    const ordersChange = previousOrderCount > 0 
      ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 
      : totalOrders > 0 ? 100 : 0;

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const previousAvg = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;
    const avgChange = previousAvg > 0 
      ? ((avgOrderValue - previousAvg) / previousAvg) * 100 
      : avgOrderValue > 0 ? 100 : 0;

    const conversionRate = 3.2 + Math.random() * 0.5;
    const previousConversion = 3.0 + Math.random() * 0.3;
    const conversionChange = ((conversionRate - previousConversion) / previousConversion) * 100;

    const ordersByStatus = STATUS_OPTIONS.reduce((acc, status) => {
      acc[status] = filteredOrders.filter(o => o.status === status).length;
      return acc;
    }, {} as Record<Order["status"], number>);

    const ordersByDay: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = now - (i + 1) * dayInMs;
      const dayEnd = now - i * dayInMs;
      const count = allOrders.filter(o => {
        const t = getOrderTime(o);
        return t >= dayStart && t < dayEnd;
      }).length;
      ordersByDay.push(count);
    }

    const revenueByDay: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = now - (i + 1) * dayInMs;
      const dayEnd = now - i * dayInMs;
      const rev = allOrders
        .filter(o => {
          const t = getOrderTime(o);
          return t >= dayStart && t < dayEnd;
        })
        .reduce((sum, o) => sum + o.total, 0);
      revenueByDay.push(rev);
    }

    const productSales: Record<string, { name: string; image: string; count: number; revenue: number }> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const key = item.productId || item.name;
        if (!productSales[key]) {
          productSales[key] = { name: item.name, image: item.image, count: 0, revenue: 0 };
        }
        productSales[key].count += item.quantity;
        productSales[key].revenue += item.price * item.quantity;
      });
    });
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)
      .map(([id, data]) => ({ id, ...data }));

    const salesByCategory: Record<string, number> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const category = product?.category || "Other";
        salesByCategory[category] = (salesByCategory[category] || 0) + item.price * item.quantity;
      });
    });

    const uniqueCustomers = new Set(filteredOrders.map(o => o.userEmail)).size;
    const previousUniqueCustomers = new Set(previousOrders.map(o => o.userEmail)).size;
    const customersChange = previousUniqueCustomers > 0 
      ? ((uniqueCustomers - previousUniqueCustomers) / previousUniqueCustomers) * 100 
      : uniqueCustomers > 0 ? 100 : 0;

    const recentOrders = [...allOrders]
      .sort((a, b) => getOrderTime(b) - getOrderTime(a))
      .slice(0, 5);

    const customerData: Record<string, CustomerData> = {};
    allOrders.forEach(order => {
      const email = order.userEmail;
      if (!customerData[email]) {
        customerData[email] = {
          email,
          orders: 0,
          totalSpent: 0,
          lastOrder: 0,
          avgOrderValue: 0,
          categories: []
        };
      }
      customerData[email].orders++;
      customerData[email].totalSpent += order.total;
      const orderTime = getOrderTime(order);
      if (orderTime > customerData[email].lastOrder) {
        customerData[email].lastOrder = orderTime;
      }
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product && !customerData[email].categories.includes(product.category)) {
          customerData[email].categories.push(product.category);
        }
      });
    });

    Object.values(customerData).forEach(c => {
      c.avgOrderValue = c.orders > 0 ? c.totalSpent / c.orders : 0;
    });

    const customerSegments = {
      vip: [] as CustomerData[],
      loyal: [] as CustomerData[],
      regular: [] as CustomerData[],
      newCustomers: [] as CustomerData[],
      atRisk: [] as CustomerData[],
      dormant: [] as CustomerData[]
    };

    const thirtyDaysAgo = now - 30 * dayInMs;
    const ninetyDaysAgo = now - 90 * dayInMs;

    Object.values(customerData).forEach(customer => {
      if (customer.totalSpent >= 500 || customer.orders >= 5) {
        customerSegments.vip.push(customer);
      } else if (customer.orders >= 3 && customer.lastOrder > thirtyDaysAgo) {
        customerSegments.loyal.push(customer);
      } else if (customer.orders >= 2) {
        customerSegments.regular.push(customer);
      } else if (customer.orders === 1 && customer.lastOrder > thirtyDaysAgo) {
        customerSegments.newCustomers.push(customer);
      } else if (customer.lastOrder < ninetyDaysAgo) {
        customerSegments.dormant.push(customer);
      } else if (customer.lastOrder < thirtyDaysAgo && customer.lastOrder >= ninetyDaysAgo) {
        customerSegments.atRisk.push(customer);
      }
    });

    const abandonedCartMetrics = {
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

    const inventoryForecast: InventoryForecastItem[] = products.map(product => {
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

    return {
      totalRevenue,
      revenueChange,
      totalOrders,
      ordersChange,
      avgOrderValue,
      avgChange,
      conversionRate,
      conversionChange,
      ordersByStatus,
      ordersByDay,
      revenueByDay,
      topProducts,
      salesByCategory,
      uniqueCustomers,
      customersChange,
      recentOrders,
      customerSegments,
      customerData: Object.values(customerData),
      abandonedCartMetrics,
      inventoryForecast,
    };
  }, [allOrders, products, abandonedCarts, getProductStock]);

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
    <AdminLayout title="Customers" activeTab="customers">
      <CustomersTab metrics={metrics} />
    </AdminLayout>
  );
}

function CustomersPageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<CustomersPageLoading />}>
      <CustomersPageContent />
    </Suspense>
  );
}
