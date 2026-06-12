import { useState } from "react";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  PlusCircle,
  List,
  TrendingUp,
  DollarSign,
  CalendarIcon,
  Users,
  Trophy,
  ArrowRight,
  BarChart3,
  Heart,
  Eye,
  Percent,
  UserCircle,
  Repeat,
  Zap,
  Star,
  Crown,
  Banknote,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Calendar } from "@/components/ui/calendar.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils.ts";
import type { DateRange } from "react-day-picker";

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

/** Map prestige level to gradient colors */
function prestigeColors(level: number): { bg: string; text: string; accent: string; bar: string } {
  switch (level) {
    case 1:
      return { bg: "bg-slate-100", text: "text-slate-700", accent: "text-slate-500", bar: "bg-slate-400" };
    case 2:
      return { bg: "bg-emerald-100", text: "text-emerald-800", accent: "text-emerald-600", bar: "bg-emerald-500" };
    case 3:
      return { bg: "bg-blue-100", text: "text-blue-800", accent: "text-blue-600", bar: "bg-blue-500" };
    case 4:
      return { bg: "bg-purple-100", text: "text-purple-800", accent: "text-purple-600", bar: "bg-purple-500" };
    case 5:
      return { bg: "bg-amber-100", text: "text-amber-800", accent: "text-amber-600", bar: "bg-amber-500" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-700", accent: "text-slate-500", bar: "bg-slate-400" };
  }
}

export default function PortalDashboard() {
  const { user, isAdmin } = useUserRole();
  const navigate = useNavigate();
  const payrollOverview = useQuery(
    api.payroll.getAdminPayrollOverview,
    isAdmin ? {} : "skip",
  );

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const today = new Date();
    return { from: startOfDay(today), to: endOfDay(today) };
  });
  const [activePreset, setActivePreset] = useState<string | null>("Today");

  const applyPreset = (preset: DatePreset) => {
    setDateRange(preset.getRange());
    setActivePreset(preset.label);
  };

  // Use local-time start/end of day so "Today" matches the user's actual calendar day
  const startDate = dateRange.from
    ? startOfDay(dateRange.from).toISOString()
    : undefined;
  const endDate = dateRange.to
    ? endOfDay(dateRange.to).toISOString()
    : undefined;

  // Admin data
  const revenueOverview = useQuery(
    api.revenue.getOverview,
    isAdmin ? { startDate, endDate } : "skip",
  );
  const conversionStats = useQuery(
    api.pageViews.getConversionStats,
    isAdmin && startDate && endDate
      ? { startDate, endDate }
      : "skip",
  );

  // Employee data — prestige
  const prestige = useQuery(
    api.prestige.getMyPrestige,
    isAdmin ? "skip" : {},
  );

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto">
      {/* Welcome + date picker row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin
              ? "Manage your campaigns and track donations from here."
              : "Track your prestige, campaigns, and earnings."}
          </p>
        </div>

        {isAdmin && (
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
          </div>
        )}
      </div>

      {/* ── EMPLOYEE: Prestige Progress Bar ── */}
      {!isAdmin && (
        <div className="mb-6">
          {prestige === undefined && (
            <Skeleton className="h-44 w-full rounded-xl" />
          )}

          {prestige === null && (
            <div className="rounded-xl border border-border bg-card p-8 text-center">
              <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No prestige tier has been assigned to your account yet.
              </p>
            </div>
          )}

          {prestige && <PrestigeProgressCard prestige={prestige} />}
        </div>
      )}

      {/* ── ADMIN: Analytics Overview Card ── */}
      {isAdmin && (revenueOverview === undefined || conversionStats === undefined) && (
        <Skeleton className="h-40 w-full rounded-xl mb-6" />
      )}

      {isAdmin && revenueOverview && conversionStats && (
        <div
          className="rounded-xl border border-border bg-card mb-6 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/portal/analytics")}
        >
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-[#1B4332]/10 dark:bg-[#1B4332]/30 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-[#1B4332] dark:text-emerald-400" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">
                Analytics Overview
              </h2>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/50">
            {/* Sessions */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Sessions
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {conversionStats.totalVisitors.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Unique campaign visits
              </p>
            </div>

            {/* Total Revenue */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Total Revenue
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-700">
                ${revenueOverview.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                From tracked donations
              </p>
            </div>

            {/* Donors */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Donors
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {revenueOverview.totalDonations.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Completed donations
              </p>
            </div>

            {/* Conversion Rate */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-3.5 h-3.5 text-blue-500" />
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Conversion
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-foreground">
                {conversionStats.conversionRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {conversionStats.totalConverted} of{" "}
                {conversionStats.totalVisitors} donated
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN: Payroll Summary Card ── */}
      {isAdmin && payrollOverview && (
        <div
          className="rounded-xl border border-border bg-card p-5 mb-6 cursor-pointer hover:shadow-md transition-shadow group"
          onClick={() => navigate("/portal/finance")}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                <Banknote className="w-4 h-4 text-amber-700" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Total Weekly Payroll
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            ${payrollOverview.totalNextPayout.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Next payout across {payrollOverview.employees.length} employee{payrollOverview.employees.length !== 1 ? "s" : ""} — click to manage
          </p>
        </div>
      )}

      {/* ── ADMIN: One-Time vs Monthly Donation Breakdown ── */}
      {isAdmin && revenueOverview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div
            className="rounded-xl border border-border bg-card p-5 cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate("/portal/donors?type=onetime")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  One-Time Donations
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {revenueOverview.onetimeCount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click to view all one-time donors
            </p>
          </div>

          <div
            className="rounded-xl border border-border bg-card p-5 cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() => navigate("/portal/donors?type=monthly")}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                  <Repeat className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Monthly Donations
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {revenueOverview.monthlyCount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click to view all monthly donors
            </p>
          </div>
        </div>
      )}

      {/* ── ADMIN: Top Performing Campaign ── */}
      {isAdmin && revenueOverview && (() => {
        const topCampaign =
          revenueOverview.byCampaign.length > 0
            ? revenueOverview.byCampaign[0]
            : null;
        if (!topCampaign) return null;
        return (
          <div
            className="mb-6 rounded-xl border border-border bg-card p-6 cursor-pointer hover:shadow-md transition-shadow group"
            onClick={() =>
              navigate(`/portal/campaigns/${topCampaign.campaignId}`)
            }
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-amber-700" />
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Top Performing Campaign
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-xl font-bold text-foreground truncate">
                  {topCampaign.campaignTitle}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  By {topCampaign.ownerName}
                  {topCampaign.ownerEmail
                    ? ` (${topCampaign.ownerEmail})`
                    : ""}
                </p>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-700">
                    ${topCampaign.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {topCampaign.donationCount} donation
                    {topCampaign.donationCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── EMPLOYEE: Earnings summary cards ── */}
      {!isAdmin && prestige && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Base Salary
              </p>
              <div className="w-9 h-9 rounded-full bg-[#1B4332]/10 dark:bg-[#1B4332]/30 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-[#1B4332] dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#1B4332] dark:text-emerald-400">
              ${prestige.baseSalary.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">per week</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Commission Rate
              </p>
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
              </div>
            </div>
            <p className="text-3xl font-bold text-emerald-700">
              {(prestige.commissionRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              earned out of {prestige.uniqueDonorCount.toLocaleString()} donor{prestige.uniqueDonorCount !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Unique Donors
              </p>
              <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center">
                <Heart className="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {prestige.uniqueDonorCount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              across all your campaigns
            </p>
          </div>
        </div>
      )}

      {/* ── Quick action cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* New Campaign */}
        <QuickActionCard
          icon={PlusCircle}
          title="New Campaign"
          description="Create a new crowdfunding campaign page."
          onClick={() => navigate("/portal/campaigns/new")}
        />

        {/* View Campaigns */}
        <QuickActionCard
          icon={List}
          title="View Campaigns"
          description="Manage and edit your existing campaigns."
          onClick={() => navigate("/portal/campaigns")}
        />

        {/* Staff — admin only */}
        {isAdmin && (
          <QuickActionCard
            icon={Users}
            title="Staff"
            description="Manage employees, prestige tiers, and performance."
            onClick={() => navigate("/portal/staff")}
          />
        )}

        {/* Donors — admin only */}
        {isAdmin && (
          <QuickActionCard
            icon={Heart}
            title="Donors"
            description="Browse donor history and donation details."
            onClick={() => navigate("/portal/donors")}
          />
        )}

        {/* Analytics — admin only */}
        {isAdmin && (
          <QuickActionCard
            icon={BarChart3}
            title="Analytics"
            description="Donation trends, campaigns, and attribution."
            onClick={() => navigate("/portal/analytics")}
          />
        )}

        {/* Finance / Payroll */}
        <QuickActionCard
          icon={Banknote}
          title={isAdmin ? "Payroll" : "Finance"}
          description={isAdmin ? "Manage payroll and employee payouts." : "View your balance and payout history."}
          onClick={() => navigate("/portal/finance")}
        />

        {/* My Prestige — employee only */}
        {!isAdmin && (
          <QuickActionCard
            icon={Crown}
            title="My Prestige"
            description="View your tier, earnings, and path to the next level."
            onClick={() => navigate("/portal/quota")}
          />
        )}

        {/* Profile */}
        <QuickActionCard
          icon={UserCircle}
          title="Profile"
          description="Edit your profile and wallet addresses."
          onClick={() => navigate("/portal/profile")}
        />
      </div>

      {/* ── ADMIN: Revenue Report ── */}
      {isAdmin && revenueOverview === undefined && (
        <div className="mt-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-40" />
        </div>
      )}

      {isAdmin && revenueOverview && (
        <div className="mt-8 space-y-6">
          <h2 className="text-xl font-bold text-foreground">Revenue Report</h2>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Total Revenue
                </p>
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                </div>
              </div>
              <p className="text-3xl font-bold text-emerald-700">
                ${revenueOverview.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                From tracked donations in selected period
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Total Donations
                </p>
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-emerald-700" />
                </div>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {revenueOverview.totalDonations.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Completed donation
                {revenueOverview.totalDonations !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Revenue by Employee */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 p-5 pb-3 border-b border-border/50">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Revenue by Employee
              </h3>
            </div>
            {revenueOverview.byEmployee.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  No donation revenue recorded yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {revenueOverview.byEmployee.map((emp) => (
                  <div
                    key={emp.userId}
                    className="flex items-center justify-between px-5 py-3 hover:bg-accent cursor-pointer"
                    onClick={() => navigate(`/portal/staff/${emp.userId}`)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {emp.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {emp.email}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-bold text-emerald-700">
                        ${emp.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {emp.donationCount} donation
                        {emp.donationCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revenue by Campaign */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 p-5 pb-3 border-b border-border/50">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">
                Revenue by Campaign
              </h3>
            </div>
            {revenueOverview.byCampaign.length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-sm text-muted-foreground">
                  No campaign donations recorded yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {revenueOverview.byCampaign.map((camp) => (
                  <div
                    key={camp.campaignId}
                    className="flex items-center justify-between px-5 py-3 hover:bg-accent"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {camp.campaignTitle}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        By {camp.ownerName}
                        {camp.ownerEmail ? ` (${camp.ownerEmail})` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-bold text-emerald-700">
                        ${camp.totalAmount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {camp.donationCount} donation
                        {camp.donationCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Prestige progress bar card ── */
function PrestigeProgressCard({
  prestige,
}: {
  prestige: {
    prestigeLevel: number;
    tierName: string;
    baseSalary: number;
    commissionRate: number;
    uniqueDonorCount: number;
    donorsToNextTier: number | null;
    donorsRemaining: number;
    nextTier: {
      level: number;
      name: string;
      baseSalary: number;
      commissionRate: number;
    } | null;
  };
}) {
  const colors = prestigeColors(prestige.prestigeLevel);
  const progressPercent = prestige.donorsToNextTier
    ? Math.min(100, prestige.uniqueDonorCount > 0 ? Math.max(1, Math.round((prestige.uniqueDonorCount / prestige.donorsToNextTier) * 100)) : 0)
    : 100;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      {/* Tier badge + name */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", colors.bg)}>
          {prestige.prestigeLevel >= 5 ? (
            <Crown className={cn("w-6 h-6", colors.text)} />
          ) : (
            <Star className={cn("w-6 h-6", colors.text)} />
          )}
        </div>
        <div>
          <h2 className={cn("text-lg font-bold", colors.text)}>
            {prestige.tierName}
          </h2>
          <p className="text-xs text-muted-foreground">
            ${prestige.baseSalary}/week + {(prestige.commissionRate * 100).toFixed(1)}% commission
          </p>
        </div>
      </div>

      {/* Progress bar to next tier */}
      {prestige.nextTier ? (
        <>
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">
                {prestige.uniqueDonorCount.toLocaleString()} / {prestige.donorsToNextTier?.toLocaleString()} unique donors
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {progressPercent}%
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", colors.bar)}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 p-3 rounded-lg bg-muted border border-border/50">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {prestige.donorsRemaining.toLocaleString()} donors to next tier
              </p>
              <p className={cn("text-sm font-bold mt-0.5", prestigeColors(prestige.nextTier.level).text)}>
                {prestige.nextTier.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Next tier rewards</p>
              <p className="text-sm font-semibold text-foreground">
                ${prestige.nextTier.baseSalary}/wk + {(prestige.nextTier.commissionRate * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-sm font-medium text-amber-800">
            Maximum prestige reached! You're at the top tier.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Reusable quick-action card ── */
function QuickActionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-border bg-card p-5 cursor-pointer hover:shadow-md transition-shadow group"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#1B4332]/10 dark:bg-[#1B4332]/30">
          <Icon className="w-5 h-5 text-[#1B4332] dark:text-emerald-400" />
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
