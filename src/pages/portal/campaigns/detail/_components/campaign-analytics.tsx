import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { format } from "date-fns";
import {
  DollarSign,
  Users,
  Receipt,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";

type CampaignAnalyticsProps = {
  campaignId: Id<"campaigns">;
  campaignTitle: string;
};

export default function CampaignAnalytics({
  campaignId,
  campaignTitle,
}: CampaignAnalyticsProps) {
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  // Fetch revenue data for this campaign
  const revenueData = useQuery(
    api.revenue.getByCampaign,
    isAdmin ? { campaignId } : "skip",
  );

  // Fetch donors for this campaign (to show recent + count)
  const donations = useQuery(
    api.donations.listAll,
    isAdmin ? { campaignId } : "skip",
  );

  if (!isAdmin) return null;

  const isLoading = revenueData === undefined || donations === undefined;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 mt-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  const totalAmount = revenueData?.totalAmount ?? 0;
  const donationCount = revenueData?.donationCount ?? 0;
  const avgDonation = donationCount > 0 ? totalAmount / donationCount : 0;
  const recentDonors = (donations ?? []).slice(0, 5);
  const uniqueDonors = new Set(
    (donations ?? []).map((d) => d.donorEmail || d.donorName),
  ).size;

  return (
    <div className="rounded-xl border border-border bg-card p-5 mt-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">
            Campaign Analytics
          </h2>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Total Raised
            </p>
            <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700">
            ${totalAmount.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Real donation revenue
          </p>
        </div>

        <div
          className="rounded-lg border border-border p-4 cursor-pointer hover:border-[#1B4332]/30 hover:bg-accent transition-colors group"
          onClick={() =>
            navigate(`/portal/donors?campaign=${campaignId}`)
          }
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Donors
            </p>
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {uniqueDonors}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {donationCount} total donation{donationCount !== 1 ? "s" : ""}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-[#1B4332] dark:group-hover:text-emerald-400 transition-colors mb-1" />
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              Avg. Donation
            </p>
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">
            ${avgDonation.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Per donation</p>
        </div>
      </div>

      {/* Recent donors list */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-muted border-b border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Recent Donors
          </p>
          {donationCount > 0 && (
            <button
              onClick={() =>
                navigate(`/portal/donors?campaign=${campaignId}`)
              }
              className="text-xs text-[#1B4332] dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              View all {donationCount}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {recentDonors.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No donations recorded for this campaign yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentDonors.map((d) => (
              <div
                key={d._id}
                className="flex items-center justify-between px-4 py-3 hover:bg-accent"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {d.donorName || "Anonymous"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {d.donorEmail || "No email"}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-bold text-emerald-700">
                    ${d.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.completedAt
                      ? format(new Date(d.completedAt), "MMM d, yyyy")
                      : "--"}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full ml-3 shrink-0",
                    d.donationType === "monthly"
                      ? "bg-[#1B4332]/10 dark:bg-[#1B4332]/30 text-[#1B4332] dark:text-emerald-400"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {d.donationType === "monthly" ? "Monthly" : "One-time"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
