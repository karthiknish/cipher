"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProducts, Product } from "@/context/ProductContext";
import { useOrders, Order } from "@/context/OrderContext";
import { useToast } from "@/context/ToastContext";
import { useAbandonedCart } from "@/context/AbandonedCartContext";
import { useInventory } from "@/context/InventoryContext";
import { useDynamicPricing, PricingRule } from "@/context/DynamicPricingContext";
import { useInfluencer, Influencer } from "@/context/InfluencerContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Plus, 
  Package, 
  MagnifyingGlass,
  SpinnerGap,
  ShieldWarning,
  SquaresFour,
  ShoppingBag,
  Users,
  ShoppingCart,
  Crown,
  Tag,
  CurrencyDollar,
  Percent,
  UserCirclePlus,
  ChartLineUp,
  Star,
  Gift,
} from "@phosphor-icons/react";
import {
  Tab,
  DateRange,
  CATEGORIES,
  Metrics,
  CustomerData,
  InventoryForecastItem,
} from "./components";
import { DashboardTab } from "./components/DashboardTab";
import { ProductsTab } from "./components/ProductsTab";
import { OrdersTab } from "./components/OrdersTab";
import { CustomersTab } from "./components/CustomersTab";
import { AbandonedTab } from "./components/AbandonedTab";
import { InventoryTab } from "./components/InventoryTab";
import { PricingTab } from "./components/PricingTab";
import { InfluencersTab } from "./components/InfluencersTab";
import { AnalyticsTab } from "./components/AnalyticsTab";
import { ReviewsTab } from "./components/ReviewsTab";
import { LoyaltyTab } from "./components/LoyaltyTab";

const STATUS_OPTIONS: Order["status"][] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

