import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import { format } from "date-fns";
import { PauseCircle, PlayCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import SubscriptionActionDialog, {
  type SubscriptionAction,
} from "./subscription-action-dialog.tsx";

type SubscriptionRow = {
  _id: Id<"donations">;
  stripeSubscriptionId?: string;
  amount: number;
  currency: string;
  campaignTitle: string;
  campaignSlug: string | null;
  subscriptionStatus?: "active" | "paused" | "canceled";
  startedAt: string;
  subscriptionPausedAt: string | null;
};

export default function ActiveSubscriptionsTable() {
  const subscriptions = useQuery(api.donorDashboard.getMyActiveSubscriptions, {});
  const cancelSubscription = useAction(api.stripeCheckout.cancelSubscription);
  const pauseSubscription = useAction(api.stripeCheckout.pauseSubscription);
  const resumeSubscription = useAction(api.stripeCheckout.resumeSubscription);

  const [pending, setPending] = useState<{
    row: SubscriptionRow;
    action: SubscriptionAction;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.action === "cancel") {
        await cancelSubscription({ donationId: pending.row._id });
        toast.success("Subscription canceled.");
      } else if (pending.action === "pause") {
        await pauseSubscription({ donationId: pending.row._id });
        toast.success("Subscription paused.");
      } else {
        await resumeSubscription({ donationId: pending.row._id });
        toast.success("Subscription resumed.");
      }
      setPending(null);
    } catch (err) {
      const message =
        err instanceof ConvexError
          ? ((err.data as { message?: string })?.message ?? err.message)
          : err instanceof Error
            ? err.message
            : "Something went wrong";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (subscriptions === undefined) {
    return (
      <div>
        <h3 className="font-semibold text-base mb-4">Active subscriptions</h3>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div>
        <h3 className="font-semibold text-base mb-4">Active subscriptions</h3>
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
          <p className="text-sm text-gray-500">
            You don&apos;t have any active monthly donations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold text-base mb-4">Active subscriptions</h3>
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Campaign</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Monthly</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Started</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Status</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(subscriptions as SubscriptionRow[]).map((row) => {
              const status = row.subscriptionStatus ?? "active";
              return (
                <tr
                  key={row._id}
                  className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900 truncate max-w-[200px] block">
                      {row.campaignTitle}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    ${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {format(new Date(row.startedAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        status === "active"
                          ? "bg-[#3d8d7a]/10 text-[#2d6b5e]"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {status === "active" ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {status === "active" ? (
                        <button
                          onClick={() => setPending({ row, action: "pause" })}
                          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 border border-gray-200 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          <PauseCircle className="w-3.5 h-3.5" />
                          Pause
                        </button>
                      ) : (
                        <button
                          onClick={() => setPending({ row, action: "resume" })}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#2d6b5e] hover:text-[#2d6b5e] border border-[#3d8d7a]/30 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          Resume
                        </button>
                      )}
                      <button
                        onClick={() => setPending({ row, action: "cancel" })}
                        className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SubscriptionActionDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        action={pending?.action ?? null}
        campaignTitle={pending?.row.campaignTitle ?? ""}
        amount={pending?.row.amount ?? 0}
        busy={busy}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
