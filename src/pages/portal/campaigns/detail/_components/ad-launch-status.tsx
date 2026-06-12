import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useUserRole } from "@/hooks/use-user-role.ts";
import { Megaphone, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type AdLaunchStatusProps = {
  campaignId: Id<"campaigns">;
};

export default function AdLaunchStatus({ campaignId }: AdLaunchStatusProps) {
  const launches = useQuery(api.campaigns.getAdLaunches, { campaignId });
  const { isAdmin } = useUserRole();

  if (!launches || launches.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Megaphone className="w-4 h-4 text-[#1877F2]" />
        <h2 className="text-sm font-semibold text-foreground">
          Facebook Ad Launches
        </h2>
      </div>

      <div className="space-y-3">
        {launches.map((launch) => (
          <div
            key={launch._id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted border border-border"
          >
            {/* Status icon */}
            <div className="mt-0.5">
              {launch.status === "launched" && (
                <CheckCircle2 className="w-4.5 h-4.5 text-green-600" />
              )}
              {launch.status === "failed" && (
                <XCircle className="w-4.5 h-4.5 text-red-500" />
              )}
              {launch.status === "pending" && (
                <Clock className="w-4.5 h-4.5 text-amber-500" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">
                  {launch.status === "launched"
                    ? "Ad launched successfully"
                    : launch.status === "failed"
                      ? "Ad launch failed"
                      : "Launching ad..."}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    launch.status === "launched"
                      ? "bg-green-50 text-green-700"
                      : launch.status === "failed"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {launch.status}
                </span>
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                Ad Account: {launch.adAccountMetaId}
                {" · "}
                {formatDistanceToNow(new Date(launch.launchedAt), {
                  addSuffix: true,
                })}
              </p>

              {launch.error && (
                <p className="text-xs text-red-600 mt-1.5 bg-red-50 rounded px-2 py-1 break-words">
                  {launch.error}
                </p>
              )}

              {isAdmin && launch.status === "launched" && launch.metaAdId && (
                <a
                  href={`https://www.facebook.com/adsmanager/manage/ads?act=${launch.adAccountMetaId.replace("act_", "")}&selected_ad_ids=${launch.metaAdId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#1877F2] hover:underline mt-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  View in Ads Manager
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
