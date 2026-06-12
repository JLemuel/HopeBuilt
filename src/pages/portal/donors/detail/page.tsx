import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { format, addMonths } from "date-fns";
import {
  ArrowLeft,
  User,
  Mail,
  Hash,
  DollarSign,
  Calendar,
  Clock,
  Link2,
  Repeat,
  Megaphone,
  Receipt,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";

/**
 * Splits a donor name into first name / last name best-effort.
 * Returns empty strings if not extractable.
 */
function splitName(full: string): { first: string; last: string } {
  if (!full || full === "Anonymous") return { first: "", last: "" };
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export default function DonorDetailPage() {
  const { donationId } = useParams<{ donationId: string }>();
  const navigate = useNavigate();

  const detail = useQuery(
    api.donations.getDonorDetail,
    donationId
      ? { donationId: donationId as Id<"donations"> }
      : "skip",
  );

  if (detail === undefined) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto">
        <p className="text-muted-foreground">Donation not found.</p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-[#1B4332] hover:underline mt-2 cursor-pointer"
        >
          Go back
        </button>
      </div>
    );
  }

  const { donation, donorHistory, totalDonated, donationCount } = detail;
  const { first, last } = splitName(donation.donorName);

  // Compute next billing date for monthly subscriptions
  const isMonthly = donation.donationType === "monthly";
  const completedDate = donation.completedAt
    ? new Date(donation.completedAt)
    : null;
  const nextBillingDate =
    isMonthly && completedDate ? addMonths(completedDate, 1) : null;

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Donor number header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-[#1B4332]/10 flex items-center justify-center">
          <User className="w-6 h-6 text-[#1B4332]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Donor #{donation.donorNumber ?? "--"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {donation.donorName || "Anonymous"}
          </p>
        </div>
      </div>

      {/* Donor details card */}
      <div className="rounded-xl border border-border bg-card mb-6">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="text-sm font-semibold text-foreground">
            Donor Details
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
          <InfoField
            icon={<User className="w-4 h-4" />}
            label="First Name"
            value={first || "--"}
          />
          <InfoField
            icon={<User className="w-4 h-4" />}
            label="Last Name"
            value={last || "--"}
          />
          <InfoField
            icon={<Mail className="w-4 h-4" />}
            label="Email"
            value={donation.donorEmail || "--"}
          />
          <InfoField
            icon={<Megaphone className="w-4 h-4" />}
            label="Campaign"
            value={donation.campaignTitle}
          />
          <InfoField
            icon={<DollarSign className="w-4 h-4" />}
            label="Donation Amount"
            value={`$${donation.amount.toLocaleString()}`}
          />
          <InfoField
            icon={<Repeat className="w-4 h-4" />}
            label="Donation Type"
            value={donation.donationType === "monthly" ? "Monthly" : "One-time"}
          />
          <InfoField
            icon={<Calendar className="w-4 h-4" />}
            label="Donated On"
            value={
              completedDate
                ? format(completedDate, "MMM d, yyyy 'at' h:mm a")
                : "--"
            }
          />
          {donation.trackingId && (
            <InfoField
              icon={<Link2 className="w-4 h-4" />}
              label="Tracking ID"
              value={donation.trackingId}
            />
          )}
          {donation.donorNumber !== undefined && (
            <InfoField
              icon={<Hash className="w-4 h-4" />}
              label="Donor Number"
              value={`#${donation.donorNumber}`}
            />
          )}
        </div>
      </div>

      {/* Next billing date (only for monthly) */}
      {isMonthly && nextBillingDate && (
        <div className="rounded-xl border border-[#1B4332]/20 bg-[#1B4332]/5 p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1B4332]/10 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-[#1B4332]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Next Billing Date
              </p>
              <p className="text-lg font-bold text-[#1B4332]">
                {format(nextBillingDate, "MMMM d, yyyy")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Based on donation date of{" "}
                {completedDate
                  ? format(completedDate, "MMMM d, yyyy")
                  : "--"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Donor summary card */}
      <div className="rounded-xl border border-border bg-card mb-6">
        <div className="px-5 py-4 border-b border-border/50">
          <h2 className="text-sm font-semibold text-foreground">
            Donor Summary
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-4 p-5">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-[#1B4332]/10 flex items-center justify-center mx-auto mb-2">
              <DollarSign className="w-4 h-4 text-[#1B4332]" />
            </div>
            <p className="text-lg font-bold text-[#1B4332]">
              ${totalDonated.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Donated</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
              <Receipt className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold text-foreground">{donationCount}</p>
            <p className="text-xs text-muted-foreground">Donations</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-lg font-bold text-foreground">
              $
              {donationCount > 0
                ? Math.round(totalDonated / donationCount).toLocaleString()
                : 0}
            </p>
            <p className="text-xs text-muted-foreground">Avg Donation</p>
          </div>
        </div>
      </div>

      {/* Donor history timeline */}
      {donorHistory.length > 1 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="px-5 py-4 border-b border-border/50">
            <h2 className="text-sm font-semibold text-foreground">
              Donation History
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {donorHistory.length} donation
              {donorHistory.length !== 1 ? "s" : ""} from this donor
            </p>
          </div>
          <div className="max-h-[400px] overflow-auto">
            {donorHistory.map((d, idx) => {
              const isLast = idx === donorHistory.length - 1;
              const dDate = d.completedAt ? new Date(d.completedAt) : null;
              const isCurrent = d._id === donation._id;

              return (
                <div key={d._id} className="relative flex px-5">
                  {/* Timeline */}
                  <div className="flex flex-col items-center mr-4 shrink-0">
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full mt-4 shrink-0 z-10",
                        isCurrent ? "bg-[#1B4332]" : "bg-muted-foreground",
                      )}
                    />
                    {!isLast && <div className="w-px flex-1 bg-border" />}
                  </div>

                  {/* Content */}
                  <div
                    className={cn(
                      "flex-1 py-3 min-w-0",
                      isCurrent && "bg-[#1B4332]/5 -mx-2 px-2 rounded-lg",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">
                          <span className="font-bold">
                            ${d.amount.toLocaleString()}
                          </span>
                          {" to "}
                          <span className="font-medium">{d.campaignTitle}</span>
                          {d.donationType === "monthly" && (
                            <span className="ml-1 text-xs text-[#1B4332] font-medium bg-[#1B4332]/10 px-1.5 py-0.5 rounded">
                              Monthly
                            </span>
                          )}
                          {isCurrent && (
                            <span className="ml-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {dDate ? format(dDate, "h:mm a") : "--"}
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
                      <p className="text-xs text-muted-foreground shrink-0">
                        {dDate ? format(dDate, "MMM d, yyyy") : "--"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: info field row                                             */
/* ------------------------------------------------------------------ */

function InfoField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
