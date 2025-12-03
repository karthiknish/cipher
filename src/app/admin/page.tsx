"use client";
import { useEffect, useMemo, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/context/ProductContext";
import { useOrders, Order } from "@/context/OrderContext";
import { useAbandonedCart } from "@/context/AbandonedCartContext";
import { useInventory } from "@/context/InventoryContext";
import { useDynamicPricing } from "@/context/DynamicPricingContext";
import { useInfluencer } from "@/context/InfluencerContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  SpinnerGap,
  ShieldWarning,
  SquaresFour,
  Package, 
  ShoppingBag,
  Users,
  ShoppingCart,
  Crown,
  Percent,
  UserCirclePlus,
  ChartLineUp,
  Star,
  Gift,
  CurrencyDollar,
  Tag,
  ArrowRight,
  TrendUp,
  Warning,
} from "@phosphor-icons/react";
import { CATEGORIES } from "./components";

function AdminPageContent() {
  const { user, loading: authLoading, userRole } = useAuth();
  const { products, loading: productsLoading } = useProducts();
  const { allOrders, loadAllOrders } = useOrders();
  const { abandonedCarts } = useAbandonedCart();
  const { inventory, getProductStock, initializeInventory, loading: inventoryLoading } = useInventory();
  const { getActiveFlashSales } = useDynamicPricing();
  const { applications } = useInfluencer();
  const router = useRouter();

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

  // Calculate quick stats
  const stats = useMemo(() => {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    const getOrderTime = (order: Order) => order.createdAt instanceof Date ? order.createdAt.getTime() : new Date(order.createdAt).getTime();

    const totalRevenue = allOrders.reduce((sum, o) => sum + o.total, 0);
    const pendingOrders = allOrders.filter(o => o.status === "pending").length;
    
    const lowStockCount = products.filter(product => {
      const stockLevel = getProductStock(product.id);
      const last30Sales = allOrders
        .filter(o => getOrderTime(o) > now - 30 * dayInMs)
        .reduce((sum, o) => {
          const item = o.items.find(i => i.productId === product.id || i.name === product.name);
          return sum + (item?.quantity || 0);
        }, 0);
      const avgDaily = last30Sales / 30;
      const daysUntilStockout = avgDaily > 0 ? Math.floor(stockLevel / avgDaily) : 999;
      return daysUntilStockout < 14;
    }).length;

    return {
      totalRevenue,
      pendingOrders,
      lowStockCount,
    };
  }, [allOrders, products, getProductStock]);

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

  const navItems = [
    { 
      key: "dashboard", 
      label: "Dashboard", 
      description: "Overview of sales, orders, and performance",
      href: "/admin/dashboard", 
      icon: SquaresFour,
      color: "bg-blue-50 text-blue-600",
    },
    { 
      key: "products", 
      label: "Products", 
      description: "Manage your product catalog",
      href: "/admin/products", 
      icon: Package,
      color: "bg-purple-50 text-purple-600",
      badge: products.length,
    },
    { 
      key: "orders", 
      label: "Orders", 
      description: "View and manage customer orders",
      href: "/admin/orders", 
      icon: ShoppingBag,
      color: "bg-green-50 text-green-600",
      badge: stats.pendingOrders > 0 ? stats.pendingOrders : undefined,
      badgeColor: "bg-orange-500",
    },
    { 
      key: "customers", 
      label: "Customers", 
      description: "Customer analytics and segmentation",
      href: "/admin/customers", 
      icon: Users,
      color: "bg-sky-50 text-sky-600",
    },
    { 
      key: "abandoned", 
      label: "Abandoned Carts", 
      description: "Recover lost sales from abandoned carts",
      href: "/admin/abandoned", 
      icon: ShoppingCart,
      color: "bg-red-50 text-red-600",
      badge: abandonedCarts.length > 0 ? abandonedCarts.length : undefined,
      badgeColor: "bg-red-500",
    },
    { 
      key: "inventory", 
      label: "Inventory", 
      description: "Stock levels and forecasting",
      href: "/admin/inventory", 
      icon: Package,
      color: "bg-amber-50 text-amber-600",
      badge: stats.lowStockCount > 0 ? stats.lowStockCount : undefined,
      badgeColor: "bg-amber-500",
    },
    { 
      key: "pricing", 
      label: "Pricing", 
      description: "Dynamic pricing and flash sales",
      href: "/admin/pricing", 
      icon: Percent,
      color: "bg-emerald-50 text-emerald-600",
      badge: getActiveFlashSales().length > 0 ? getActiveFlashSales().length : undefined,
      badgeColor: "bg-emerald-500",
    },
    { 
      key: "influencers", 
      label: "Influencers", 
      description: "Manage influencer partnerships",
      href: "/admin/influencers", 
      icon: UserCirclePlus,
      color: "bg-pink-50 text-pink-600",
      badge: applications.filter(a => a.status === "pending").length > 0 ? applications.filter(a => a.status === "pending").length : undefined,
      badgeColor: "bg-pink-500",
    },
    { 
      key: "analytics", 
      label: "Analytics", 
      description: "Deep dive into your data",
      href: "/admin/analytics", 
      icon: ChartLineUp,
      color: "bg-indigo-50 text-indigo-600",
    },
    { 
      key: "reviews", 
      label: "Reviews", 
      description: "Moderate customer reviews",
      href: "/admin/reviews", 
      icon: Star,
      color: "bg-yellow-50 text-yellow-600",
    },
    { 
      key: "loyalty", 
      label: "Loyalty Program", 
      description: "Manage rewards and points",
      href: "/admin/loyalty", 
      icon: Gift,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <SquaresFour className="w-8 h-8" />
                <h1 className="text-3xl md:text-4xl font-light tracking-tight">ADMIN PANEL</h1>
              </div>
              <p className="text-white/60">Manage your store</p>
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
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <Package className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-2xl font-medium">{products.length}</p>
            <p className="text-xs text-gray-500 tracking-wider">PRODUCTS</p>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <Tag className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-2xl font-medium">{CATEGORIES.length}</p>
            <p className="text-xs text-gray-500 tracking-wider">CATEGORIES</p>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <ShoppingBag className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-2xl font-medium">{allOrders.length}</p>
            <p className="text-xs text-gray-500 tracking-wider">TOTAL ORDERS</p>
          </div>
          <div className="bg-white border border-gray-200 p-6 rounded-lg">
            <CurrencyDollar className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-2xl font-medium">
              ${stats.totalRevenue.toFixed(0)}
            </p>
            <p className="text-xs text-gray-500 tracking-wider">TOTAL REVENUE</p>
          </div>
        </div>

        {/* Alerts */}
        {(stats.pendingOrders > 0 || stats.lowStockCount > 0 || abandonedCarts.length > 0) && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {stats.pendingOrders > 0 && (
              <Link 
                href="/admin/orders"
                className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-center gap-4 hover:border-orange-400 transition"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-orange-900">{stats.pendingOrders} Pending Orders</p>
                  <p className="text-xs text-orange-600">Require attention</p>
                </div>
              </Link>
            )}
            {stats.lowStockCount > 0 && (
              <Link 
                href="/admin/inventory"
                className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center gap-4 hover:border-amber-400 transition"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Warning className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-900">{stats.lowStockCount} Low Stock Items</p>
                  <p className="text-xs text-amber-600">Reorder suggested</p>
                </div>
              </Link>
            )}
            {abandonedCarts.length > 0 && (
              <Link 
                href="/admin/abandoned"
                className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-4 hover:border-red-400 transition"
              >
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-900">{abandonedCarts.length} Abandoned Carts</p>
                  <p className="text-xs text-red-600">Potential revenue to recover</p>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Navigation Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className="bg-white border border-gray-200 p-6 rounded-lg hover:border-black hover:shadow-lg transition group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {item.badge && (
                    <span className={`${item.badgeColor || "bg-gray-500"} text-white text-xs px-2 py-1 rounded-full`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-medium text-lg mb-1 group-hover:underline">{item.label}</h3>
                <p className="text-sm text-gray-500 mb-4">{item.description}</p>
                <div className="flex items-center gap-1 text-sm text-gray-400 group-hover:text-black transition">
                  <span>View</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AdminPageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <SpinnerGap className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminPageLoading />}>
      <AdminPageContent />
    </Suspense>
  );
}