function AdminPageContent() {
  const { user, loading: authLoading, userRole } = useAuth();
  const { products, loading: productsLoading, deleteProduct } = useProducts();
  const { allOrders, loadAllOrders, updateOrderStatus } = useOrders();
  const { 
    abandonedCarts, 
    loading: abandonedCartsLoading, 
    sendReminder, 
    sendBulkReminders, 
    deleteAbandonedCart,
    refreshCarts 
  } = useAbandonedCart();
  const {
    inventory,
    loading: inventoryLoading,
    getProductStock,
    updateStock,
    restockProduct,
    initializeInventory,
  } = useInventory();
  const {
    pricingRules,
    createRule,
    deleteRule,
    toggleRule,
    getActiveFlashSales,
  } = useDynamicPricing();
  const {
    influencers,
    applications,
    approveApplication,
    rejectApplication,
    updateInfluencerTier,
    updateCommissionRate,
  } = useInfluencer();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for reminder sending
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [sendingBulk, setSendingBulk] = useState(false);
  
  // State for inventory editing
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [stockInput, setStockInput] = useState("");
  const [restockInput, setRestockInput] = useState("");
  const [updatingStock, setUpdatingStock] = useState(false);
  
  // Initialize activeTab from URL query param or default to "dashboard"
  const tabFromUrl = searchParams.get("tab") as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl || "dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  // Check if user is admin (from AuthContext which checks Firestore role)
  const isAdmin = userRole?.isAdmin ?? false;

  // Load all orders when admin
  useEffect(() => {
    if (isAdmin) {
      loadAllOrders();
    }
  }, [isAdmin, loadAllOrders]);
  
  // Handle sending a single reminder
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
  
  // Handle bulk reminder sending
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

  // Calculate metrics
  const metrics: Metrics = useMemo(() => {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // Filter orders by date range
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

    // Total Revenue
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const previousRevenue = previousOrders.reduce((sum, o) => sum + o.total, 0);
    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : totalRevenue > 0 ? 100 : 0;

    // Total Orders
    const totalOrders = filteredOrders.length;
    const previousOrderCount = previousOrders.length;
    const ordersChange = previousOrderCount > 0 
      ? ((totalOrders - previousOrderCount) / previousOrderCount) * 100 
      : totalOrders > 0 ? 100 : 0;

    // Average Order Value
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const previousAvg = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;
    const avgChange = previousAvg > 0 
      ? ((avgOrderValue - previousAvg) / previousAvg) * 100 
      : avgOrderValue > 0 ? 100 : 0;

    // Conversion Rate (simulated)
    const conversionRate = 3.2 + Math.random() * 0.5;
    const previousConversion = 3.0 + Math.random() * 0.3;
    const conversionChange = ((conversionRate - previousConversion) / previousConversion) * 100;

    // Orders by status
    const ordersByStatus = STATUS_OPTIONS.reduce((acc, status) => {
      acc[status] = filteredOrders.filter(o => o.status === status).length;
      return acc;
    }, {} as Record<Order["status"], number>);

    // Orders by day (last 7 days)
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

    // Revenue by day (last 7 days)
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

    // Top selling products
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

    // Sales by category
    const salesByCategory: Record<string, number> = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const category = product?.category || "Other";
        salesByCategory[category] = (salesByCategory[category] || 0) + item.price * item.quantity;
      });
    });

    // Unique customers
    const uniqueCustomers = new Set(filteredOrders.map(o => o.userEmail)).size;
    const previousUniqueCustomers = new Set(previousOrders.map(o => o.userEmail)).size;
    const customersChange = previousUniqueCustomers > 0 
      ? ((uniqueCustomers - previousUniqueCustomers) / previousUniqueCustomers) * 100 
      : uniqueCustomers > 0 ? 100 : 0;

    // Recent activity
    const recentOrders = [...allOrders]
      .sort((a, b) => getOrderTime(b) - getOrderTime(a))
      .slice(0, 5);

    // Customer Segmentation Data
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

    // Calculate average order value for each customer
    Object.values(customerData).forEach(c => {
      c.avgOrderValue = c.orders > 0 ? c.totalSpent / c.orders : 0;
    });

    // Segment customers
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

    // Abandoned Cart Metrics
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

    // Inventory Forecasting
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
  }, [allOrders, products, dateRange, abandonedCarts, getProductStock]);
  
  // Initialize inventory for products that don't have it
  useEffect(() => {
    if (!inventoryLoading && products.length > 0) {
      products.forEach(product => {
        if (!inventory[product.id]) {
          initializeInventory(product.id, product.name);
        }
      });
    }
  }, [products, inventory, inventoryLoading, initializeInventory]);
  
  // Handle stock update
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
  
  // Handle restock
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

  // Redirect non-admins
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Filter products by search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter orders by search
  const filteredOrders = allOrders.filter(o =>
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.shippingAddress.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.shippingAddress.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await deleteProduct(productId);
    toast.success("Product deleted successfully");
  };

  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    await updateOrderStatus(orderId, newStatus);
    toast.success(`Order status updated to ${newStatus}`);
  };

  const handleCreatePricingRule = async (rule: Omit<PricingRule, "id" | "createdAt" | "updatedAt">) => {
    await createRule(rule);
  };

  // Loading state
  if (authLoading || productsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Not authorized
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-red-100 flex items-center justify-center mb-6">
          <ShieldWarning className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-light tracking-tight mb-4">ACCESS DENIED</h1>
        <p className="text-gray-500 mb-6 max-w-md">
          You don&apos;t have permission to access the admin panel. 
          Please contact an administrator if you believe this is an error.
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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <SquaresFour className="w-6 h-6" />
                <h1 className="text-3xl md:text-4xl font-light tracking-tight">ADMIN PANEL</h1>
              </div>
              <p className="text-white/60">Manage products and orders</p>
            </div>
            <Link
              href="/admin/design-voting"
              className="hidden md:flex items-center gap-2 border border-white/30 px-4 py-2 text-xs tracking-wider hover:bg-white/10 transition"
            >
              <Crown className="w-4 h-4" />
              DESIGN VOTING
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-50 p-6">
            <Package className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-2xl font-medium">{products.length}</p>
            <p className="text-xs text-gray-500 tracking-wider">PRODUCTS</p>
          </div>
          <div className="bg-gray-50 p-6">
            <Tag className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-2xl font-medium">{CATEGORIES.length}</p>
            <p className="text-xs text-gray-500 tracking-wider">CATEGORIES</p>
          </div>
          <div className="bg-gray-50 p-6">
            <ShoppingBag className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-2xl font-medium">{allOrders.length}</p>
            <p className="text-xs text-gray-500 tracking-wider">TOTAL ORDERS</p>
          </div>
          <div className="bg-gray-50 p-6">
            <CurrencyDollar className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-2xl font-medium">
              ${allOrders.reduce((sum, o) => sum + o.total, 0).toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 tracking-wider">TOTAL REVENUE</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 md:gap-8 mb-8 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`pb-4 text-sm tracking-wider font-medium transition whitespace-nowrap ${
              activeTab === "dashboard" 
                ? "border-b-2 border-black text-black" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            DASHBOARD
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`pb-4 text-sm tracking-wider font-medium transition whitespace-nowrap ${
              activeTab === "products" 
                ? "border-b-2 border-black text-black" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            PRODUCTS
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-4 text-sm tracking-wider font-medium transition whitespace-nowrap ${
              activeTab === "orders" 
                ? "border-b-2 border-black text-black" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            ORDERS
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`pb-4 text-sm tracking-wider font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "customers" 
                ? "border-b-2 border-black text-black" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Users className="w-4 h-4" />
            CUSTOMERS
          </button>
          <button
            onClick={() => setActiveTab("abandoned")}
            className={`pb-4 text-sm tracking-wider font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "abandoned" 
                ? "border-b-2 border-black text-black" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            ABANDONED
            {abandonedCarts.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {abandonedCarts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`pb-4 text-sm tracking-wider font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "inventory" 
                ? "border-b-2 border-black text-black" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Package className="w-4 h-4" />
            INVENTORY
            {metrics.inventoryForecast.filter(i => i.reorderSuggested).length > 0 && (
              <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {metrics.inventoryForecast.filter(i => i.reorderSuggested).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("pricing")}
            className={`pb-4 text-sm tracking-wider font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "pricing" 
                ? "border-b-2 border-black text-black" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Percent className="w-4 h-4" />
            PRICING
            {getActiveFlashSales().length > 0 && (
              <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {getActiveFlashSales().length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("influencers")}
            className={`pb-4 text-sm tracking-wider font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "influencers" 
                ? "border-b-2 border-black text-black" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <UserCirclePlus className="w-4 h-4" />
            INFLUENCERS
            {applications.filter(a => a.status === "pending").length > 0 && (
              <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {applications.filter(a => a.status === "pending").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-4 text-sm tracking-wider font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "analytics" 
                ? "border-b-2 border-black text-black" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <ChartLineUp className="w-4 h-4" />
            ANALYTICS
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`pb-4 text-sm tracking-wider font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "reviews" 
                ? "border-b-2 border-black text-black" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Star className="w-4 h-4" />
            REVIEWS
          </button>
          <button
            onClick={() => setActiveTab("loyalty")}
            className={`pb-4 text-sm tracking-wider font-medium transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === "loyalty" 
                ? "border-b-2 border-black text-black" 
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Gift className="w-4 h-4" />
            LOYALTY
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <DashboardTab
            metrics={metrics}
            dateRange={dateRange}
            setDateRange={setDateRange}
          />
        )}

        {/* Search and Add (for products/orders) */}
        {(activeTab === "products" || activeTab === "orders") && (
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === "products" ? "Search products..." : "Search orders..."}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 focus:border-black outline-none transition"
              />
            </div>
            {activeTab === "products" && (
              <Link
                href="/admin/products/new"
                className="bg-black text-white px-6 py-3 text-sm tracking-wider font-medium flex items-center justify-center gap-2 hover:bg-gray-900 transition"
              >
                <Plus className="w-4 h-4" /> ADD PRODUCT
              </Link>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <ProductsTab
            products={filteredProducts}
            onDelete={handleDelete}
          />
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <OrdersTab
            orders={filteredOrders}
            onStatusChange={handleStatusChange}
          />
        )}

        {/* Customers Tab */}
        {activeTab === "customers" && (
          <CustomersTab metrics={metrics} />
        )}

        {/* Abandoned Tab */}
        {activeTab === "abandoned" && (
          <AbandonedTab
            abandonedCarts={abandonedCarts}
            abandonedCartsLoading={abandonedCartsLoading}
            abandonedCartMetrics={metrics.abandonedCartMetrics}
            sendingReminder={sendingReminder}
            sendingBulk={sendingBulk}
            onSendReminder={handleSendReminder}
            onBulkReminders={handleBulkReminders}
            onDeleteCart={deleteAbandonedCart}
            onRefreshCarts={refreshCarts}
          />
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <InventoryTab
            inventoryForecast={metrics.inventoryForecast}
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
        )}

        {/* Pricing Tab */}
        {activeTab === "pricing" && (
          <PricingTab
            products={products}
            pricingRules={pricingRules}
            activeFlashSalesCount={getActiveFlashSales().length}
            onCreateRule={handleCreatePricingRule}
            onToggleRule={toggleRule}
            onDeleteRule={deleteRule}
          />
        )}

        {/* Influencers Tab */}
        {activeTab === "influencers" && (
          <InfluencersTab
            influencers={influencers}
            applications={applications}
            onApproveApplication={approveApplication}
            onRejectApplication={rejectApplication}
            onUpdateTier={updateInfluencerTier}
            onUpdateCommissionRate={updateCommissionRate}
          />
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <AnalyticsTab />
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <ReviewsTab />
        )}

        {/* Loyalty Tab */}
        {activeTab === "loyalty" && (
          <LoyaltyTab />
        )}
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function AdminPageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

// Main export with Suspense wrapper
export default function AdminPage() {
  return (
    <Suspense fallback={<AdminPageLoading />}>
      <AdminPageContent />
    </Suspense>
  );
}
