"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useProducts, Product } from "@/context/ProductContext";
import { useOrders, Order } from "@/context/OrderContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Save, 
  Package, 
  DollarSign, 
  Tag, 
  Search,
  Loader2,
  ShieldAlert,
  LayoutDashboard,
  ShoppingBag,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  Mail,
  AlertTriangle,
  ShoppingCart,
  RefreshCw,
  Target,
  Zap,
  Crown,
  Star,
  Activity,
  Send,
  Archive,
  TrendingDown as TrendDown
} from "lucide-react";

const CATEGORIES = ["Hoodies", "Tees", "Pants", "Outerwear", "Accessories"];

// Admin email whitelist
const ADMIN_EMAILS = ["admin@cipher.com", "karthik@cipher.com"];

const STATUS_OPTIONS: Order["status"][] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const STATUS_COLORS: Record<Order["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

// Mini Bar Chart Component
function MiniBarChart({ data, maxValue }: { data: number[]; maxValue: number }) {
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((value, i) => (
        <div
          key={i}
          className="flex-1 bg-black/80 rounded-sm transition-all hover:bg-black"
          style={{ height: `${(value / maxValue) * 100}%`, minHeight: value > 0 ? "4px" : "0" }}
        />
      ))}
    </div>
  );
}

// Donut Chart Component
function DonutChart({ data, colors }: { data: { label: string; value: number; color: string }[]; colors: string[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  if (total === 0) {
    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="20" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-400 text-xs">No data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {data.map((item, i) => {
          const angle = (item.value / total) * 360;
          const startAngle = currentAngle;
          currentAngle += angle;
          
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = ((startAngle + angle) * Math.PI) / 180;
          
          const x1 = 50 + 40 * Math.cos(startRad);
          const y1 = 50 + 40 * Math.sin(startRad);
          const x2 = 50 + 40 * Math.cos(endRad);
          const y2 = 50 + 40 * Math.sin(endRad);
          
          const largeArc = angle > 180 ? 1 : 0;
          
          return (
            <path
              key={i}
              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={item.color}
              className="transition-opacity hover:opacity-80"
            />
          );
        })}
        <circle cx="50" cy="50" r="25" fill="white" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-medium">{total}</span>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { products, loading: productsLoading, addProduct, updateProduct, deleteProduct } = useProducts();
  const { allOrders, loadAllOrders, updateOrderStatus } = useOrders();
  const toast = useToast();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "orders" | "customers" | "abandoned" | "inventory">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  
  // Form state
  const [formData, setFormData] = useState<Omit<Product, "id">>({
    name: "",
    price: 0,
    category: "Tees",
    description: "",
    image: "",
    sizes: ["S", "M", "L", "XL"],
    inStock: true,
  });

  // Check if user is admin
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");

  // Load all orders when admin
  useEffect(() => {
    if (isAdmin) {
      loadAllOrders();
    }
  }, [isAdmin, loadAllOrders]);

  // Calculate metrics
  const metrics = useMemo(() => {
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
    const customerData: Record<string, { 
      email: string; 
      orders: number; 
      totalSpent: number; 
      lastOrder: number;
      avgOrderValue: number;
      categories: string[];
    }> = {};
    
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
      vip: [] as typeof customerData[string][],
      loyal: [] as typeof customerData[string][],
      regular: [] as typeof customerData[string][],
      newCustomers: [] as typeof customerData[string][],
      atRisk: [] as typeof customerData[string][],
      dormant: [] as typeof customerData[string][]
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

    // Abandoned Carts (simulated data based on orders)
    const abandonedCarts = allOrders
      .filter(o => o.status === "pending" && getOrderTime(o) < now - dayInMs)
      .slice(0, 10)
      .map(order => ({
        id: `cart_${order.id}`,
        email: order.userEmail,
        items: order.items,
        total: order.total,
        abandonedAt: getOrderTime(order),
        remindersSent: Math.floor(Math.random() * 3),
        recovered: false
      }));

    // Add some simulated abandoned carts for demo
    const simulatedAbandonedCarts = [
      {
        id: "cart_sim_1",
        email: "john.doe@email.com",
        items: [{ name: "Essential Hoodie", price: 89, quantity: 1, image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Hoodie", size: "M", productId: "1" }],
        total: 89,
        abandonedAt: now - 2 * dayInMs,
        remindersSent: 1,
        recovered: false
      },
      {
        id: "cart_sim_2",
        email: "jane.smith@email.com",
        items: [
          { name: "Urban Joggers", price: 75, quantity: 1, image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Joggers", size: "S", productId: "2" },
          { name: "Classic Tee", price: 45, quantity: 2, image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Tee", size: "M", productId: "3" }
        ],
        total: 165,
        abandonedAt: now - 4 * 60 * 60 * 1000, // 4 hours ago
        remindersSent: 0,
        recovered: false
      },
      {
        id: "cart_sim_3",
        email: "mike.wilson@email.com",
        items: [{ name: "Street Jacket", price: 150, quantity: 1, image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Jacket", size: "L", productId: "4" }],
        total: 150,
        abandonedAt: now - 5 * dayInMs,
        remindersSent: 2,
        recovered: false
      }
    ];

    const allAbandonedCarts = [...simulatedAbandonedCarts, ...abandonedCarts];

    // Inventory Forecasting
    const productSalesVelocity: Record<string, { 
      product: typeof products[0]; 
      salesLast30: number;
      salesLast7: number;
      avgDailySales: number;
      currentStock: number;
      daysUntilStockout: number;
      reorderSuggested: boolean;
      trend: "up" | "down" | "stable";
    }> = {};

    products.forEach(product => {
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
      
      // Simulated stock levels
      const stockLevel = Math.floor(Math.random() * 50) + 5;
      const daysUntilStockout = avgDaily30 > 0 ? Math.floor(stockLevel / avgDaily30) : 999;
      
      let trend: "up" | "down" | "stable" = "stable";
      if (avgDaily7 > avgDaily30 * 1.2) trend = "up";
      else if (avgDaily7 < avgDaily30 * 0.8) trend = "down";

      productSalesVelocity[product.id] = {
        product,
        salesLast30: last30Sales,
        salesLast7: last7Sales,
        avgDailySales: avgDaily30,
        currentStock: stockLevel,
        daysUntilStockout,
        reorderSuggested: daysUntilStockout < 14,
        trend
      };
    });

    // Sort by urgency (lowest days until stockout first)
    const inventoryForecast = Object.values(productSalesVelocity)
      .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

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
      abandonedCarts: allAbandonedCarts,
      inventoryForecast,
    };
  }, [allOrders, products, dateRange]);

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

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      price: 0,
      category: "Tees",
      description: "",
      image: "https://placehold.co/600x800/1a1a1a/ffffff?text=Product",
      sizes: ["S", "M", "L", "XL"],
      inStock: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      category: product.category,
      description: product.description,
      image: product.image,
      sizes: product.sizes || ["S", "M", "L", "XL"],
      inStock: product.inStock ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (editingProduct) {
      await updateProduct(editingProduct.id, formData);
      toast.success(`${formData.name} updated successfully`);
    } else {
      await addProduct(formData);
      toast.success(`${formData.name} added successfully`);
    }

    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await deleteProduct(productId);
    toast.success("Product deleted successfully");
  };

  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    await updateOrderStatus(orderId, newStatus);
    toast.success(`Order status updated to ${newStatus}`);
  };

  // Loading state
  if (authLoading || productsLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Not authorized
  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-red-100 flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
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
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="w-6 h-6" />
            <h1 className="text-3xl md:text-4xl font-light tracking-tight">ADMIN PANEL</h1>
          </div>
          <p className="text-white/60">Manage products and orders</p>
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
            <DollarSign className="w-5 h-5 text-gray-400 mb-2" />
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
            {metrics.abandonedCarts.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {metrics.abandonedCarts.length}
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
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Date Range Filter */}
            <div className="flex justify-end">
              <div className="flex gap-2 bg-gray-100 p-1">
                {(["7d", "30d", "90d", "all"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-2 text-xs tracking-wider transition ${
                      dateRange === range ? "bg-white shadow-sm" : "hover:bg-gray-200"
                    }`}
                  >
                    {range === "all" ? "ALL TIME" : range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium ${metrics.revenueChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {metrics.revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(metrics.revenueChange).toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-medium">${metrics.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500 tracking-wider mt-1">TOTAL REVENUE</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-100 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium ${metrics.ordersChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {metrics.ordersChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(metrics.ordersChange).toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-medium">{metrics.totalOrders}</p>
                <p className="text-xs text-gray-500 tracking-wider mt-1">TOTAL ORDERS</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-purple-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium ${metrics.customersChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {metrics.customersChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(metrics.customersChange).toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-medium">{metrics.uniqueCustomers}</p>
                <p className="text-xs text-gray-500 tracking-wider mt-1">CUSTOMERS</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-amber-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className={`flex items-center gap-1 text-xs font-medium ${metrics.avgChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {metrics.avgChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(metrics.avgChange).toFixed(1)}%
                  </span>
                </div>
                <p className="text-2xl font-medium">${metrics.avgOrderValue.toFixed(2)}</p>
                <p className="text-xs text-gray-500 tracking-wider mt-1">AVG ORDER VALUE</p>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Orders Chart */}
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-medium">Orders (Last 7 Days)</h3>
                    <p className="text-xs text-gray-500 mt-1">Daily order volume</p>
                  </div>
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                </div>
                <MiniBarChart data={metrics.ordersByDay} maxValue={Math.max(...metrics.ordersByDay, 1)} />
                <div className="flex justify-between mt-3 text-xs text-gray-400">
                  <span>6d ago</span>
                  <span>Today</span>
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-medium">Order Status</h3>
                    <p className="text-xs text-gray-500 mt-1">Current distribution</p>
                  </div>
                  <PieChart className="w-5 h-5 text-gray-400" />
                </div>
                <DonutChart 
                  data={[
                    { label: "Pending", value: metrics.ordersByStatus.pending, color: "#fef3c7" },
                    { label: "Confirmed", value: metrics.ordersByStatus.confirmed, color: "#dbeafe" },
                    { label: "Processing", value: metrics.ordersByStatus.processing, color: "#e9d5ff" },
                    { label: "Shipped", value: metrics.ordersByStatus.shipped, color: "#c7d2fe" },
                    { label: "Delivered", value: metrics.ordersByStatus.delivered, color: "#bbf7d0" },
                    { label: "Cancelled", value: metrics.ordersByStatus.cancelled, color: "#fecaca" },
                  ]}
                  colors={[]}
                />
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {STATUS_OPTIONS.map(status => (
                    <div key={status} className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status].replace("text-", "bg-").split(" ")[0]}`} />
                      <span className="capitalize">{status}</span>
                      <span className="text-gray-400">({metrics.ordersByStatus[status]})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Top Products */}
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-medium">Top Products</h3>
                    <p className="text-xs text-gray-500 mt-1">By revenue</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  {metrics.topProducts.length > 0 ? (
                    metrics.topProducts.map((product, i) => (
                      <div key={product.id} className="flex items-center gap-4">
                        <span className="w-6 h-6 bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                          {i + 1}
                        </span>
                        <div className="w-10 h-12 bg-gray-100 relative overflow-hidden flex-shrink-0">
                          <Image src={product.image} alt={product.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.count} sold</p>
                        </div>
                        <p className="font-medium">${product.revenue.toFixed(0)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-400 py-8">No sales data yet</p>
                  )}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-medium">Recent Orders</h3>
                    <p className="text-xs text-gray-500 mt-1">Latest activity</p>
                  </div>
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  {metrics.recentOrders.length > 0 ? (
                    metrics.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="text-sm font-medium">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                          <p className="text-xs text-gray-500">#{order.id.slice(0, 8)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${order.total.toFixed(2)}</p>
                          <span className={`text-xs px-2 py-0.5 ${STATUS_COLORS[order.status]}`}>
                            {order.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-400 py-8">No orders yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sales by Category */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-medium">Sales by Category</h3>
                  <p className="text-xs text-gray-500 mt-1">Revenue distribution</p>
                </div>
                <Tag className="w-5 h-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {CATEGORIES.map(category => {
                  const revenue = metrics.salesByCategory[category] || 0;
                  const totalCategoryRevenue = Object.values(metrics.salesByCategory).reduce((a, b) => a + b, 0);
                  const percentage = totalCategoryRevenue > 0 ? (revenue / totalCategoryRevenue) * 100 : 0;
                  return (
                    <div key={category} className="text-center p-4 bg-gray-50">
                      <p className="text-2xl font-medium">${revenue.toFixed(0)}</p>
                      <p className="text-xs text-gray-500 tracking-wider mt-1">{category.toUpperCase()}</p>
                      <div className="w-full h-1 bg-gray-200 mt-3">
                        <div className="h-full bg-black" style={{ width: `${percentage}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{percentage.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 flex items-center gap-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-lg font-medium">{metrics.ordersByStatus.delivered}</p>
                  <p className="text-xs text-gray-500">Delivered</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 flex items-center gap-4">
                <Truck className="w-8 h-8 text-indigo-500" />
                <div>
                  <p className="text-lg font-medium">{metrics.ordersByStatus.shipped}</p>
                  <p className="text-xs text-gray-500">In Transit</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 flex items-center gap-4">
                <Clock className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-lg font-medium">{metrics.ordersByStatus.pending + metrics.ordersByStatus.confirmed}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 flex items-center gap-4">
                <XCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-lg font-medium">{metrics.ordersByStatus.cancelled}</p>
                  <p className="text-xs text-gray-500">Cancelled</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Add */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "products" ? "Search products..." : "Search orders..."}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 focus:border-black outline-none transition"
            />
          </div>
          {activeTab === "products" && (
            <button
              onClick={openAddModal}
              className="bg-black text-white px-6 py-3 text-sm tracking-wider font-medium flex items-center justify-center gap-2 hover:bg-gray-900 transition"
            >
              <Plus className="w-4 h-4" /> ADD PRODUCT
            </button>
          )}
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">PRODUCT</th>
                    <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">CATEGORY</th>
                    <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">PRICE</th>
                    <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">STATUS</th>
                    <th className="text-right py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <motion.tr 
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-16 bg-gray-100 relative overflow-hidden flex-shrink-0">
                            <Image src={product.image} alt={product.name} fill className="object-cover" />
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-gray-100 px-3 py-1 text-xs tracking-wider">
                          {product.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium">${product.price}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 text-xs ${product.inStock ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {product.inStock ? "IN STOCK" : "OUT OF STOCK"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 hover:bg-gray-100 text-gray-600 hover:text-black transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 hover:bg-red-50 text-gray-600 hover:text-red-500 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No products found</p>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border border-gray-200">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No orders found</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 tracking-wider">ORDER #{order.id}</p>
                      <p className="text-sm">{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                      <p className="text-xs text-gray-500">{order.userEmail}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as Order["status"])}
                          className={`appearance-none pr-8 pl-3 py-2 text-xs tracking-wider cursor-pointer ${STATUS_COLORS[order.status]}`}
                        >
                          {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>
                              {status.toUpperCase()}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" />
                      </div>
                      <span className="font-medium">${order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2">
                        <div className="w-8 h-10 bg-gray-200 relative overflow-hidden">
                          <Image src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="text-xs font-medium">{item.name}</p>
                          <p className="text-xs text-gray-500">Size: {item.size} x {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500">
                    <p>{order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                    <p>Placed: {new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Customer Segmentation Tab */}
        {activeTab === "customers" && (
          <div className="space-y-8">
            {/* Segment Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { key: "vip", label: "VIP", icon: Crown, color: "bg-amber-100 text-amber-700", description: "$500+ spent or 5+ orders" },
                { key: "loyal", label: "Loyal", icon: Star, color: "bg-purple-100 text-purple-700", description: "3+ orders, active" },
                { key: "regular", label: "Regular", icon: Users, color: "bg-blue-100 text-blue-700", description: "2+ orders" },
                { key: "newCustomers", label: "New", icon: Zap, color: "bg-green-100 text-green-700", description: "First order <30d" },
                { key: "atRisk", label: "At Risk", icon: AlertTriangle, color: "bg-orange-100 text-orange-700", description: "30-90d inactive" },
                { key: "dormant", label: "Dormant", icon: Archive, color: "bg-gray-100 text-gray-700", description: "90d+ inactive" },
              ].map(segment => (
                <motion.div
                  key={segment.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 border border-gray-200 ${segment.color.split(" ")[0]}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <segment.icon className={`w-4 h-4 ${segment.color.split(" ")[1]}`} />
                    <span className={`text-xs font-medium ${segment.color.split(" ")[1]}`}>{segment.label}</span>
                  </div>
                  <p className="text-2xl font-medium">
                    {metrics.customerSegments[segment.key as keyof typeof metrics.customerSegments].length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{segment.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Customer Behavior Insights */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* VIP Customers */}
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-500" />
                      VIP Customers
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Your most valuable customers</p>
                  </div>
                  <button className="text-xs tracking-wider text-black hover:underline">
                    EXPORT
                  </button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {metrics.customerSegments.vip.length > 0 ? (
                    metrics.customerSegments.vip.slice(0, 5).map((customer, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100">
                        <div>
                          <p className="text-sm font-medium">{customer.email}</p>
                          <p className="text-xs text-gray-500">
                            {customer.orders} orders · Avg ${customer.avgOrderValue.toFixed(0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-amber-700">${customer.totalSpent.toFixed(0)}</p>
                          <p className="text-xs text-gray-500">Total spent</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-400 py-8">No VIP customers yet</p>
                  )}
                </div>
              </div>

              {/* At-Risk Customers */}
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      At-Risk Customers
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Haven&apos;t ordered in 30-90 days</p>
                  </div>
                  <button className="bg-orange-500 text-white px-3 py-1.5 text-xs tracking-wider hover:bg-orange-600 transition">
                    SEND CAMPAIGN
                  </button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {metrics.customerSegments.atRisk.length > 0 ? (
                    metrics.customerSegments.atRisk.slice(0, 5).map((customer, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-100">
                        <div>
                          <p className="text-sm font-medium">{customer.email}</p>
                          <p className="text-xs text-gray-500">
                            Last order: {Math.floor((Date.now() - customer.lastOrder) / (24 * 60 * 60 * 1000))}d ago
                          </p>
                        </div>
                        <button className="p-2 hover:bg-orange-100 transition">
                          <Mail className="w-4 h-4 text-orange-600" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-400 py-8">No at-risk customers</p>
                  )}
                </div>
              </div>
            </div>

            {/* All Customers Table */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-medium">All Customers</h3>
                <p className="text-xs text-gray-500 mt-1">{metrics.customerData.length} total customers</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">EMAIL</th>
                      <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">ORDERS</th>
                      <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">TOTAL SPENT</th>
                      <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">AVG ORDER</th>
                      <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">LAST ORDER</th>
                      <th className="text-left py-3 px-6 text-xs tracking-wider text-gray-500 font-medium">SEGMENT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {metrics.customerData.slice(0, 10).map((customer, i) => {
                      let segment = "Regular";
                      let segmentColor = "bg-gray-100 text-gray-700";
                      if (metrics.customerSegments.vip.includes(customer)) {
                        segment = "VIP";
                        segmentColor = "bg-amber-100 text-amber-700";
                      } else if (metrics.customerSegments.loyal.includes(customer)) {
                        segment = "Loyal";
                        segmentColor = "bg-purple-100 text-purple-700";
                      } else if (metrics.customerSegments.newCustomers.includes(customer)) {
                        segment = "New";
                        segmentColor = "bg-green-100 text-green-700";
                      } else if (metrics.customerSegments.atRisk.includes(customer)) {
                        segment = "At Risk";
                        segmentColor = "bg-orange-100 text-orange-700";
                      } else if (metrics.customerSegments.dormant.includes(customer)) {
                        segment = "Dormant";
                        segmentColor = "bg-gray-100 text-gray-500";
                      }

                      return (
                        <tr key={i} className="hover:bg-gray-50 transition">
                          <td className="py-3 px-6 text-sm">{customer.email}</td>
                          <td className="py-3 px-6 text-sm">{customer.orders}</td>
                          <td className="py-3 px-6 text-sm font-medium">${customer.totalSpent.toFixed(0)}</td>
                          <td className="py-3 px-6 text-sm">${customer.avgOrderValue.toFixed(0)}</td>
                          <td className="py-3 px-6 text-sm text-gray-500">
                            {new Date(customer.lastOrder).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-6">
                            <span className={`px-2 py-1 text-xs ${segmentColor}`}>{segment}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Abandoned Cart Recovery Tab */}
        {activeTab === "abandoned" && (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 p-6">
                <ShoppingCart className="w-5 h-5 text-red-500 mb-2" />
                <p className="text-2xl font-medium">{metrics.abandonedCarts.length}</p>
                <p className="text-xs text-gray-500 tracking-wider">ABANDONED CARTS</p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <DollarSign className="w-5 h-5 text-red-500 mb-2" />
                <p className="text-2xl font-medium">
                  ${metrics.abandonedCarts.reduce((sum, c) => sum + c.total, 0).toFixed(0)}
                </p>
                <p className="text-xs text-gray-500 tracking-wider">POTENTIAL REVENUE</p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <Mail className="w-5 h-5 text-blue-500 mb-2" />
                <p className="text-2xl font-medium">
                  {metrics.abandonedCarts.filter(c => c.remindersSent > 0).length}
                </p>
                <p className="text-xs text-gray-500 tracking-wider">REMINDERS SENT</p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <RefreshCw className="w-5 h-5 text-green-500 mb-2" />
                <p className="text-2xl font-medium">
                  {metrics.abandonedCarts.filter(c => c.recovered).length}
                </p>
                <p className="text-xs text-gray-500 tracking-wider">RECOVERED</p>
              </div>
            </div>

            {/* Recovery Actions */}
            <div className="bg-amber-50 border border-amber-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-100 flex items-center justify-center">
                  <Target className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-medium">Cart Recovery Campaign</h3>
                  <p className="text-sm text-gray-600">
                    {metrics.abandonedCarts.filter(c => c.remindersSent === 0).length} carts haven&apos;t received any reminders yet
                  </p>
                </div>
              </div>
              <button className="bg-amber-600 text-white px-6 py-3 text-sm tracking-wider font-medium hover:bg-amber-700 transition flex items-center gap-2">
                <Send className="w-4 h-4" />
                SEND REMINDERS
              </button>
            </div>

            {/* Abandoned Carts List */}
            <div className="space-y-4">
              {metrics.abandonedCarts.length > 0 ? (
                metrics.abandonedCarts.map((cart) => {
                  const hoursAgo = Math.floor((Date.now() - cart.abandonedAt) / (60 * 60 * 1000));
                  const daysAgo = Math.floor(hoursAgo / 24);
                  const timeLabel = daysAgo > 0 ? `${daysAgo}d ago` : `${hoursAgo}h ago`;

                  return (
                    <motion.div
                      key={cart.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-gray-200 p-6"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <ShoppingCart className="w-4 h-4 text-gray-400" />
                            <p className="text-sm font-medium">{cart.email}</p>
                            {hoursAgo < 24 && (
                              <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5">HOT LEAD</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            Abandoned {timeLabel} · {cart.remindersSent} reminder{cart.remindersSent !== 1 ? "s" : ""} sent
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-medium">${cart.total.toFixed(2)}</span>
                          <button className="bg-black text-white px-4 py-2 text-xs tracking-wider hover:bg-gray-900 transition flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            SEND REMINDER
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {cart.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-2">
                            <div className="w-10 h-12 bg-gray-200 relative overflow-hidden">
                              <Image src={item.image} alt={item.name} fill className="object-cover" />
                            </div>
                            <div>
                              <p className="text-xs font-medium">{item.name}</p>
                              <p className="text-xs text-gray-500">${item.price} x {item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Progress bar for reminders */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <span>Recovery progress</span>
                          <span>{cart.remindersSent}/3 reminders</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-black transition-all"
                            style={{ width: `${(cart.remindersSent / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-gray-500 border border-gray-200 bg-white">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>No abandoned carts</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inventory Forecasting Tab */}
        {activeTab === "inventory" && (
          <div className="space-y-8">
            {/* Alert Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-red-50 border border-red-200 p-6">
                <AlertTriangle className="w-5 h-5 text-red-500 mb-2" />
                <p className="text-2xl font-medium text-red-700">
                  {metrics.inventoryForecast.filter(i => i.daysUntilStockout < 7).length}
                </p>
                <p className="text-xs text-red-600 tracking-wider">CRITICAL (&lt;7 DAYS)</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-6">
                <Clock className="w-5 h-5 text-amber-500 mb-2" />
                <p className="text-2xl font-medium text-amber-700">
                  {metrics.inventoryForecast.filter(i => i.daysUntilStockout >= 7 && i.daysUntilStockout < 14).length}
                </p>
                <p className="text-xs text-amber-600 tracking-wider">LOW STOCK (7-14 DAYS)</p>
              </div>
              <div className="bg-green-50 border border-green-200 p-6">
                <CheckCircle className="w-5 h-5 text-green-500 mb-2" />
                <p className="text-2xl font-medium text-green-700">
                  {metrics.inventoryForecast.filter(i => i.daysUntilStockout >= 14).length}
                </p>
                <p className="text-xs text-green-600 tracking-wider">HEALTHY STOCK</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-6">
                <TrendingUp className="w-5 h-5 text-blue-500 mb-2" />
                <p className="text-2xl font-medium text-blue-700">
                  {metrics.inventoryForecast.filter(i => i.trend === "up").length}
                </p>
                <p className="text-xs text-blue-600 tracking-wider">TRENDING UP</p>
              </div>
            </div>

            {/* Reorder Suggestions */}
            {metrics.inventoryForecast.filter(i => i.reorderSuggested).length > 0 && (
              <div className="bg-amber-50 border border-amber-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                  <div>
                    <h3 className="font-medium">Reorder Suggestions</h3>
                    <p className="text-sm text-gray-600">
                      {metrics.inventoryForecast.filter(i => i.reorderSuggested).length} products need restocking soon
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {metrics.inventoryForecast
                    .filter(i => i.reorderSuggested)
                    .slice(0, 5)
                    .map(item => (
                      <span 
                        key={item.product.id}
                        className="bg-white px-3 py-1.5 text-sm border border-amber-200"
                      >
                        {item.product.name} ({item.daysUntilStockout}d)
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Inventory Table */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">PRODUCT</th>
                      <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">CURRENT STOCK</th>
                      <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">30D SALES</th>
                      <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">7D SALES</th>
                      <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">DAILY AVG</th>
                      <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">DAYS LEFT</th>
                      <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">TREND</th>
                      <th className="text-left py-4 px-6 text-xs tracking-wider text-gray-500 font-medium">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {metrics.inventoryForecast.map((item) => {
                      let statusColor = "bg-green-100 text-green-800";
                      let statusText = "HEALTHY";
                      
                      if (item.daysUntilStockout < 7) {
                        statusColor = "bg-red-100 text-red-800";
                        statusText = "CRITICAL";
                      } else if (item.daysUntilStockout < 14) {
                        statusColor = "bg-amber-100 text-amber-800";
                        statusText = "LOW";
                      }

                      return (
                        <tr key={item.product.id} className="hover:bg-gray-50 transition">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-12 bg-gray-100 relative overflow-hidden flex-shrink-0">
                                <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{item.product.name}</p>
                                <p className="text-xs text-gray-500">{item.product.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`font-medium ${item.currentStock < 10 ? "text-red-600" : ""}`}>
                              {item.currentStock}
                            </span>
                          </td>
                          <td className="py-4 px-6">{item.salesLast30}</td>
                          <td className="py-4 px-6">{item.salesLast7}</td>
                          <td className="py-4 px-6">{item.avgDailySales.toFixed(1)}</td>
                          <td className="py-4 px-6">
                            <span className={`font-medium ${
                              item.daysUntilStockout < 7 ? "text-red-600" : 
                              item.daysUntilStockout < 14 ? "text-amber-600" : ""
                            }`}>
                              {item.daysUntilStockout > 100 ? "100+" : item.daysUntilStockout}d
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-1">
                              {item.trend === "up" && (
                                <>
                                  <TrendingUp className="w-4 h-4 text-green-500" />
                                  <span className="text-xs text-green-600">Up</span>
                                </>
                              )}
                              {item.trend === "down" && (
                                <>
                                  <TrendDown className="w-4 h-4 text-red-500" />
                                  <span className="text-xs text-red-600">Down</span>
                                </>
                              )}
                              {item.trend === "stable" && (
                                <>
                                  <Activity className="w-4 h-4 text-gray-400" />
                                  <span className="text-xs text-gray-500">Stable</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-1 text-xs ${statusColor}`}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Forecast Chart */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-medium">Stock Level Projections</h3>
                  <p className="text-xs text-gray-500 mt-1">Estimated days until stockout by category</p>
                </div>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {CATEGORIES.map(category => {
                  const categoryItems = metrics.inventoryForecast.filter(i => i.product.category === category);
                  const avgDaysLeft = categoryItems.length > 0
                    ? Math.min(100, categoryItems.reduce((sum, i) => sum + i.daysUntilStockout, 0) / categoryItems.length)
                    : 100;
                  
                  let barColor = "bg-green-500";
                  if (avgDaysLeft < 7) barColor = "bg-red-500";
                  else if (avgDaysLeft < 14) barColor = "bg-amber-500";
                  else if (avgDaysLeft < 30) barColor = "bg-blue-500";

                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{category}</span>
                        <span className="text-gray-500">{Math.floor(avgDaysLeft)}d avg</span>
                      </div>
                      <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${barColor} transition-all`}
                          style={{ width: `${Math.min(100, avgDaysLeft)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-light tracking-tight">
                  {editingProduct ? "EDIT PRODUCT" : "ADD PRODUCT"}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">PRODUCT NAME</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">PRICE ($)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs tracking-wider text-gray-500 mb-2">CATEGORY</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition bg-white"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">DESCRIPTION</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition resize-none"
                    placeholder="Product description"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs tracking-wider text-gray-500 mb-2">IMAGE URL</label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 focus:border-black outline-none transition"
                    placeholder="https://..."
                    required
                  />
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.inStock}
                      onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.checked }))}
                      className="w-5 h-5 border-gray-300 focus:ring-black"
                    />
                    <span className="text-sm">In Stock</span>
                  </label>
                </div>

                {/* Preview */}
                {formData.image && (
                  <div className="bg-gray-50 p-4">
                    <p className="text-xs tracking-wider text-gray-400 mb-2">PREVIEW</p>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-20 bg-gray-200 relative overflow-hidden">
                        <Image 
                          src={formData.image} 
                          alt="Preview" 
                          fill 
                          className="object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/600x800/1a1a1a/ffffff?text=Error";
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{formData.name || "Product Name"}</p>
                        <p className="text-sm text-gray-500">${formData.price}</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-4 text-sm tracking-wider font-medium hover:bg-gray-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> SAVING...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> {editingProduct ? "UPDATE PRODUCT" : "ADD PRODUCT"}
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
