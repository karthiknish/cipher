"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
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
  CaretRight,
  Stack,
  Trophy,
  Medal,
  Article,
} from "@phosphor-icons/react";

export type AdminTab = 
  | "dashboard" 
  | "products" 
  | "bundles"
  | "orders" 
  | "customers" 
  | "abandoned" 
  | "inventory" 
  | "pricing" 
  | "influencers" 
  | "analytics"
  | "reviews" 
  | "loyalty"
  | "challenges"
  | "achievements"
  | "blog";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  activeTab: AdminTab;
  actions?: React.ReactNode;
}

const navItems: { key: AdminTab; label: string; href: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin/dashboard", icon: SquaresFour },
  { key: "products", label: "Products", href: "/admin/products", icon: Package },
  { key: "bundles", label: "Bundles", href: "/admin/bundles", icon: Stack },
  { key: "orders", label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { key: "customers", label: "Customers", href: "/admin/customers", icon: Users },
  { key: "abandoned", label: "Abandoned Carts", href: "/admin/abandoned", icon: ShoppingCart },
  { key: "inventory", label: "Inventory", href: "/admin/inventory", icon: Package },
  { key: "pricing", label: "Pricing", href: "/admin/pricing", icon: Percent },
  { key: "influencers", label: "Influencers", href: "/admin/influencers", icon: UserCirclePlus },
  { key: "analytics", label: "Analytics", href: "/admin/analytics", icon: ChartLineUp },
  { key: "reviews", label: "Reviews", href: "/admin/reviews", icon: Star },
  { key: "loyalty", label: "Loyalty", href: "/admin/loyalty", icon: Gift },
  { key: "challenges", label: "Challenges", href: "/admin/challenges", icon: Trophy },
  { key: "achievements", label: "Achievements", href: "/admin/achievements", icon: Medal },
  { key: "blog", label: "Blog", href: "/admin/blog", icon: Article },
];

export default function AdminLayout({ children, title, activeTab, actions }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-black text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition">
                <SquaresFour className="w-6 h-6" />
                <span className="text-lg font-light tracking-tight">ADMIN</span>
              </Link>
              <CaretRight className="w-4 h-4 text-white/40" />
              <h1 className="text-lg font-light">{title}</h1>
            </div>
            <div className="flex items-center gap-4">
              {actions}
              <Link
                href="/admin/design-voting"
                className="hidden md:flex items-center gap-2 border border-white/30 px-4 py-2 text-xs tracking-wider hover:bg-white/10 transition"
              >
                <Crown className="w-4 h-4" />
                DESIGN VOTING
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Mobile Navigation */}
        <div className="lg:hidden mb-4 -mx-4 px-4 overflow-x-auto">
          <nav className="flex gap-2 pb-2 min-w-max">
            {navItems.map((item) => {
              const isActive = activeTab === item.key || pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 text-xs tracking-wider whitespace-nowrap rounded-lg transition ${
                    isActive
                      ? "bg-black text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-black"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label.toUpperCase()}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <nav className="bg-white border border-gray-200 rounded-lg overflow-hidden sticky top-6">
              {navItems.map((item) => {
                const isActive = activeTab === item.key || pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition border-l-2 ${
                      isActive
                        ? "bg-gray-50 border-black text-black font-medium"
                        : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-black"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
