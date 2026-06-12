import { useState, useEffect, useCallback } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import {
  CalendarIcon,
  DollarSign,
  TrendingUp,
  BarChart3,
  Users,
  MousePointerClick,
  RefreshCw,
  AlertTriangle,
  Route,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { cn } from "@/lib/utils.ts";
import type { DateRange } from "react-day-picker";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

type DatePreset = {
  label: string;
  getRange: () => DateRange;
};

const DATE_PRESETS: DatePreset[] = [
  {
    label: "All Time",
    getRange: () => ({ from: undefined, to: undefined }),
  },
  {
    label: "Today",
    getRange: () => {
      const today = new Date();
      return { from: startOfDay(today), to: endOfDay(today) };
    },
  },
  {
    label: "Yesterday",
    getRange: () => {
      const yesterday = subDays(new Date(), 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    },
  },
  {
    label: "Last 7 days",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 days",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
];

function getDefaultRange(): DateRange {
  const today = new Date();
  return {
    from: startOfDay(today),
    to: endOfDay(today),
  };
}

/* ------------------------------------------------------------------ */
/*  Metric card                                                        */
/* ------------------------------------------------------------------ */

type MetricCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
  accent?: boolean;
  delta?: string | null;
  deltaColor?: string;
};

function MetricCard({
  label,
  value,
  icon,
  subtitle,
  accent,
  delta,
  deltaColor: deltaCls,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <div
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center",
            accent ? "bg-[#1B4332]/10 dark:bg-[#1B4332]/30" : "bg-muted",
          )}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <p
          className={cn(
            "text-2xl font-bold",
            accent ? "text-[#1B4332] dark:text-emerald-400" : "text-foreground",
          )}
        >
          {value}
        </p>
        {delta && (
          <span className={cn("text-xs font-medium", deltaCls)}>{delta}</span>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers for TW metric parsing                                      */
/* ------------------------------------------------------------------ */

type ParsedMetric = {
  current: number;
  previous: number;
  delta: number;
  title: string;
  type: string;
};

function findMetric(
  data: Record<string, unknown>,
  keys: string[],
): ParsedMetric | null {
  for (const key of keys) {
    const val = data[key];
    if (
      val &&
      typeof val === "object" &&
      "current" in (val as Record<string, unknown>)
    ) {
      return val as ParsedMetric;
    }
  }
  return null;
}

function fmtMetric(
  metric: ParsedMetric | null,
  prefix = "$",
  decimals = 0,
): string {
  if (!metric) return "--";
  const n = metric.current;
  if (!isFinite(n)) return "--";
  return `${prefix}${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

function fmtNumMetric(metric: ParsedMetric | null): string {
  if (!metric) return "--";
  const n = metric.current;
  if (!isFinite(n)) return "--";
  return n.toLocaleString();
}

function fmtDelta(metric: ParsedMetric | null): string | null {
  if (!metric || metric.delta === 0) return null;
  const sign = metric.delta > 0 ? "+" : "";
  return `${sign}${metric.delta.toFixed(0)}%`;
}

function deltaColor(metric: ParsedMetric | null): string {
  if (!metric) return "text-muted-foreground";
  return metric.delta > 0
    ? "text-emerald-600"
    : metric.delta < 0
      ? "text-red-500"
      : "text-muted-foreground";
}

/* ------------------------------------------------------------------ */
/*  Chart tooltip                                                      */
/* ------------------------------------------------------------------ */

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          {entry.name === "revenue"
            ? `Revenue: $${entry.value.toLocaleString()}`
            : `Donations: ${entry.value}`}
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Attribution helpers                                                */
/* ------------------------------------------------------------------ */

type Touchpoint = {
  source?: string;
  medium?: string;
  campaign?: string;
  channel?: string;
  timestamp?: string;
  url?: string;
  [key: string]: unknown;
};

type NormalisedOrder = {
  orderId: string;
  orderDate: string;
  revenue: number;
  currency: string;
  customerEmail: string;
  firstSource: string;
  lastSource: string;
  firstChannel: string;
  lastChannel: string;
  journeyLength: number;
  journey: Touchpoint[];
};

type ChannelStats = { orders: number; revenue: number };

function fmtMoney(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function SummaryTable({
  title,
  data,
}: {
  title: string;
  data: Record<string, ChannelStats>;
}) {
  const sorted = Object.entries(data).sort(
    ([, a], [, b]) => b.revenue - a.revenue,
  );

  if (sorted.length === 0) return null;

  const totalOrders = sorted.reduce((s, [, v]) => s + v.orders, 0);
  const totalRevenue = sorted.reduce((s, [, v]) => s + v.revenue, 0);

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-3">{title}</h2>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-5 py-3 bg-muted border-b border-border text-xs text-muted-foreground uppercase tracking-wide font-medium">
          <span>{title.includes("Channel") ? "Channel" : "Source"}</span>
          <span className="text-right">Orders</span>
          <span className="text-right">Revenue</span>
          <span className="text-right">% of Revenue</span>
        </div>
        {sorted.map(([name, stats]) => (
          <div
            key={name}
            className="grid grid-cols-4 gap-4 px-5 py-3 border-b last:border-b-0 border-border/50"
          >
            <span className="text-sm font-medium text-foreground truncate">
              {name}
            </span>
            <span className="text-sm text-right text-foreground">
              {stats.orders.toLocaleString()}
            </span>
            <span className="text-sm text-right text-emerald-700 font-medium">
              {fmtMoney(stats.revenue)}
            </span>
            <span className="text-sm text-right text-muted-foreground">
              {totalRevenue > 0
                ? `${((stats.revenue / totalRevenue) * 100).toFixed(1)}%`
                : "--"}
            </span>
          </div>
        ))}
        <div className="grid grid-cols-4 gap-4 px-5 py-3 bg-muted border-t border-border font-semibold">
          <span className="text-sm text-foreground">Total</span>
          <span className="text-sm text-right text-foreground">
            {totalOrders.toLocaleString()}
          </span>
          <span className="text-sm text-right text-emerald-700">
            {fmtMoney(totalRevenue)}
          </span>
          <span className="text-sm text-right text-foreground">100%</span>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order }: { order: NormalisedOrder }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b last:border-b-0 border-border/50">
      <div
        className="grid grid-cols-6 gap-3 px-5 py-3 cursor-pointer hover:bg-accent transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm text-foreground font-mono truncate">
          {order.orderId || "--"}
        </span>
        <span className="text-sm text-muted-foreground truncate">
          {order.orderDate
            ? (() => {
                try {
                  return format(new Date(order.orderDate), "MMM d, yyyy");
                } catch {
                  return order.orderDate;
                }
              })()
            : "--"}
        </span>
        <span className="text-sm text-emerald-700 font-medium text-right">
          {fmtMoney(order.revenue)}
        </span>
        <span className="text-sm text-foreground truncate">
          {order.lastChannel || order.lastSource || "--"}
        </span>
        <span className="text-sm text-muted-foreground truncate">
          {order.customerEmail || "--"}
        </span>
        <div className="flex items-center justify-end gap-1">
          <span className="text-xs text-muted-foreground">
            {order.journeyLength} step{order.journeyLength !== 1 ? "s" : ""}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {expanded && order.journey.length > 0 && (
        <div className="px-5 pb-4 bg-muted">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
            Customer Journey
          </p>
          <div className="space-y-2">
            {order.journey.map((tp, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 text-xs text-muted-foreground"
              >
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-[#1B4332] mt-1" />
                  {idx < order.journey.length - 1 && (
                    <div className="w-px h-4 bg-border" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground">
                    {tp.channel || tp.source || tp.medium || "Direct"}
                  </span>
                  {tp.campaign && (
                    <span className="ml-2 text-muted-foreground">
                      {tp.campaign}
                    </span>
                  )}
                  {tp.timestamp && (
                    <span className="ml-2 text-muted-foreground">
                      {(() => {
                        try {
                          return format(
                            new Date(tp.timestamp),
                            "MMM d, h:mm a",
                          );
                        } catch {
                          return tp.timestamp;
                        }
                      })()}
                    </span>
                  )}
                  {tp.url && (
                    <p className="text-muted-foreground truncate">{tp.url}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expanded && order.journey.length === 0 && (
        <div className="px-5 pb-4 bg-muted">
          <p className="text-xs text-muted-foreground">No journey data available</p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AnalyticsPage() {
  const { isAdmin, hasPermission } = useUserRole();
  const getSummary = useAction(api.triplewhale.actions.getSummaryPageData);
  const getAttribution = useAction(api.triplewhale.actions.getAttributionData);

  const [dateRange, setDateRange] = useState<DateRange>(getDefaultRange);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [rawData, setRawData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activePreset, setActivePreset] = useState<string | null>(
    "Today",
  );

  // Attribution state
  const [attrLoading, setAttrLoading] = useState(false);
  const [attrError, setAttrError] = useState<string | null>(null);
  const [orders, setOrders] = useState<NormalisedOrder[]>([]);
  const [channelSummary, setChannelSummary] = useState<Record<string, ChannelStats>>({});
  const [sourceSummary, setSourceSummary] = useState<Record<string, ChannelStats>>({});
  const [attrRawData, setAttrRawData] = useState<Record<string, unknown> | null>(null);
  const [showAttrRaw, setShowAttrRaw] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [attrHasFetched, setAttrHasFetched] = useState(false);

  // In-house conversion rate queries
  // Use local-time start/end of day so date filters match the user's actual calendar day
  const startISO = dateRange.from
    ? startOfDay(dateRange.from).toISOString()
    : "";
  const endISO = dateRange.to
    ? endOfDay(dateRange.to).toISOString()
    : "";

  const conversionStats = useQuery(
    api.pageViews.getConversionStats,
    startISO && endISO
      ? { startDate: startISO, endDate: endISO }
      : "skip",
  );

  const donationTrends = useQuery(
    api.analytics.getDonationTrends,
    startISO && endISO
      ? { startDate: startISO, endDate: endISO }
      : "skip",
  );

  const campaignBreakdown = useQuery(
    api.analytics.getCampaignBreakdown,
    startISO && endISO
      ? { startDate: startISO, endDate: endISO }
      : "skip",
  );

  const fetchSummary = useCallback(
    async (range?: DateRange) => {
      const r = range ?? dateRange;
      if (!r.from || !r.to) return;

      setLoading(true);
      setError(null);

      try {
        const result = await getSummary({
          startDate: r.from.toISOString().split("T")[0],
          endDate: r.to.toISOString().split("T")[0],
        });
        setData(result.data);
        setRawData(result.raw as Record<string, unknown>);
      } catch (err) {
        if (err instanceof ConvexError) {
          const { message } = err.data as { code: string; message: string };
          setError(message);
          toast.error(message);
        } else {
          const msg =
            err instanceof Error
              ? err.message
              : "Failed to load analytics data";
          setError(msg);
          toast.error(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [dateRange, getSummary],
  );

  const fetchAttribution = useCallback(
    async (targetPage = 1, range?: DateRange) => {
      const r = range ?? dateRange;
      if (!r.from || !r.to) return;

      setAttrLoading(true);
      setAttrError(null);

      try {
        const result = await getAttribution({
          startDate: r.from.toISOString().split("T")[0],
          endDate: r.to.toISOString().split("T")[0],
          page: targetPage,
          pageSize: 50,
        });
        setOrders(result.orders);
        setChannelSummary(result.channelSummary);
        setSourceSummary(result.sourceSummary);
        setTotalPages(result.totalPages);
        setPage(targetPage);
        setAttrRawData(result.raw as Record<string, unknown>);
        setAttrHasFetched(true);
      } catch (err) {
        if (err instanceof ConvexError) {
          const { message } = err.data as { code: string; message: string };
          setAttrError(message);
        } else {
          const msg =
            err instanceof Error ? err.message : "Failed to load attribution data";
          setAttrError(msg);
        }
      } finally {
        setAttrLoading(false);
      }
    },
    [dateRange, getAttribution],
  );

  const fetchAll = useCallback(
    async (range?: DateRange) => {
      await Promise.all([fetchSummary(range), fetchAttribution(1, range)]);
    },
    [fetchSummary, fetchAttribution],
  );

  const hasAnalytics = hasPermission("analytics");

  // Auto-fetch on mount
  useEffect(() => {
    if (hasAnalytics) {
      fetchAll();
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAnalytics]);

  const applyPreset = (preset: DatePreset) => {
    const range = preset.getRange();
    setDateRange(range);
    setActivePreset(preset.label);
    fetchAll(range);
  };

  if (!hasAnalytics) {
    return (
      <div className="px-4 md:px-8 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          You do not have permission to view analytics.
        </p>
      </div>
    );
  }

  // Extract TW metrics (ad-specific only)
  const adSpend = data
    ? findMetric(data, ["totalAdSpend", "adSpend", "spend", "ads"])
    : null;
  const blendedRoas = data
    ? findMetric(data, ["blendedRoas", "roas", "pixelRoas"])
    : null;

  // In-house revenue & donation counts (Convex DB = source of truth)
  const inHouseRevenue = (donationTrends ?? []).reduce((sum, d) => sum + d.revenue, 0);
  const inHouseDonationCount = (donationTrends ?? []).reduce((sum, d) => sum + d.count, 0);

  const chartData = (donationTrends ?? []).map((d) => ({
    date: d.date.slice(5),
    revenue: d.revenue,
    count: d.count,
  }));

  const isRefreshing = loading || attrLoading;

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Performance overview from Triple Whale and in-house tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                activePreset === preset.label
                  ? "bg-[#1B4332] text-white"
                  : "bg-card border border-border text-foreground hover:bg-accent",
              )}
            >
              {preset.label}
            </button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "justify-start text-left font-normal border border-border bg-card cursor-pointer h-9 px-3",
                  !dateRange.from && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <span className="text-sm text-foreground">
                      {format(dateRange.from, "MMM d")} –{" "}
                      {format(dateRange.to, "MMM d, yyyy")}
                    </span>
                  ) : (
                    <span className="text-sm text-foreground">
                      {format(dateRange.from, "MMM d, yyyy")}
                    </span>
                  )
                ) : (
                  <span className="text-sm">Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  if (range) {
                    setDateRange(range);
                    setActivePreset(null);
                  }
                }}
                numberOfMonths={2}
                defaultMonth={dateRange.from}
              />
            </PopoverContent>
          </Popover>

          <Button
            onClick={() => fetchAll()}
            disabled={isRefreshing}
            className="bg-[#1B4332] hover:bg-[#15362a] text-white h-9 px-4 cursor-pointer"
          >
            {isRefreshing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2 hidden sm:inline">
              {isRefreshing ? "Loading..." : "Refresh"}
            </span>
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading && !data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Failed to load analytics
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            {error}
          </p>
          <Button
            onClick={() => fetchAll()}
            className="bg-[#1B4332] hover:bg-[#15362a] text-white cursor-pointer"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          "space-y-8",
          loading && "opacity-60 pointer-events-none",
        )}
      >
        {/* =========== SUMMARY SECTION =========== */}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            label="Donor Revenue"
            value={
              donationTrends !== undefined
                ? `$${inHouseRevenue.toLocaleString()}`
                : "--"
            }
            icon={<DollarSign className="w-4 h-4 text-[#1B4332] dark:text-emerald-400" />}
            subtitle="From tracked donations"
            accent
          />
          <MetricCard
            label="Ad Spend"
            value={data ? fmtMetric(adSpend) : "--"}
            icon={<TrendingUp className="w-4 h-4 text-muted-foreground" />}
            delta={fmtDelta(adSpend)}
            deltaColor={deltaColor(adSpend)}
          />
          <MetricCard
            label="Blended ROAS"
            value={data ? fmtMetric(blendedRoas, "", 2) : "--"}
            icon={<BarChart3 className="w-4 h-4 text-[#1B4332] dark:text-emerald-400" />}
            subtitle="Revenue / Ad Spend"
            accent
            delta={fmtDelta(blendedRoas)}
            deltaColor={deltaColor(blendedRoas)}
          />
          <MetricCard
            label="Conversion Rate"
            value={
              conversionStats
                ? `${conversionStats.conversionRate.toFixed(2)}%`
                : "--"
            }
            icon={
              <MousePointerClick className="w-4 h-4 text-[#1B4332] dark:text-emerald-400" />
            }
            subtitle={
              conversionStats
                ? `${conversionStats.totalConverted} of ${conversionStats.totalVisitors} visitors donated`
                : "Tracking campaign visitors to completed donations"
            }
            accent
          />
          <MetricCard
            label="Total Donors"
            value={
              donationTrends !== undefined
                ? inHouseDonationCount.toLocaleString()
                : "--"
            }
            icon={<Users className="w-4 h-4 text-muted-foreground" />}
            subtitle="Completed donations"
          />
        </div>

        {/* Revenue Trend Chart */}
        {chartData.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Revenue Trend
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B4332" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1B4332" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#707070" }}
                    axisLine={{ stroke: "#e1e1e1" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#707070" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1B4332"
                    strokeWidth={2}
                    fill="url(#revGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Donation Count Trend */}
        {chartData.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              Daily Donations
            </h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#707070" }}
                    axisLine={{ stroke: "#e1e1e1" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#707070" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="#1B4332"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Campaign Breakdown Table */}
        {campaignBreakdown && campaignBreakdown.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">
                Campaign Breakdown
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Revenue and donations per campaign in the selected period.
              </p>
            </div>
            <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-muted border-b border-border text-xs text-muted-foreground uppercase tracking-wide font-medium">
              <span className="col-span-4">Campaign</span>
              <span className="col-span-2 text-right">Revenue</span>
              <span className="col-span-2 text-right">Donations</span>
              <span className="col-span-2 text-right">Avg Donation</span>
              <span className="col-span-2 text-right">% of Total</span>
            </div>
            {(() => {
              const totalRevenue = campaignBreakdown.reduce((s, c) => s + c.revenue, 0);
              return campaignBreakdown.map((c) => (
                <div
                  key={c.campaignId}
                  className="grid grid-cols-12 gap-2 px-5 py-3 border-b last:border-b-0 border-border/50 hover:bg-accent"
                >
                  <div className="col-span-4 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {c.campaignTitle}
                    </p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm font-bold text-[#1B4332] dark:text-emerald-400">
                      ${c.revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm text-foreground">{c.count}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm text-muted-foreground">${c.avgDonation.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2 text-right">
                    <p className="text-sm text-muted-foreground">
                      {totalRevenue > 0
                        ? `${((c.revenue / totalRevenue) * 100).toFixed(1)}%`
                        : "--"}
                    </p>
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* Channel Attribution (in-house UTM tracking) */}
        {conversionStats && conversionStats.channels.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-[#1B4332] dark:text-emerald-400" />
                <h2 className="text-sm font-semibold text-foreground">
                  Traffic Channels
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Attribution based on UTM parameters and referrer tracking.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-4 px-5 py-3 bg-muted border-b border-border text-xs text-muted-foreground uppercase tracking-wide font-medium">
              <span>Channel</span>
              <span className="text-right">Visitors</span>
              <span className="text-right">Converted</span>
              <span className="text-right">Conv. Rate</span>
            </div>
            {conversionStats.channels.map((ch) => (
              <div
                key={ch.name}
                className="grid grid-cols-4 gap-4 px-5 py-3 border-b last:border-b-0 border-border/50 hover:bg-accent"
              >
                <span className="text-sm font-medium text-foreground truncate capitalize">
                  {ch.name}
                </span>
                <span className="text-sm text-right text-foreground">
                  {ch.visitors.toLocaleString()}
                </span>
                <span className="text-sm text-right text-[#1B4332] dark:text-emerald-400 font-medium">
                  {ch.converted.toLocaleString()}
                </span>
                <span className="text-sm text-right text-muted-foreground">
                  {ch.conversionRate.toFixed(1)}%
                </span>
              </div>
            ))}
            <div className="grid grid-cols-4 gap-4 px-5 py-3 bg-muted border-t border-border font-semibold">
              <span className="text-sm text-foreground">Total</span>
              <span className="text-sm text-right text-foreground">
                {conversionStats.totalVisitors.toLocaleString()}
              </span>
              <span className="text-sm text-right text-[#1B4332] dark:text-emerald-400">
                {conversionStats.totalConverted.toLocaleString()}
              </span>
              <span className="text-sm text-right text-foreground">
                {conversionStats.conversionRate.toFixed(1)}%
              </span>
            </div>
          </div>
        )}



        {/* =========== ATTRIBUTION & ORDERS SECTION =========== */}

        <div className="border-t border-border pt-8">
          <h2 className="text-xl font-bold text-foreground mb-1">
            Attribution & Orders
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Order-level attribution with customer journey data from Triple Whale Pixel.
          </p>

          {/* Attribution error */}
          {attrError && !attrLoading && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {attrError}
              </p>
              <Button
                onClick={() => fetchAttribution(1)}
                size="sm"
                className="bg-[#1B4332] hover:bg-[#15362a] text-white cursor-pointer mt-3"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Attribution loading */}
          {attrLoading && !attrHasFetched && (
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
              </div>
              <Skeleton className="h-64 rounded-xl" />
            </div>
          )}

          {/* Attribution data */}
          {attrHasFetched && (
            <div className={cn("space-y-6", attrLoading && "opacity-60 pointer-events-none")}>
              {/* Quick stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Attributed Orders
                    </p>
                    <div className="w-9 h-9 rounded-full bg-[#1B4332]/10 dark:bg-[#1B4332]/30 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-[#1B4332] dark:text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {orders.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Page {page} of {totalPages}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Total Revenue (page)
                    </p>
                    <div className="w-9 h-9 rounded-full bg-[#1B4332]/10 dark:bg-[#1B4332]/30 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-[#1B4332] dark:text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-[#1B4332] dark:text-emerald-400">
                    {fmtMoney(orders.reduce((s, o) => s + o.revenue, 0))}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Channels Tracked
                    </p>
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Route className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {Object.keys(channelSummary).length}
                  </p>
                </div>
              </div>

              {/* Channel + Source breakdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SummaryTable title="Channel Breakdown" data={channelSummary} />
                <SummaryTable title="Source Breakdown" data={sourceSummary} />
              </div>

              {/* Orders table */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-3">
                  Attributed Orders
                </h3>
                {orders.length === 0 ? (
                  <div className="rounded-xl border border-border bg-card p-8 text-center">
                    <ShoppingCart className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No attributed orders found for this date range.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="grid grid-cols-6 gap-3 px-5 py-3 bg-muted border-b border-border text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      <span>Order ID</span>
                      <span>Date</span>
                      <span className="text-right">Revenue</span>
                      <span>Channel</span>
                      <span>Customer</span>
                      <span className="text-right">Journey</span>
                    </div>
                    {orders.map((order, idx) => (
                      <OrderRow key={order.orderId || idx} order={order} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="ghost"
                      disabled={page <= 1 || attrLoading}
                      onClick={() => fetchAttribution(page - 1)}
                      className="border border-border bg-card cursor-pointer h-9"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      disabled={page >= totalPages || attrLoading}
                      onClick={() => fetchAttribution(page + 1)}
                      className="border border-border bg-card cursor-pointer h-9"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Raw attribution data toggle */}
              <div>
                <button
                  onClick={() => setShowAttrRaw(!showAttrRaw)}
                  className="text-xs text-muted-foreground hover:text-muted-foreground underline cursor-pointer"
                >
                  {showAttrRaw ? "Hide raw attribution response" : "Show raw attribution response"}
                </button>
                {showAttrRaw && attrRawData && (
                  <pre className="mt-2 p-4 bg-muted border border-border rounded-lg text-xs text-muted-foreground overflow-auto max-h-96">
                    {JSON.stringify(attrRawData, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
