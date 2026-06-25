import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { motion } from "@/lib/motion";
import {
  ChartLineUp,
  Users,
  Eye,
  ShoppingCart,
  CurrencyDollar,
  TrendUp,
  TrendDown,
  ArrowRight,
  Funnel,
  Clock,
  Desktop,
  DeviceMobile,
  DeviceTablet,
  Globe,
  MagnifyingGlass,
  Warning,
  CheckCircle,
} from "@phosphor-icons/react";
interface AnalyticsMetric {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color: string;
}

interface PageViewData {
  path: string;
  count: number;
  avgDuration?: number;
}

interface DeviceData {
  device: string;
  count: number;
  percentage: number;
}

interface ConversionFunnel {
  step: string;
  count: number;
  rate: number;
}

interface SearchQuery {
  query: string;
  count: number;
  hasResults: boolean;
}

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: PageViewData[];
  deviceBreakdown: DeviceData[];
  conversionFunnel: ConversionFunnel[];
  topSearches: SearchQuery[];
  recentErrors: Array<{
    error: string;
    count: number;
    path: string;
  }>;
}

export function AnalyticsTab() {
  const [dateRange, setDateRange] = useState<"today" | "7d" | "30d" | "90d">("7d");

  const since = useMemo(() => {
    const rangeMs = {
      today: 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
    }[dateRange];
    return Date.now() - rangeMs;
  }, [dateRange]);

  const dashboard = useQuery(api.analytics.getAdminDashboard, { since });
  const loading = dashboard === undefined;
  const data: AnalyticsData | null = dashboard ?? null;

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const metrics: AnalyticsMetric[] = data ? [
    {
      label: "Page Views",
      value: data.pageViews.toLocaleString(),
      icon: Eye,
      color: "bg-sky-100 text-sky-700",
    },
    {
      label: "Unique Visitors",
      value: data.uniqueVisitors.toLocaleString(),
      icon: Users,
      color: "bg-violet-100 text-violet-700",
    },
    {
      label: "Sessions",
      value: data.sessions.toLocaleString(),
      icon: Globe,
      color: "bg-slate-100 text-slate-700",
    },
    {
      label: "Bounce Rate",
      value: `${data.bounceRate}%`,
      icon: data.bounceRate > 50 ? TrendDown : TrendUp,
      color: data.bounceRate > 50 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700",
    },
    {
      label: "Avg. Session",
      value: formatDuration(data.avgSessionDuration),
      icon: Clock,
      color: "bg-amber-100 text-amber-700",
    },
    {
      label: "Conversion Rate",
      value: `${data.conversionFunnel[3]?.rate || 0}%`,
      icon: ChartLineUp,
      color: "bg-emerald-100 text-emerald-700",
    },
  ] : [];

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case "mobile": return DeviceMobile;
      case "tablet": return DeviceTablet;
      default: return Desktop;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin size-8 border-2 border-gray-300 border-t-black rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Website Analytics</h2>
        <div className="flex gap-2">
          {(["today", "7d", "30d", "90d"] as const).map(range => (
            <button type="button" key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 text-sm transition ${
                dateRange === range
                  ? "bg-gray-950 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {range === "today" ? "Today" : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-gray-200 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded ${metric.color.split(" ")[0]}`}>
                <metric.icon className={`size-4 ${metric.color.split(" ")[1]}`} />
              </div>
              <span className="text-xs text-gray-500">{metric.label}</span>
            </div>
            <p className="text-2xl font-medium">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Funnel className="size-5 text-gray-400" />
            <h3 className="font-medium">Conversion Funnel</h3>
          </div>
          <div className="space-y-4">
            {data?.conversionFunnel.map((step, i) => (
              <div key={step.step}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{step.step}</span>
                  <span className="text-sm font-medium">{step.count.toLocaleString()}</span>
                </div>
                <div className="relative h-8 bg-gray-100 rounded overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${step.rate}%` }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-500 to-violet-500 flex items-center justify-end pr-2"
                  >
                    {step.rate > 10 && (
                      <span className="text-xs text-white font-medium">{step.rate}%</span>
                    )}
                  </motion.div>
                  {step.rate <= 10 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      {step.rate}%
                    </span>
                  )}
                </div>
                {i < (data?.conversionFunnel.length || 0) - 1 && (
                  <div className="flex justify-center my-2">
                    <ArrowRight className="size-4 text-gray-300 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Desktop className="size-5 text-gray-400" />
            <h3 className="font-medium">Device Breakdown</h3>
          </div>
          <div className="space-y-4">
            {data?.deviceBreakdown.map(device => {
              const Icon = getDeviceIcon(device.device);
              return (
                <div key={device.device} className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 rounded">
                    <Icon className="size-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm capitalize">{device.device}</span>
                      <span className="text-sm text-gray-500">{device.percentage}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${device.percentage}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gray-950"
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium w-16 text-right">
                    {device.count.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Pages */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Eye className="size-5 text-gray-400" />
            <h3 className="font-medium">Top Pages</h3>
          </div>
          <div className="space-y-3">
            {data?.topPages.slice(0, 8).map((page, i) => (
              <div key={page.path} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{page.path}</p>
                </div>
                <span className="text-sm font-medium">{page.count.toLocaleString()}</span>
                {page.avgDuration && (
                  <span className="text-xs text-gray-400">
                    {formatDuration(page.avgDuration)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top Searches */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <MagnifyingGlass className="size-5 text-gray-400" />
            <h3 className="font-medium">Top Searches</h3>
          </div>
          {data?.topSearches.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No search data yet</p>
          ) : (
            <div className="space-y-3">
              {data?.topSearches.map((search, i) => (
                <div key={search.query} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <p className="text-sm truncate">{search.query}</p>
                    {!search.hasResults && (
                      <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-xs rounded">
                        No results
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium">{search.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Errors Section */}
      {data?.recentErrors && data.recentErrors.length > 0 && (
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Warning className="size-5 text-rose-500" />
            <h3 className="font-medium">Recent Errors</h3>
            <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs rounded-full">
              {data.recentErrors.reduce((sum, e) => sum + e.count, 0)} total
            </span>
          </div>
          <div className="space-y-3">
            {data.recentErrors.map((error) => (
              <div key={`${error.path}-${error.error}`} className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-100 rounded">
                <Warning className="size-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-rose-700 truncate">{error.error}</p>
                  <p className="text-xs text-rose-500">{error.path}</p>
                </div>
                <span className="text-sm font-medium text-rose-600">{error.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {data?.pageViews === 0 && (
        <div className="text-center py-12 bg-gray-50 border border-gray-200">
          <ChartLineUp className="size-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No Analytics Data Yet</h3>
          <p className="text-gray-500 text-sm">
            Analytics data will appear here as visitors browse your store.
          </p>
        </div>
      )}
    </div>
  );
}
