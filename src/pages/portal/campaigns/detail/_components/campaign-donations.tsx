import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { format } from "date-fns";
import {
  DollarSign,
  Receipt,
  Download,
  User,
  Clock,
  Hash,
  Link2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

function generateCsv(
  donations: Array<{
    donorName: string;
    donorEmail: string;
    amount: number;
    currency: string;
    completedAt?: string;
    donationType?: string;
    receiptId?: string;
  }>,
  campaignTitle: string,
): string {
  const header = "Donor Name,Email,Amount,Currency,Type,Date,Receipt ID";
  const rows = donations.map((d) => {
    const date = d.completedAt
      ? format(new Date(d.completedAt), "yyyy-MM-dd HH:mm")
      : "";
    const name = d.donorName.includes(",")
      ? `"${d.donorName}"`
      : d.donorName;
    return `${name},${d.donorEmail},${d.amount},${d.currency},${d.donationType ?? "onetime"},${date},${d.receiptId ?? ""}`;
  });
  return [
    `# Donations for: ${campaignTitle}`,
    `# Exported: ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
    "",
    header,
    ...rows,
  ].join("\n");
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

type CampaignDonationsProps = {
  campaignId: Id<"campaigns">;
  campaignTitle: string;
};

export default function CampaignDonations({
  campaignId,
  campaignTitle,
}: CampaignDonationsProps) {
  const navigate = useNavigate();
  const donations = useQuery(api.donations.getByCampaign, { campaignId });

  const handleExport = () => {
    if (!donations || donations.length === 0) {
      toast.error("No donations to export.");
      return;
    }
    const csv = generateCsv(donations, campaignTitle);
    const slug = campaignTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    downloadCsv(csv, `donors-${slug}-${format(new Date(), "yyyy-MM-dd")}.csv`);
    toast.success("Donors exported!");
  };

  if (donations === undefined) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 mt-6 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="rounded-xl border border-border bg-card mt-6">
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-3 border-b border-border/50">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Donation History
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {donations.length} donation{donations.length !== 1 ? "s" : ""} -- $
            {totalAmount.toLocaleString()} total
          </p>
        </div>
        {donations.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            className="border border-border text-foreground cursor-pointer h-8 px-3"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Stats row */}
      {donations.length > 0 && (
        <div className="grid grid-cols-3 gap-4 px-5 py-3 border-b border-border/50 bg-muted">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#1B4332]/10 dark:bg-[#1B4332]/30 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-[#1B4332] dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-sm font-bold text-[#1B4332] dark:text-emerald-400">
                ${totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Count</p>
              <p className="text-sm font-bold text-foreground">
                {donations.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg</p>
              <p className="text-sm font-bold text-foreground">
                $
                {donations.length > 0
                  ? Math.round(totalAmount / donations.length).toLocaleString()
                  : 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline list */}
      {donations.length === 0 ? (
        <div className="p-8 text-center">
          <Receipt className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No donations recorded yet.</p>
        </div>
      ) : (
        <div className="max-h-[500px] overflow-auto">
          {donations.map((d, idx) => {
            const isLast = idx === donations.length - 1;
            const completedDate = d.completedAt
              ? new Date(d.completedAt)
              : null;
            const timeStr = completedDate
              ? format(completedDate, "h:mm a")
              : "--";
            const dateStr = completedDate
              ? format(completedDate, "MMM d, yyyy")
              : "--";

            return (
              <div key={d._id} className="relative flex px-5">
                {/* Timeline line & dot */}
                <div className="flex flex-col items-center mr-4 shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1B4332] dark:bg-emerald-400 mt-4 shrink-0 z-10" />
                  {!isLast && (
                    <div className="w-px flex-1 bg-border" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 py-3 min-w-0">
                  {/* Main event */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">
                        <button
                          onClick={() =>
                            navigate(`/portal/donors/${d._id}`)
                          }
                          className="font-semibold text-[#1B4332] dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          {d.donorName || "Anonymous"}
                        </button>
                        {" "}donated{" "}
                        <span className="font-bold">${d.amount.toLocaleString()}</span>
                        {d.donationType === "monthly" && (
                          <span className="ml-1 text-xs text-[#1B4332] dark:text-emerald-400 font-medium bg-[#1B4332]/10 dark:bg-[#1B4332]/30 px-1.5 py-0.5 rounded">
                            Monthly
                          </span>
                        )}
                      </p>

                      {/* Sub-details */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {timeStr}
                        </span>
                        {d.donorNumber !== undefined && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Hash className="w-3 h-3" />
                            #{d.donorNumber}
                          </span>
                        )}
                        {d.trackingId && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Link2 className="w-3 h-3" />
                            {d.trackingId}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timestamp right side */}
                    <p className="text-xs text-muted-foreground shrink-0 mt-0.5">
                      {dateStr}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
