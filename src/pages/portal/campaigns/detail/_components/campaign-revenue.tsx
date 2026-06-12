import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  DollarSign,
  Users,
  TrendingUp,
  Eye,
  ArrowRightLeft,
  Percent,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";

type CampaignRevenueProps = {
  campaignId: Id<"campaigns">;
  campaignSlug?: string;
  isAdmin: boolean;
};

export default function CampaignRevenue({ campaignId, campaignSlug, isAdmin }: CampaignRevenueProps) {
  const donations = useQuery(api.donations.getByCampaign, isAdmin ? { campaignId } : "skip");
  const commission = useQuery(api.donations.getCommissionByCampaign, !isAdmin ? { campaignId } : "skip");
  const stats = useQuery(
    api.pageViews.getCampaignStats,
    campaignSlug ? { campaignSlug } : "skip",
  );

  // Loading state
  if (isAdmin ? donations === undefined : commission === undefined) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 mb-6 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Admin sees full revenue breakdown
  if (isAdmin && donations) {
    const totalRevenue = donations.reduce((sum, d) => sum + d.amount, 0);
    const donorCount = donations.length;
    const avgDonation = donorCount > 0 ? Math.round(totalRevenue / donorCount) : 0;

    return (
      <div className="rounded-xl border border-border bg-card mb-6 overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Campaign Revenue
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3 px-5 pb-5">
          <div className="rounded-lg bg-[#1B4332]/5 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-[#1B4332] dark:text-emerald-400" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Revenue
              </span>
            </div>
            <p className="text-lg font-bold text-[#1B4332] dark:text-emerald-400">
              ${totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Donors
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">{donorCount}</p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Avg
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              ${avgDonation.toLocaleString()}
            </p>
          </div>
        </div>

        <PageAnalyticsSection campaignSlug={campaignSlug} stats={stats} />
      </div>
    );
  }

  // Staff sees commission only
  if (!isAdmin && commission) {
    return (
      <div className="rounded-xl border border-border bg-card mb-6 overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Your Commission
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 px-5 pb-5">
          <div className="rounded-lg bg-[#1B4332]/5 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-[#1B4332] dark:text-emerald-400" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Commission
              </span>
            </div>
            <p className="text-lg font-bold text-[#1B4332] dark:text-emerald-400">
              ${commission.commission.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Percent className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Rate
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {(commission.commissionRate * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        <PageAnalyticsSection campaignSlug={campaignSlug} stats={stats} />
      </div>
    );
  }

  return null;
}

/* ---- Page analytics sub-section, shared by both views ---- */

type StatsData = { totalViews: number; totalConverted: number; conversionRate: number };

function PageAnalyticsSection({
  campaignSlug,
  stats,
}: {
  campaignSlug?: string;
  stats: StatsData | undefined;
}) {
  if (!campaignSlug) return null;

  return (
    <div className="border-t border-border px-5 py-4">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Page Analytics
      </h3>
      {stats === undefined ? (
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Views
              </span>
            </div>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {stats.totalViews.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Conversions
              </span>
            </div>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
              {stats.totalConverted.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Percent className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                CVR
              </span>
            </div>
            <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
              {stats.conversionRate.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
