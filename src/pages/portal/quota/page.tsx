import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  DollarSign,
  TrendingUp,
  Star,
  Crown,
  Heart,
  Users,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { format } from "date-fns";

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

export default function PrestigePage() {
  const prestige = useQuery(api.prestige.getMyPrestige, {});
  const tiers = useQuery(api.prestige.getTierDefinitions, {});

  if (prestige === undefined || tiers === undefined) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-44 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (prestige === null) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-4">My Prestige</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No prestige tier has been assigned to your account yet.
          </p>
        </div>
      </div>
    );
  }

  const colors = prestigeColors(prestige.prestigeLevel);
  const progressPercent = prestige.donorsToNextTier
    ? Math.min(
        100,
        prestige.uniqueDonorCount > 0
          ? Math.max(1, Math.round((prestige.uniqueDonorCount / prestige.donorsToNextTier) * 100))
          : 0,
      )
    : 100;

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">My Prestige</h1>

      {/* Current tier hero card */}
      <div className={cn("rounded-xl border border-border bg-card p-6 mb-6")}>
        <div className="flex items-center gap-4 mb-5">
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center", colors.bg)}>
            {prestige.prestigeLevel >= 5 ? (
              <Crown className={cn("w-8 h-8", colors.text)} />
            ) : (
              <Star className={cn("w-8 h-8", colors.text)} />
            )}
          </div>
          <div>
            <h2 className={cn("text-2xl font-bold", colors.text)}>
              {prestige.tierName}
            </h2>
            <p className="text-sm text-muted-foreground">
              Prestige Level {prestige.prestigeLevel}
            </p>
          </div>
        </div>

        {/* Progress to next tier */}
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
              <div className="w-full h-4 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", colors.bar)}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 p-4 rounded-lg bg-muted border border-border/50">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {prestige.donorsRemaining.toLocaleString()} donors to reach
                </p>
                <p className={cn("text-base font-bold mt-0.5", prestigeColors(prestige.nextTier.level).text)}>
                  {prestige.nextTier.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Next tier rewards</p>
                <p className="text-sm font-semibold text-foreground">
                  ${prestige.nextTier.baseSalary}/wk + {(prestige.nextTier.commissionRate * 100).toFixed(1)}% commission
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-sm font-medium text-amber-800">
              Maximum prestige reached. You're at the top tier!
            </p>
          </div>
        )}
      </div>

      {/* Earnings cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Base Salary</p>
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
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Commission</p>
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-700">
            ${prestige.commissionEarned.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {(prestige.commissionRate * 100).toFixed(1)}% of ${prestige.totalDonationAmount.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Unique Donors</p>
            <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center">
              <Heart className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-foreground">
            {prestige.uniqueDonorCount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">across all campaigns</p>
        </div>
      </div>

      {/* Cumulative earnings */}
      {prestige.cumulativeEarnings > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                All-Time Earnings
              </p>
              <p className="text-3xl font-bold text-foreground mt-1">
                ${prestige.cumulativeEarnings.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
          {prestige.earningsSince && (
            <p className="text-xs text-muted-foreground mt-2">
              Since {format(new Date(prestige.earningsSince), "MMM d, yyyy")}
            </p>
          )}
        </div>
      )}

      {/* All Prestige Tiers */}
      {tiers && (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 p-5 pb-3 border-b border-border/50">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">All Prestige Tiers</h3>
          </div>
          <div className="divide-y divide-border/50">
            {tiers.map((tier) => {
              const tierColors = prestigeColors(tier.level);
              const isCurrentTier = tier.level === prestige.prestigeLevel;
              const isLocked = tier.level > prestige.prestigeLevel;
              return (
                <div
                  key={tier.level}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4",
                    isCurrentTier && "bg-muted",
                    isLocked && "opacity-50",
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", tierColors.bg)}>
                    {tier.level >= 5 ? (
                      <Crown className={cn("w-5 h-5", tierColors.text)} />
                    ) : (
                      <Star className={cn("w-5 h-5", tierColors.text)} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm font-semibold", tierColors.text)}>
                        {tier.name}
                      </p>
                      {isCurrentTier && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#1B4332] text-white font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ${tier.baseSalary}/week + {(tier.commissionRate * 100).toFixed(1)}% commission
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {tier.donorsToNextTier ? (
                      <p className="text-xs text-muted-foreground">
                        {tier.donorsToNextTier.toLocaleString()} donors to next
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 font-medium">Max tier</p>
                    )}
                  </div>
                  {!isLocked && <ChevronRight className="w-4 h-4 text-border shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
