import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useUserRole } from "@/hooks/use-user-role.ts";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  CalendarIcon,
  ExternalLink,
  Pencil,
  Save,
  X,
  Receipt,
  Star,
  Crown,
  Users,
  Shield,
  Bitcoin,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils.ts";
import type { DateRange } from "react-day-picker";
import {
  ALL_PERMISSIONS,
  DEFAULT_EMPLOYEE_PERMISSIONS,
  PERMISSION_LABELS,
} from "@/convex/permissions.ts";
import type { Permission } from "@/convex/permissions.ts";

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

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  pending_launch: "bg-amber-100 text-amber-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_launch: "Pending Launch",
  published: "Launched",
  archived: "Archived",
};

type PrestigeTierInfo = {
  label: string;
  baseSalary: number;
  commissionRate: number;
  bgClass: string;
  textClass: string;
  badgeClass: string;
};

const PRESTIGE_TIERS: Record<number, PrestigeTierInfo> = {
  1: { label: "Prestige 1",     baseSalary: 100,  commissionRate: 0.2,  bgClass: "bg-slate-100",   textClass: "text-slate-700",   badgeClass: "bg-slate-100 text-slate-700" },
  2: { label: "Prestige 2", baseSalary: 150,  commissionRate: 0.5,  bgClass: "bg-blue-100",    textClass: "text-blue-700",    badgeClass: "bg-blue-100 text-blue-700" },
  3: { label: "Prestige 3", baseSalary: 250,  commissionRate: 1.0,  bgClass: "bg-purple-100",  textClass: "text-purple-700",  badgeClass: "bg-purple-100 text-purple-700" },
  4: { label: "Prestige 4", baseSalary: 500,  commissionRate: 2.5,  bgClass: "bg-amber-100",   textClass: "text-amber-700",   badgeClass: "bg-amber-100 text-amber-700" },
  5: { label: "Prestige 5", baseSalary: 1500, commissionRate: 3.9,  bgClass: "bg-emerald-100", textClass: "text-emerald-700", badgeClass: "bg-emerald-100 text-emerald-700" },
};

function getCurrentFriday(): Date {
  const now = new Date();
  const day = now.getDay();
  const daysSinceFriday = (day + 2) % 7;
  const friday = new Date(now);
  friday.setDate(friday.getDate() - daysSinceFriday);
  friday.setHours(0, 0, 0, 0);
  return friday;
}

