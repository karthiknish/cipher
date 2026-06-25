import Link from "@/components/Link";
import { usePathname } from "@/lib/navigation";
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
  CalendarBlank,
  Ticket,
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
  | "blog"
  | "events"
  | "promos";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  activeTab: AdminTab;
  actions?: React.ReactNode;
}

const navItems: { key: AdminTab; label: string; href: string; icon: React.ElementType; comingSoon?: boolean }[] = [
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
  { key: "challenges", label: "Challenges", href: "/admin/challenges", icon: Trophy, comingSoon: true },
  { key: "achievements", label: "Achievements", href: "/admin/achievements", icon: Medal, comingSoon: true },
  { key: "blog", label: "Blog", href: "/admin/blog", icon: Article },
  { key: "events", label: "Events", href: "/admin/events", icon: CalendarBlank },
  { key: "promos", label: "Promo Codes", href: "/admin/promos", icon: Ticket },
];

export default function AdminLayout({ children, title, activeTab, actions }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-950 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition">
                <SquaresFour className="size-6" />
                <span className="text-lg font-light tracking-tight">ADMIN</span>
              </Link>
              <CaretRight className="size-4 text-white/40" />
              <h1 className="text-lg font-light">{title}</h1>
            </div>
            <div className="flex items-center gap-4">
              {actions}
              <Link
                href="/admin/design-voting"
                className="hidden md:flex items-center gap-2 border border-white/30 px-4 py-2 text-xs tracking-wider hover:bg-white/10 transition"
              >
                <Crown className="size-4" />
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
              const className = `flex items-center gap-2 px-3 py-2 text-xs tracking-wider whitespace-nowrap rounded-lg transition ${
                isActive
                  ? "bg-gray-950 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-black"
              }`;
              if (item.comingSoon) {
                return (
                  <span
                    key={item.key}
                    title="Preview only — full admin tools coming soon"
                    className={`${className} opacity-60 cursor-not-allowed`}
                  >
                    <Icon className="size-4" />
                    {item.label.toUpperCase()}
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">SOON</span>
                  </span>
                );
              }
              return (
                <Link key={item.key} href={item.href} className={className}>
                  <Icon className="size-4" />
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
                const className = `flex items-center gap-3 px-4 py-3 text-sm transition border-l-2 ${
                  isActive
                    ? "bg-gray-50 border-black text-black font-medium"
                    : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-black"
                }`;
                if (item.comingSoon) {
                  return (
                    <span
                      key={item.key}
                      title="Preview only — full admin tools coming soon"
                      className={`${className} opacity-60 cursor-not-allowed justify-between`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="size-4" />
                        {item.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded">Soon</span>
                    </span>
                  );
                }
                return (
                  <Link key={item.key} href={item.href} className={className}>
                    <Icon className="size-4" />
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
