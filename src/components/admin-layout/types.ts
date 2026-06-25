import { Order } from "@/context/OrderContext";

export type Tab = "dashboard" | "products" | "orders" | "customers" | "abandoned" | "inventory" | "pricing" | "influencers" | "analytics" | "reviews" | "loyalty";

export type DateRange = "7d" | "30d" | "90d" | "all";

export const CATEGORIES = ["Hoodies", "Tees", "Pants", "Outerwear", "Accessories"];

export const STATUS_OPTIONS: Order["status"][] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

export const STATUS_COLORS: Record<Order["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  processing: "bg-violet-100 text-violet-800",
  shipped: "bg-slate-100 text-slate-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

export interface CustomerData {
  email: string;
  orders: number;
  totalSpent: number;
  lastOrder: number;
  avgOrderValue: number;
  categories: string[];
}

export interface CustomerSegments {
  vip: CustomerData[];
  loyal: CustomerData[];
  regular: CustomerData[];
  newCustomers: CustomerData[];
  atRisk: CustomerData[];
  dormant: CustomerData[];
}

export interface AbandonedCartMetrics {
  total: number;
  potentialRevenue: number;
  remindersSent: number;
  recovered: number;
  hotLeads: number;
  noReminders: number;
}

export interface InventoryForecastItem {
  product: {
    id: string;
    name: string;
    image: string;
    category: string;
    price: number;
  };
  salesLast30: number;
  salesLast7: number;
  avgDailySales: number;
  currentStock: number;
  daysUntilStockout: number;
  reorderSuggested: boolean;
  trend: "up" | "down" | "stable";
}

export interface TopProduct {
  id: string;
  name: string;
  image: string;
  count: number;
  revenue: number;
}

export interface Metrics {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  avgOrderValue: number;
  avgChange: number;
  conversionRate: number;
  conversionChange: number;
  ordersByStatus: Record<Order["status"], number>;
  ordersByDay: number[];
  revenueByDay: number[];
  topProducts: TopProduct[];
  salesByCategory: Record<string, number>;
  uniqueCustomers: number;
  customersChange: number;
  recentOrders: Order[];
  customerSegments: CustomerSegments;
  customerData: CustomerData[];
  abandonedCartMetrics: AbandonedCartMetrics;
  inventoryForecast: InventoryForecastItem[];
}