export default function StaffDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { isAdmin, hasPermission } = useUserRole();

  const detail = useQuery(
    api.staff.getDetail,
    userId ? { userId: userId as Id<"users"> } : "skip",
  );

  const defaultFrom = getCurrentFriday();
  const defaultTo = new Date(defaultFrom);
  defaultTo.setDate(defaultTo.getDate() + 6);

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    return { from: startOfDay(today), to: endOfDay(today) };
  });

  const startDate = dateRange.from ? dateRange.from.toISOString() : undefined;
  const endDate = dateRange.to ? dateRange.to.toISOString() : undefined;

  const prestige = useQuery(
    api.prestige.getPrestigeForUser,
    userId ? { userId: userId as Id<"users"> } : "skip",
  );

  const updateStaff = useMutation(api.staff.updateStaff);
  const updatePermissions = useMutation(api.staff.updatePermissions);

  // Revenue data for this employee (date-filtered)
  const employeeRevenue = useQuery(
    api.revenue.getByEmployeeDetailed,
    userId ? { userId: userId as Id<"users">, startDate, endDate } : "skip",
  );

  const [activePreset, setActivePreset] = useState<string | null>("Today");

  const applyPreset = (preset: DatePreset) => {
    setDateRange(preset.getRange());
    setActivePreset(preset.label);
  };

  // Edit state — used by both the Settings tab and the quick-edit dialog
  const [editing, setEditing] = useState(false);
  const [quickEditOpen, setQuickEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPrestigeLevel, setEditPrestigeLevel] = useState("1");
  const [editCumulativeEarnings, setEditCumulativeEarnings] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Permissions edit state
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [editPerms, setEditPerms] = useState<Permission[]>([]);
  const [isSavingPerms, setIsSavingPerms] = useState(false);

  if (detail === undefined) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (detail === null) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/portal/staff")}
          className="mb-4 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Staff
        </Button>
        <p className="text-sm text-muted-foreground">Staff member not found or you don't have access.</p>
      </div>
    );
  }

  const populateEditFields = () => {
    setEditName(detail.name);
    setEditPrestigeLevel(detail.prestige?.prestigeLevel?.toString() ?? "1");
    setEditCumulativeEarnings(detail.prestige?.cumulativeEarnings?.toString() ?? "0");
  };

  const startEditing = () => {
    populateEditFields();
    setEditing(true);
  };

  const openQuickEdit = () => {
    populateEditFields();
    setQuickEditOpen(true);
  };

  const handleSave = async () => {
    const level = parseInt(editPrestigeLevel);
    const cumulative = parseFloat(editCumulativeEarnings);

    if (isNaN(level) || level < 1 || level > 5) {
      toast.error("Please select a valid prestige level (1–5)");
      return;
    }
    if (isNaN(cumulative)) {
      toast.error("Please enter a valid cumulative earnings amount");
      return;
    }

    setIsSaving(true);
    try {
      await updateStaff({
        userId: detail._id,
        name: editName.trim() || undefined,
        prestigeLevel: level,
        cumulativeEarnings: cumulative,
      });
      toast.success("Staff member updated");
      setEditing(false);
      setQuickEditOpen(false);
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to update staff member");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const tierInfo = prestige ? (PRESTIGE_TIERS[prestige.prestigeLevel] ?? PRESTIGE_TIERS[1]) : null;

  const donorsToNext = prestige?.donorsToNextTier ?? 0;
  const donorsRemaining = prestige?.donorsRemaining ?? 0;
  const progressPercent =
    prestige && donorsToNext > 0
      ? Math.min(100, Math.round(((donorsToNext - donorsRemaining) / donorsToNext) * 100))
      : prestige && !prestige.nextTier
      ? 100
      : 0;

  const initials = detail.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-4xl mx-auto">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/portal/staff")}
        className="mb-4 cursor-pointer text-foreground hover:bg-accent"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Staff
      </Button>

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden",
            detail.avatarUrl
              ? ""
              : detail.role === "admin"
              ? "bg-[#1B4332] text-white"
              : "bg-muted text-muted-foreground",
          )}
        >
          {detail.avatarUrl ? (
            <img src={detail.avatarUrl} alt={detail.name} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground truncate">{detail.name}</h1>
          <p className="text-sm text-muted-foreground">{detail.email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {tierInfo && detail.role !== "admin" && (
            <Badge className={cn("shrink-0", tierInfo.badgeClass)}>
              <Star className="w-3 h-3 mr-1" />
              {tierInfo.label}
            </Badge>
          )}
          <Badge
            className={cn(
              "shrink-0",
              detail.role === "admin"
                ? "bg-[#1B4332]/10 dark:bg-[#1B4332]/30 text-[#1B4332] dark:text-emerald-400"
                : "bg-blue-100 text-blue-800",
            )}
          >
            {detail.role === "admin" ? "Admin" : "Employee"}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={detail.role === "admin" ? "campaigns" : "dashboard"} className="space-y-6">
        <TabsList className="bg-card border border-border">
          {detail.role !== "admin" && (
            <TabsTrigger value="dashboard" className="cursor-pointer data-[state=active]:bg-[#1B4332] data-[state=active]:text-white">Dashboard</TabsTrigger>
          )}
          <TabsTrigger value="campaigns" className="cursor-pointer data-[state=active]:bg-[#1B4332] data-[state=active]:text-white">Campaigns</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="settings" className="cursor-pointer data-[state=active]:bg-[#1B4332] data-[state=active]:text-white">Settings</TabsTrigger>
          )}
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Edit button - admin only */}
          {isAdmin && (
          <div className="flex items-center justify-between">
            <Button
              size="sm"
              className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
              onClick={openQuickEdit}
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit Pay & Prestige
            </Button>
          </div>
          )}

          {/* Payout Details card */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Payout Details</p>
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-amber-700" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5 shrink-0"><Bitcoin className="w-3.5 h-3.5" /> BTC Address</span>
                <span className="text-sm font-medium text-foreground break-all text-right">
                  {detail.bitcoinAddress || "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5 shrink-0"><Wallet className="w-3.5 h-3.5" /> USDT (TRC20)</span>
                <span className="text-sm font-medium text-foreground break-all text-right">
                  {detail.usdtTrc20Address || "Not set"}
                </span>
              </div>
            </div>
          </div>

          {/* Prestige summary cards */}
          {prestige === undefined && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          )}

          {prestige === null && (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Crown className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No prestige record found for this staff member.</p>
              {isAdmin && (
                <Button
                  size="sm"
                  className="mt-3 bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                  onClick={openQuickEdit}
                >
                  Set up Prestige
                </Button>
              )}
            </div>
          )}

          {prestige && tierInfo && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Prestige Level */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Prestige Tier</p>
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", tierInfo.bgClass)}>
                      <Crown className={cn("w-4 h-4", tierInfo.textClass)} />
                    </div>
                  </div>
                  <p className={cn("text-3xl font-bold", tierInfo.textClass)}>
                    {tierInfo.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Level {prestige.prestigeLevel} · ${tierInfo.baseSalary}/wk base
                  </p>
                </div>

                {/* Commission */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Commission</p>
                    <div className="w-9 h-9 rounded-full bg-[#1B4332]/10 dark:bg-[#1B4332]/30 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-[#1B4332] dark:text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-[#1B4332] dark:text-emerald-400">
                    ${prestige.commissionEarned.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tierInfo.commissionRate}% rate · ${prestige.totalDonationAmount.toLocaleString()} donated
                  </p>
                </div>

                {/* Unique Donors */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Unique Donors</p>
                    <div className="w-9 h-9 rounded-full bg-[#1B4332]/10 dark:bg-[#1B4332]/30 flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#1B4332] dark:text-emerald-400" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {prestige.uniqueDonorCount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {prestige.nextTier
                      ? `${donorsRemaining} more to ${prestige.nextTier.name}`
                      : "Max tier reached"}
                  </p>
                </div>
              </div>

              {/* Progress to next tier */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {prestige.nextTier ? `Progress to ${prestige.nextTier.name}` : "Max Tier Reached"}
                    </p>
                    <p className="text-sm font-medium text-foreground mt-0.5">
                      {prestige.nextTier
                        ? `${prestige.uniqueDonorCount} / ${prestige.uniqueDonorCount + donorsRemaining} unique donors`
                        : "Congratulations — top prestige!"}
                    </p>
                  </div>
                  <Badge className={tierInfo.badgeClass}>
                    <Star className="w-3 h-3 mr-1" />
                    {tierInfo.label}
                  </Badge>
                </div>
                <Progress value={progressPercent} className="h-2.5" />
                {prestige.nextTier && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {donorsRemaining} donor{donorsRemaining !== 1 ? "s" : ""} remaining
                  </p>
                )}
              </div>

              {/* Cumulative earnings */}
              {prestige.cumulativeEarnings > 0 && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Total Earnings (All-Time)
                      </p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        ${prestige.cumulativeEarnings.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  {prestige.earningsSince && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Since {format(new Date(prestige.earningsSince), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Revenue section date filters */}
          <div className="flex flex-wrap items-center gap-2 justify-end pt-2">
            <p className="text-xs text-muted-foreground mr-auto font-medium uppercase tracking-wide">Revenue Period</p>
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
                        {format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d, yyyy")}
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
          </div>

          {/* Donation Revenue card */}
          {employeeRevenue !== undefined && (
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Donation Revenue
                </p>
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-emerald-700" />
                </div>
              </div>
              <p className="text-3xl font-bold text-emerald-700">
                ${employeeRevenue.totalAmount.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {employeeRevenue.donationCount} donation{employeeRevenue.donationCount !== 1 ? "s" : ""} across {employeeRevenue.campaigns.filter((c) => c.donationCount > 0).length} campaign{employeeRevenue.campaigns.filter((c) => c.donationCount > 0).length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
          {employeeRevenue === undefined && (
            <Skeleton className="h-32" />
          )}
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-3">
          {/* Date filter for campaigns revenue context */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
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
                        {format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d, yyyy")}
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
          </div>

          {detail.campaigns.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {detail.name} hasn't created any campaigns yet.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {detail.campaigns.length} campaign{detail.campaigns.length !== 1 ? "s" : ""} total
              </p>
              {detail.campaigns.map((campaign) => {
                const campaignRevenue = employeeRevenue?.campaigns.find(
                  (r) => r.campaignId === campaign._id,
                );
                return (
                  <div
                    key={campaign._id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow cursor-pointer"
                    onClick={() => navigate(`/portal/campaigns/${campaign._id}`)}
                  >
                    {campaign.imageUrl ? (
                      <img
                        src={campaign.imageUrl}
                        alt={campaign.title}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <span className="text-xl">📢</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-foreground truncate">{campaign.title}</h3>
                        <Badge
                          className={cn(
                            "shrink-0 text-xs capitalize",
                            STATUS_STYLES[campaign.status] ?? "",
                          )}
                        >
                          {STATUS_LABELS[campaign.status] ?? campaign.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        Goal: ${campaign.goalAmount.toLocaleString()} · Raised: $
                        {campaign.currentAmount.toLocaleString()}
                      </p>
                      {campaignRevenue && campaignRevenue.donationCount > 0 && (
                        <p className="text-xs text-emerald-700 font-medium mt-0.5">
                          Revenue: ${campaignRevenue.totalAmount.toLocaleString()} from {campaignRevenue.donationCount} donation{campaignRevenue.donationCount !== 1 ? "s" : ""}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Created {format(new Date(campaign._creationTime), "MMM d, yyyy")}
                      </p>
                    </div>
                    {(campaign.status === "published" || campaign.status === "pending_launch") && (
                      <a
                        href={`/campaign/${campaign.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 p-2 hover:bg-accent rounded-lg"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          {/* Staff Settings card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-foreground">Staff Settings</h3>
              {!editing ? (
                <Button
                  size="sm"
                  onClick={startEditing}
                  className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setEditing(false)}
                    className="bg-muted hover:bg-accent text-foreground cursor-pointer"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={isSaving}
                    onClick={handleSave}
                    className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="editName" className="text-foreground">Full Name</Label>
                  <Input
                    id="editName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-card border-border text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-foreground">Email</Label>
                  <Input value={detail.email} disabled className="bg-muted border-border text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                {detail.role !== "admin" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="editPrestigeLevel" className="text-foreground">Prestige Level</Label>
                      <Select value={editPrestigeLevel} onValueChange={setEditPrestigeLevel}>
                        <SelectTrigger id="editPrestigeLevel" className="bg-card border-border text-foreground cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PRESTIGE_TIERS).map(([level, info]) => (
                            <SelectItem key={level} value={level} className="cursor-pointer">
                              {level} — {info.label} (${info.baseSalary}/wk, {info.commissionRate}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="editCumulative" className="text-foreground">Cumulative Earnings ($)</Label>
                      <Input
                        id="editCumulative"
                        type="number"
                        value={editCumulativeEarnings}
                        onChange={(e) => setEditCumulativeEarnings(e.target.value)}
                        className="bg-card border-border text-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Name</p>
                    <p className="text-sm font-medium text-foreground">{detail.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Email</p>
                    <p className="text-sm font-medium text-foreground">{detail.email}</p>
                  </div>
                </div>
                {detail.role !== "admin" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Prestige Level</p>
                      <p className="text-sm font-medium text-foreground">
                        {detail.prestige?.prestigeLevel != null
                          ? `Level ${detail.prestige.prestigeLevel} — ${PRESTIGE_TIERS[detail.prestige.prestigeLevel]?.label ?? "Unknown"}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Base Salary</p>
                      <p className="text-sm font-medium text-foreground">
                        {detail.prestige?.prestigeLevel != null
                          ? `$${PRESTIGE_TIERS[detail.prestige.prestigeLevel]?.baseSalary ?? "—"}/wk`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Commission Rate</p>
                      <p className="text-sm font-medium text-foreground">
                        {detail.prestige?.prestigeLevel != null
                          ? `${PRESTIGE_TIERS[detail.prestige.prestigeLevel]?.commissionRate ?? "—"}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cumulative</p>
                      <p className="text-sm font-medium text-foreground">
                        ${(detail.prestige?.cumulativeEarnings ?? 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Permissions card for employees */}
          {detail.role !== "admin" && (
            <PermissionsCard
              detail={detail}
              editingPermissions={editingPermissions}
              setEditingPermissions={setEditingPermissions}
              editPerms={editPerms}
              setEditPerms={setEditPerms}
              isSavingPerms={isSavingPerms}
              onSave={async () => {
                setIsSavingPerms(true);
                try {
                  await updatePermissions({
                    userId: detail._id,
                    permissions: editPerms,
                  });
                  toast.success("Permissions updated");
                  setEditingPermissions(false);
                } catch (error) {
                  if (error instanceof ConvexError) {
                    const data = error.data as { message: string };
                    toast.error(data.message);
                  } else {
                    toast.error("Failed to update permissions");
                  }
                } finally {
                  setIsSavingPerms(false);
                }
              }}
            />
          )}

          {/* Prestige tier info for employees */}
          {detail.role !== "admin" && (
            <>
              {prestige === undefined && <Skeleton className="h-60" />}

              {prestige === null && (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">No prestige record. Edit settings above to set one up.</p>
                </div>
              )}

              {prestige && tierInfo && (
                <div className="rounded-xl border border-border bg-card p-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Prestige Tier Details</h3>
                    <Badge className={tierInfo.badgeClass}>
                      <Crown className="w-3 h-3 mr-1" />
                      {tierInfo.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Tier breakdown */}
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Tier Info</p>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Prestige Level</span>
                        <span className="text-sm font-medium text-foreground">{prestige.prestigeLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Tier Name</span>
                        <span className="text-sm font-medium text-foreground">{prestige.tierName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Base Salary</span>
                        <span className="text-sm font-medium text-foreground">${prestige.baseSalary}/wk</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Commission Rate</span>
                        <span className="text-sm font-medium text-foreground">{(prestige.commissionRate * 100).toFixed(1).replace(/\.0$/, "")}%</span>
                      </div>
                    </div>

                    {/* Earnings & donors */}
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Performance</p>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Commission Earned</span>
                        <span className="text-sm font-medium text-[#1B4332] dark:text-emerald-400">${prestige.commissionEarned.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Donations</span>
                        <span className="text-sm font-medium text-foreground">${prestige.totalDonationAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Unique Donors</span>
                        <span className="text-sm font-medium text-foreground">{prestige.uniqueDonorCount}</span>
                      </div>
                      {prestige.nextTier && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Donors to Next Tier</span>
                          <span className="text-sm font-medium text-foreground">{donorsRemaining}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* All-time earnings */}
                  {prestige.cumulativeEarnings > 0 && (
                    <div className="border-t border-border pt-4 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">All-Time Earnings</p>
                        <p className="text-2xl font-bold text-foreground mt-1">${prestige.cumulativeEarnings.toLocaleString()}</p>
                      </div>
                      {prestige.earningsSince && (
                        <p className="text-xs text-muted-foreground">Since {format(new Date(prestige.earningsSince), "MMM d, yyyy")}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick-edit dialog */}
      <Dialog open={quickEditOpen} onOpenChange={setQuickEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pay & Prestige</DialogTitle>
            <DialogDescription>
              Update {detail.name}'s prestige level and earnings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="qePrestige">Prestige Level</Label>
              <Select value={editPrestigeLevel} onValueChange={setEditPrestigeLevel}>
                <SelectTrigger id="qePrestige" className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRESTIGE_TIERS).map(([level, info]) => (
                    <SelectItem key={level} value={level} className="cursor-pointer">
                      {level} — {info.label} (${info.baseSalary}/wk, {info.commissionRate}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="qeCumulative">Cumulative Earnings ($)</Label>
              <Input
                id="qeCumulative"
                type="number"
                value={editCumulativeEarnings}
                onChange={(e) => setEditCumulativeEarnings(e.target.value)}
                placeholder="e.g. 5000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setQuickEditOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              disabled={isSaving}
              onClick={handleSave}
              className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
            >
              <Save className="w-4 h-4 mr-1.5" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Permissions editing card for the Settings tab.
 */
function PermissionsCard({
  detail,
  editingPermissions,
  setEditingPermissions,
  editPerms,
  setEditPerms,
  isSavingPerms,
  onSave,
}: {
  detail: { permissions: string[] | null };
  editingPermissions: boolean;
  setEditingPermissions: (v: boolean) => void;
  editPerms: Permission[];
  setEditPerms: (v: Permission[]) => void;
  isSavingPerms: boolean;
  onSave: () => void;
}) {
  const currentPerms = (detail.permissions ?? DEFAULT_EMPLOYEE_PERMISSIONS) as Permission[];

  const startEditingPerms = () => {
    setEditPerms([...currentPerms]);
    setEditingPermissions(true);
  };

  const togglePerm = (perm: Permission) => {
    setEditPerms(
      editPerms.includes(perm)
        ? editPerms.filter((p) => p !== perm)
        : [...editPerms, perm],
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Permissions
        </h3>
        {!editingPermissions ? (
          <Button
            size="sm"
            onClick={startEditingPerms}
            className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
          >
            <Pencil className="w-4 h-4 mr-1" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => setEditingPermissions(false)}
              className="bg-muted hover:bg-accent text-foreground cursor-pointer"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isSavingPerms}
              onClick={onSave}
              className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
            >
              <Save className="w-4 h-4 mr-1" />
              {isSavingPerms ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      {editingPermissions ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ALL_PERMISSIONS.map((permission) => (
            <label
              key={permission}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                editPerms.includes(permission)
                  ? "border-[#1B4332] bg-[#1B4332]/5"
                  : "border-border hover:border-muted-foreground",
              )}
            >
              <Checkbox
                checked={editPerms.includes(permission)}
                onCheckedChange={() => togglePerm(permission)}
                className="cursor-pointer"
              />
              <span className="text-sm text-foreground">
                {PERMISSION_LABELS[permission]}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {ALL_PERMISSIONS.map((permission) => {
            const hasAccess = currentPerms.includes(permission);
            return (
              <Badge
                key={permission}
                className={cn(
                  "text-xs",
                  hasAccess
                    ? "bg-[#1B4332]/10 dark:bg-[#1B4332]/30 text-[#1B4332] dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {PERMISSION_LABELS[permission]}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
