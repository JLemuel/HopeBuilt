import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.tsx";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Download,
  Receipt,
  DollarSign,
  User,
  Search,
  ArrowUpDown,
  CalendarIcon,
  Trophy,
  Crown,
  SlidersHorizontal,
  X,
  Repeat,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty.tsx";
import type { DateRange } from "react-day-picker";

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

type SortField = "date" | "amount" | "name";
type SortDir = "asc" | "desc";
type AmountOp = "any" | "gt" | "gte" | "lt" | "lte" | "eq";

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
  {
    label: "Last 90 days",
    getRange: () => ({
      from: startOfDay(subDays(new Date(), 89)),
      to: endOfDay(new Date()),
    }),
  },
];

const AMOUNT_OP_LABELS: Record<AmountOp, string> = {
  any: "Any amount",
  gt: "Greater than",
  gte: "At least",
  lt: "Less than",
  lte: "At most",
  eq: "Exactly",
};

/* ------------------------------------------------------------------ */
/*  Donor leaderboard card                                             */
/* ------------------------------------------------------------------ */

function DonorLeaderboard({
  donors,
}: {
  donors: Array<{
    name: string;
    email: string;
    totalAmount: number;
    count: number;
    lastDonation: string;
  }>;
}) {
  if (donors.length === 0) return null;

  const rankColors = [
    "bg-amber-100 text-amber-700",
    "bg-gray-100 text-gray-600",
    "bg-orange-100 text-orange-700",
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <Trophy className="w-4 h-4 text-amber-600" />
        <h2 className="text-sm font-semibold text-foreground">Top Donors</h2>
      </div>
      <div className="divide-y divide-border">
        {donors.slice(0, 10).map((donor, idx) => (
          <div
            key={donor.email || donor.name}
            className="flex items-center gap-4 px-5 py-3 hover:bg-accent"
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                idx < 3 ? rankColors[idx] : "bg-muted text-muted-foreground",
              )}
            >
              {idx === 0 ? <Crown className="w-3.5 h-3.5" /> : idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {donor.name || "Anonymous"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {donor.email || "No email"} · {donor.count} donation
                {donor.count !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-[#1B4332]">
                ${donor.totalAmount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                Last:{" "}
                {(() => {
                  try {
                    return format(new Date(donor.lastDonation), "MMM d");
                  } catch {
                    return "--";
                  }
                })()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DonorsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const campaignIdParam = searchParams.get("campaign");

  const donations = useQuery(
    api.donations.listAll,
    campaignIdParam
      ? { campaignId: campaignIdParam as Id<"campaigns"> }
      : {},
  );

  // Fetch campaigns for the campaign dropdown
  const campaigns = useQuery(api.campaigns.list, {});

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    return { from: startOfDay(today), to: endOfDay(today) };
  });
  const [activePreset, setActivePreset] = useState<string | null>("Today");

  // Filter state
  const [activeModal, setActiveModal] = useState<"revenue" | "donations" | "donors" | null>(null);

  const [filterCampaignId, setFilterCampaignId] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>(() => {
    const typeParam = searchParams.get("type");
    if (typeParam === "onetime" || typeParam === "monthly") return typeParam;
    return "all";
  });
  const [amountOp, setAmountOp] = useState<AmountOp>("any");
  const [amountValue, setAmountValue] = useState("");
  const [showFilters, setShowFilters] = useState(() => {
    // Auto-open filters if a type param was passed via URL
    const typeParam = searchParams.get("type");
    return typeParam === "onetime" || typeParam === "monthly";
  });

  const clearCampaignFilter = () => {
    searchParams.delete("campaign");
    setSearchParams(searchParams);
  };

  // Leaderboard query based on date range
  const startISO = dateRange.from
    ? startOfDay(dateRange.from).toISOString()
    : undefined;
  const endISO = dateRange.to
    ? endOfDay(dateRange.to).toISOString()
    : undefined;

  const leaderboard = useQuery(api.analytics.getDonorLeaderboard, {
    startDate: startISO,
    endDate: endISO,
    limit: 10,
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const applyPreset = (preset: DatePreset) => {
    setDateRange(preset.getRange());
    setActivePreset(preset.label);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCampaignId !== "all") count++;
    if (filterType !== "all") count++;
    if (amountOp !== "any" && amountValue !== "") count++;
    return count;
  }, [filterCampaignId, filterType, amountOp, amountValue]);

  const clearAllFilters = () => {
    setFilterCampaignId("all");
    setFilterType("all");
    setAmountOp("any");
    setAmountValue("");
    setSearch("");
  };

  const handleExport = () => {
    if (!donations || donations.length === 0) {
      toast.error("No donations to export.");
      return;
    }
    const exportData = getFilteredDonations();
    const header =
      "Donor Name,Email,Amount,Currency,Campaign,Type,Date,Receipt ID";
    const rows = exportData.map((d) => {
      const date = d.completedAt
        ? format(new Date(d.completedAt), "yyyy-MM-dd HH:mm")
        : "";
      const name = d.donorName.includes(",")
        ? `"${d.donorName}"`
        : d.donorName;
      const campaign = d.campaignTitle.includes(",")
        ? `"${d.campaignTitle}"`
        : d.campaignTitle;
      return `${name},${d.donorEmail},${d.amount},${d.currency},${campaign},${d.donationType ?? "onetime"},${date},${d.receiptId ?? ""}`;
    });
    const csv = [
      `# Donors Export`,
      `# Exported: ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
      "",
      header,
      ...rows,
    ].join("\n");
    downloadCsv(csv, `donors-${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast.success(`Exported ${exportData.length} donations!`);
  };

  const getFilteredDonations = () => {
    if (!donations) return [];
    const searchLower = search.toLowerCase();
    const parsedAmount = parseFloat(amountValue);

    return donations.filter((d) => {
      // Text search
      const matchesSearch =
        !search ||
        d.donorName.toLowerCase().includes(searchLower) ||
        d.donorEmail.toLowerCase().includes(searchLower) ||
        d.campaignTitle.toLowerCase().includes(searchLower);

      // Date range filter
      let matchesDate = true;
      if (dateRange.from && d.completedAt) {
        matchesDate =
          d.completedAt >= startOfDay(dateRange.from).toISOString();
      }
      if (matchesDate && dateRange.to && d.completedAt) {
        matchesDate = d.completedAt <= endOfDay(dateRange.to).toISOString();
      }

      // Campaign filter
      const matchesCampaign =
        filterCampaignId === "all" ||
        d.campaignId === filterCampaignId;

      // Donation type filter
      const donationType = d.donationType ?? "onetime";
      const matchesType =
        filterType === "all" || donationType === filterType;

      // Amount filter
      let matchesAmount = true;
      if (amountOp !== "any" && !isNaN(parsedAmount)) {
        switch (amountOp) {
          case "gt":
            matchesAmount = d.amount > parsedAmount;
            break;
          case "gte":
            matchesAmount = d.amount >= parsedAmount;
            break;
          case "lt":
            matchesAmount = d.amount < parsedAmount;
            break;
          case "lte":
            matchesAmount = d.amount <= parsedAmount;
            break;
          case "eq":
            matchesAmount = d.amount === parsedAmount;
            break;
        }
      }

      return (
        matchesSearch &&
        matchesDate &&
        matchesCampaign &&
        matchesType &&
        matchesAmount
      );
    });
  };

  if (donations === undefined) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const filtered = getFilteredDonations();

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortField) {
      case "amount":
        return (a.amount - b.amount) * dir;
      case "name":
        return a.donorName.localeCompare(b.donorName) * dir;
      case "date":
      default:
        return (
          ((a.completedAt ?? "").localeCompare(b.completedAt ?? "")) * dir
        );
    }
  });

  const totalAmount = filtered.reduce((sum, d) => sum + d.amount, 0);
  const uniqueDonors = new Set(
    filtered.map((d) => d.donorEmail || d.donorName),
  ).size;

  // Revenue breakdown by campaign for the modal
  const revenueByCampaign = (() => {
    const map = new Map<string, { campaignId: string; campaignTitle: string; total: number; count: number; donors: Set<string> }>();
    for (const d of filtered) {
      const key = d.campaignId ?? "unknown";
      const existing = map.get(key);
      if (existing) {
        existing.total += d.amount;
        existing.count += 1;
        existing.donors.add(d.donorEmail || d.donorName);
      } else {
        map.set(key, {
          campaignId: key,
          campaignTitle: d.campaignTitle,
          total: d.amount,
          count: 1,
          donors: new Set([d.donorEmail || d.donorName]),
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  })();

  // Donations breakdown by type for the modal
  const donationsByType = (() => {
    let oneTimeCount = 0;
    let oneTimeTotal = 0;
    let monthlyCount = 0;
    let monthlyTotal = 0;
    for (const d of filtered) {
      if (d.donationType === "monthly") {
        monthlyCount++;
        monthlyTotal += d.amount;
      } else {
        oneTimeCount++;
        oneTimeTotal += d.amount;
      }
    }
    return { oneTimeCount, oneTimeTotal, monthlyCount, monthlyTotal };
  })();

  // Monthly recurring subscription forecast
  const subscriptionForecast = (() => {
    // Gather unique monthly subscribers by email, with their latest (most recent) donation amount
    const subscriberMap = new Map<string, { amount: number; name: string; latestDate: string }>();
    for (const d of filtered) {
      if (d.donationType !== "monthly") continue;
      const key = d.donorEmail || d.donorName;
      const existing = subscriberMap.get(key);
      if (!existing || (d.completedAt ?? "") > existing.latestDate) {
        subscriberMap.set(key, {
          amount: d.amount,
          name: d.donorName || "Anonymous",
          latestDate: d.completedAt ?? "",
        });
      }
    }
    const subscribers = Array.from(subscriberMap.values());
    const activeCount = subscribers.length;
    const monthlyMRR = subscribers.reduce((sum, s) => sum + s.amount, 0);
    const avgDonation = activeCount > 0 ? monthlyMRR / activeCount : 0;
    return {
      activeCount,
      monthlyMRR,
      avgDonation,
    };
  })();

  // Unique donors list for the modal
  const uniqueDonorsList = (() => {
    const map = new Map<string, { name: string; email: string; total: number; count: number; campaigns: Set<string> }>();
    for (const d of filtered) {
      const key = d.donorEmail || d.donorName;
      const existing = map.get(key);
      if (existing) {
        existing.total += d.amount;
        existing.count += 1;
        existing.campaigns.add(d.campaignTitle);
      } else {
        map.set(key, {
          name: d.donorName || "Anonymous",
          email: d.donorEmail || "",
          total: d.amount,
          count: 1,
          campaigns: new Set([d.campaignTitle]),
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  })();

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Donors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {campaignIdParam
              ? "Showing donors for a specific campaign."
              : "All completed donations across every campaign."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {campaignIdParam && (
            <Button
              onClick={clearCampaignFilter}
              variant="ghost"
              className="border border-border text-muted-foreground hover:text-foreground cursor-pointer h-9 px-3"
            >
              <X className="w-4 h-4 mr-1" />
              Clear filter
            </Button>
          )}
          {donations && donations.length > 0 && (
            <Button
              onClick={handleExport}
              className="bg-[#1B4332] hover:bg-[#15362a] text-white cursor-pointer h-9 px-4"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Date presets */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
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
                <span className="text-sm">All time</span>
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
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setActiveModal("revenue")}
          className="rounded-xl border border-border bg-card p-5 text-left cursor-pointer hover:border-[#1B4332] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Revenue
            </p>
            <div className="w-8 h-8 rounded-full bg-[#1B4332]/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#1B4332]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1B4332]">
            ${totalAmount.toLocaleString()}
          </p>
        </button>
        <button
          onClick={() => setActiveModal("donations")}
          className="rounded-xl border border-border bg-card p-5 text-left cursor-pointer hover:border-[#1B4332] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Donations
            </p>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <Receipt className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {filtered.length}
          </p>
        </button>
        <button
          onClick={() => setActiveModal("donors")}
          className="rounded-xl border border-border bg-card p-5 text-left cursor-pointer hover:border-[#1B4332] hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Unique Donors
            </p>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{uniqueDonors}</p>
        </button>
      </div>

      {/* Monthly Recurring Subscription Forecast */}
      <div className="rounded-xl border border-border bg-card overflow-hidden mb-6">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Repeat className="w-4 h-4 text-[#1B4332]" />
          <h2 className="text-sm font-semibold text-foreground">
            Monthly Recurring Subscription Forecast
          </h2>
        </div>

        {subscriptionForecast.activeCount === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No monthly subscribers found in the selected period.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly recurring donations will appear here once donors subscribe.
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Top row: MRR, subscribers, avg donation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg bg-[#1B4332]/5 border border-[#1B4332]/15 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Monthly Recurring Revenue
                </p>
                <p className="text-2xl font-bold text-[#1B4332]">
                  ${subscriptionForecast.monthlyMRR.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  per month
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Active Subscribers
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {subscriptionForecast.activeCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  unique monthly donors
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                  Avg Subscription
                </p>
                <p className="text-2xl font-bold text-foreground">
                  ${subscriptionForecast.avgDonation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  per donor / month
                </p>
              </div>
            </div>


          </div>
        )}
      </div>

      {/* Revenue Breakdown Modal */}
      <Dialog open={activeModal === "revenue"} onOpenChange={(open) => { if (!open) setActiveModal(null); }}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#1B4332]" />
              Revenue Breakdown
            </DialogTitle>
            <DialogDescription>
              Total: ${totalAmount.toLocaleString()} from {filtered.length} donations
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto flex-1 -mx-6 px-6">
            {revenueByCampaign.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No revenue data to display.</p>
            ) : (
              <div className="space-y-3">
                {revenueByCampaign.map((c) => (
                  <button
                    key={c.campaignTitle}
                    onClick={() => { setActiveModal(null); navigate(`/portal/campaigns/${c.campaignId}`); }}
                    className="rounded-lg border border-border p-4 w-full text-left cursor-pointer hover:border-[#1B4332] hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-foreground truncate mr-2">{c.campaignTitle}</p>
                      <p className="text-sm font-bold text-[#1B4332] shrink-0">${c.total.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{c.count} donation{c.count !== 1 ? "s" : ""}</span>
                      <span>{c.donors.size} unique donor{c.donors.size !== 1 ? "s" : ""}</span>
                    </div>
                    {/* Revenue bar */}
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#1B4332]"
                        style={{ width: `${totalAmount > 0 ? Math.max((c.total / totalAmount) * 100, 2) : 0}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Donations Breakdown Modal */}
      <Dialog open={activeModal === "donations"} onOpenChange={(open) => { if (!open) setActiveModal(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-muted-foreground" />
              Donations Breakdown
            </DialogTitle>
            <DialogDescription>
              {filtered.length} total donations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">One-time</p>
                <p className="text-xs text-muted-foreground">{donationsByType.oneTimeCount} donation{donationsByType.oneTimeCount !== 1 ? "s" : ""}</p>
              </div>
              <p className="text-lg font-bold text-[#1B4332]">${donationsByType.oneTimeTotal.toLocaleString()}</p>
            </div>
            <div className="rounded-lg border border-[#1B4332]/20 bg-[#1B4332]/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Monthly</p>
                <p className="text-xs text-muted-foreground">{donationsByType.monthlyCount} donation{donationsByType.monthlyCount !== 1 ? "s" : ""}</p>
              </div>
              <p className="text-lg font-bold text-[#1B4332]">${donationsByType.monthlyTotal.toLocaleString()}</p>
            </div>
            {/* Campaign breakdown */}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">By Campaign</p>
              <div className="space-y-2">
                {revenueByCampaign.map((c) => (
                  <button
                    key={c.campaignTitle}
                    onClick={() => { setActiveModal(null); navigate(`/portal/campaigns/${c.campaignId}`); }}
                    className="flex items-center justify-between text-sm w-full text-left cursor-pointer hover:bg-accent rounded-md px-2 py-1.5 -mx-2 transition-colors"
                  >
                    <span className="text-foreground truncate mr-2">{c.campaignTitle}</span>
                    <span className="text-muted-foreground shrink-0">{c.count} donation{c.count !== 1 ? "s" : ""}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unique Donors Modal */}
      <Dialog open={activeModal === "donors"} onOpenChange={(open) => { if (!open) setActiveModal(null); }}>
        <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              Unique Donors
            </DialogTitle>
            <DialogDescription>
              {uniqueDonors} unique donor{uniqueDonors !== 1 ? "s" : ""} across all campaigns
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto flex-1 -mx-6 px-6">
            {uniqueDonorsList.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No donors to display.</p>
            ) : (
              <div className="divide-y divide-border">
                {uniqueDonorsList.map((donor) => (
                  <div key={donor.email || donor.name} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{donor.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{donor.email || "No email"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {Array.from(donor.campaigns).join(", ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-[#1B4332]">${donor.total.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{donor.count} donation{donor.count !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Top Donors Leaderboard */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="mb-6">
          <DonorLeaderboard donors={leaderboard} />
        </div>
      )}

      {/* Search + filters toggle */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or campaign..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border text-foreground"
          />
        </div>
        <Button
          onClick={() => setShowFilters((p) => !p)}
          className={cn(
            "h-9 px-3 cursor-pointer shrink-0",
            showFilters || activeFilterCount > 0
              ? "bg-[#1B4332] hover:bg-[#15362a] text-white"
              : "bg-card hover:bg-accent text-foreground border border-border",
          )}
        >
          <SlidersHorizontal className="w-4 h-4 mr-1.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1.5 bg-white/20 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-xl border border-border bg-card p-4 mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Filters
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-[#1B4332] hover:underline cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Amount filter */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">
                Amount ($)
              </label>
              <div className="flex gap-2">
                <Select
                  value={amountOp}
                  onValueChange={(v) => setAmountOp(v as AmountOp)}
                >
                  <SelectTrigger className="h-9 text-xs bg-card border-border cursor-pointer flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(AMOUNT_OP_LABELS) as [
                        AmountOp,
                        string,
                      ][]
                    ).map(([key, label]) => (
                      <SelectItem
                        key={key}
                        value={key}
                        className="text-xs cursor-pointer"
                      >
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {amountOp !== "any" && (
                  <Input
                    type="number"
                    placeholder="0"
                    value={amountValue}
                    onChange={(e) => setAmountValue(e.target.value)}
                    className="h-9 w-28 bg-card border-border text-foreground text-xs"
                  />
                )}
              </div>
            </div>

            {/* Campaign filter */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">
                Campaign
              </label>
              <Select
                value={filterCampaignId}
                onValueChange={setFilterCampaignId}
              >
                <SelectTrigger className="h-9 text-xs bg-card border-border cursor-pointer">
                  <SelectValue placeholder="All campaigns" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="all"
                    className="text-xs cursor-pointer"
                  >
                    All campaigns
                  </SelectItem>
                  {campaigns?.map((c) => (
                    <SelectItem
                      key={c._id}
                      value={c._id}
                      className="text-xs cursor-pointer"
                    >
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Donation type filter */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">
                Type
              </label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-9 text-xs bg-card border-border cursor-pointer">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="all"
                    className="text-xs cursor-pointer"
                  >
                    All types
                  </SelectItem>
                  <SelectItem
                    value="onetime"
                    className="text-xs cursor-pointer"
                  >
                    One-time
                  </SelectItem>
                  <SelectItem
                    value="monthly"
                    className="text-xs cursor-pointer"
                  >
                    Monthly
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {sorted.length === 0 && donations.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Receipt />
            </EmptyMedia>
            <EmptyTitle>No donations yet</EmptyTitle>
            <EmptyDescription>
              Donations will appear here once they are completed.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No donors match your filters.
          </p>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-[#1B4332] hover:underline cursor-pointer mt-2"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-muted border-b border-border text-xs text-muted-foreground uppercase tracking-wide font-medium">
            <button
              onClick={() => toggleSort("name")}
              className="col-span-3 flex items-center gap-1 cursor-pointer text-left"
            >
              Donor
              <ArrowUpDown
                className={cn(
                  "w-3 h-3",
                  sortField === "name" ? "text-foreground" : "text-muted-foreground",
                )}
              />
            </button>
            <span className="col-span-3">Campaign</span>
            <button
              onClick={() => toggleSort("amount")}
              className="col-span-2 flex items-center gap-1 cursor-pointer text-right justify-end"
            >
              Amount
              <ArrowUpDown
                className={cn(
                  "w-3 h-3",
                  sortField === "amount"
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              />
            </button>
            <span className="col-span-2 text-right">Type</span>
            <button
              onClick={() => toggleSort("date")}
              className="col-span-2 flex items-center gap-1 cursor-pointer text-right justify-end"
            >
              Date
              <ArrowUpDown
                className={cn(
                  "w-3 h-3",
                  sortField === "date" ? "text-foreground" : "text-muted-foreground",
                )}
              />
            </button>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-border max-h-[600px] overflow-auto">
            {sorted.map((d) => (
              <div
                key={d._id}
                onClick={() => navigate(`/portal/donors/${d._id}`)}
                className="grid grid-cols-12 gap-2 px-5 py-3 hover:bg-accent items-center cursor-pointer"
              >
                <div className="col-span-3 min-w-0">
                  <p className="text-sm font-medium text-[#1B4332] truncate hover:underline">
                    {d.donorName || "Anonymous"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {d.donorEmail || "No email"}
                  </p>
                </div>
                <div className="col-span-3 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {d.campaignTitle}
                  </p>
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-sm font-bold text-[#1B4332]">
                    ${d.amount.toLocaleString()}
                  </p>
                </div>
                <div className="col-span-2 text-right">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      d.donationType === "monthly"
                        ? "bg-[#1B4332]/10 text-[#1B4332]"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {d.donationType === "monthly" ? "Monthly" : "One-time"}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-xs text-muted-foreground">
                    {d.completedAt
                      ? format(new Date(d.completedAt), "MMM d, yyyy")
                      : "--"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-muted border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing {sorted.length} of {donations.length} donations
            </p>
            <p className="text-xs font-medium text-[#1B4332]">
              Total: ${totalAmount.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
