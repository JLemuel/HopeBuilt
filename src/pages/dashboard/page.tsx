import { useEffect, useState } from "react";
import {
  useQuery,
  usePaginatedQuery,
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Link, useSearchParams } from "react-router-dom";
import { Heart, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { ActionLink, HeadRow } from "@/components/ui/table-primitives.tsx";
import { StatusBadge } from "@/components/status-badge.tsx";
import { CampaignIcon } from "@/components/campaign-icon.tsx";
import { format } from "date-fns";
import { downloadDonationReceipt } from "./_lib/generate-receipt.ts";
import EditProfileModal from "./_components/edit-profile-modal.tsx";
import ActiveSubscriptionsTable from "./_components/active-subscriptions-table.tsx";
import ProfileHeader from "./_components/profile-header.tsx";
import { StatCards, StatCardsSkeleton } from "./_components/stat-cards.tsx";
import ManageRecurringSection from "./_components/manage-recurring-section.tsx";
import type {
  CampaignIconKey,
  DonorDonation,
  RecurringSubscription,
  Stat,
} from "@/lib/hopebuilt-types.ts";
import SiteHeader from "@/components/site-header.tsx";
import Footer from "@/components/footer.tsx";
import CtaSection from "../home/_components/cta-section.tsx";
import { Cta } from "@/components/cta.tsx";

type Tab = "all" | "recurring" | "onetime";

export default function DonorDashboardPage() {
  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center">
          <Skeleton className="h-10 w-40" />
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center flex-col gap-4">
          <p className="text-gray-500">Please sign in to view your dashboard.</p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <DashboardInner />
      </Authenticated>
    </>
  );
}

function DashboardInner() {
  const [tab, setTab] = useState<Tab>("all");
  const [editOpen, setEditOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const profile = useQuery(api.profile.getMyProfile, {});
  const subscriptionRows = useQuery(api.donorDashboard.getMyActiveSubscriptions, {});
  const subscriptions = ((subscriptionRows ?? []) as SubscriptionRow[]).map(
    toRecurringSubscription,
  );

  // Open edit modal once when ?edit=1 is present (from SiteHeader Profile link).
  useEffect(() => {
    if (searchParams.get("edit") === "1") {
      setEditOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete("edit");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteHeader variant="solid-dark" />

      {/* Body */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10">
          {/* Profile header */}
          <ProfileHeader
            profile={profile}
            onEditProfile={() => setEditOpen(true)}
          />

          {/* Tabs */}
          <div className="flex items-center gap-0 border-b border-gray-200 mt-6">
            {(["all", "recurring", "onetime"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 pb-3 text-sm font-medium capitalize cursor-pointer transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? "border-[#3d8d7a] text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                {t === "all" ? "All Donations" : t === "recurring" ? "Recurring" : "One-Time"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="mt-6">
            <TabContent tab={tab} />
          </div>
        </div>
      </main>

      {/* Manage recurring donations */}
      <ManageRecurringSection
        heading="Manage Recurring Donations"
        subscriptions={subscriptions}
      />

      {/* CTA banner */}
      <Cta
        title="Ready to create your next campaign?"
          buttonLabel="Create New Campaign"
      />

      <Footer />

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}

// ── Tab content ──────────────────────────────────────────────────────────────

function TabContent({ tab }: { tab: Tab }) {
  const stats = useQuery(api.donorDashboard.getMyStats, {});

  return (
    <div>
      {/* Stat cards */}
      <div className="mb-8">
        {stats ? <StatCards stats={buildTabStats(tab, stats)} /> : <StatCardsSkeleton />}
      </div>

      {tab === "recurring" ? (
        <div className="space-y-10">
          {/* <ActiveSubscriptionsTable /> */}
          <div>
            <h3 className="font-semibold text-base mb-4">Payment history</h3>
            <DonationsTable tab="recurring" />
          </div>
        </div>
      ) : (
        <DonationsTable tab={tab} />
      )}
    </div>
  );
}

type StatsResult = {
  totalDonated: number;
  campaignsSupported: number;
  givingStreak: number;
  monthlyTotal: number;
  activeSubscriptions: number;
  nextPayment: string | null;
  oneTimeTotal: number;
  oneTimeCampaignsSupported: number;
  lastDonation: string | null;
} | null | undefined;

function formatMoney(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function buildTabStats(tab: Tab, stats: NonNullable<StatsResult>): Stat[] {
  if (tab === "recurring") {
    return [
      { label: "Monthly Total", value: formatMoney(stats.monthlyTotal) },
      { label: "Active Subscriptions", value: stats.activeSubscriptions.toString() },
      {
        label: "Next Payment",
        value: stats.nextPayment ? format(new Date(stats.nextPayment), "MMM d") : "—",
      },
    ];
  }
  if (tab === "onetime") {
    return [
      { label: "One-Time Total", value: formatMoney(stats.oneTimeTotal) },
      { label: "Campaigns Supported", value: stats.oneTimeCampaignsSupported.toString() },
      {
        label: "Last Donation",
        value: stats.lastDonation ? format(new Date(stats.lastDonation), "MMM d") : "—",
      },
    ];
  }
  return [
    { label: "Total Donated", value: formatMoney(stats.totalDonated) },
    { label: "Campaigns Supported", value: stats.campaignsSupported.toString() },
    {
      label: "Giving Streak",
      value: stats.givingStreak > 0 ? `${stats.givingStreak} months` : "—",
    },
  ];
}

// ── Donations table ──────────────────────────────────────────────────────────

type DonationRow = {
  _id: string;
  _creationTime: number;
  amount: number;
  currency: string;
  donorName: string;
  donorEmail: string;
  status: string;
  donationType?: string;
  completedAt?: string;
  receiptId?: string;
  campaignTitle: string;
};

// Maps a campaign category from the backend to the design system's icon keys.
const CATEGORY_ICONS: Record<string, CampaignIconKey> = {
  education: "book",
  healthcare: "heart",
  disaster_relief: "home",
  community: "user",
  children: "sun",
  environment: "droplet",
};

// Shape returned by api.donorDashboard.getMyActiveSubscriptions.
type SubscriptionRow = {
  _id: string;
  amount: number;
  campaignTitle: string;
  campaignCategory?: string | null;
  nextChargeAt?: string;
  paymentMethod?: string;
};

function toRecurringSubscription(row: SubscriptionRow): RecurringSubscription {
  return {
    id: row._id,
    campaign: row.campaignTitle,
    icon: CATEGORY_ICONS[row.campaignCategory ?? ""] ?? "heart",
    amountPerMonth: `$${row.amount}/month`,
    nextCharge: row.nextChargeAt
      ? `Next charge: ${format(new Date(row.nextChargeAt), "MMM d, yyyy")}`
      : "Next charge: —",
    paymentMethod: row.paymentMethod ?? "—",
  };
}

type DonationView = DonorDonation & {
  receipt: Parameters<typeof downloadDonationReceipt>[0];
};

function toDonationView(
  d: DonationRow & { campaignCategory?: string | null },
): DonationView {
  return {
    id: d._id,
    campaign: d.campaignTitle,
    icon: CATEGORY_ICONS[d.campaignCategory ?? ""] ?? "heart",
    amount: `$${d.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    date: d.completedAt ? format(new Date(d.completedAt), "MMM d, yyyy") : "—",
    frequency: d.donationType === "monthly" ? "Monthly" : "One-Time",
    status: d.donationType === "monthly" ? "Active" : "Completed",
    receiptAction: "Download Receipt",
    receipt: {
      donorName: d.donorName,
      donorEmail: d.donorEmail,
      campaignTitle: d.campaignTitle,
      amount: d.amount,
      currency: d.currency,
      donationType: d.donationType ?? "onetime",
      completedAt: d.completedAt,
      receiptId: d.receiptId,
    },
  };
}

function DonationsTable({ tab }: { tab: Tab }) {
  const donationType =
    tab === "recurring" ? "monthly" : tab === "onetime" ? "onetime" : undefined;

  const { results, status, loadMore } = usePaginatedQuery(
    api.donorDashboard.getMyDonations,
    donationType ? { donationType } : {},
    { initialNumItems: 20 },
  );

  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return <EmptyState />;
  }

  const donations = (
    results as Array<DonationRow & { campaignCategory?: string | null }>
  ).map(toDonationView);

  return (
    <div>
      {tab === "onetime" && (
        <h3 className="font-semibold text-base mb-4">One-Time Donations</h3>
      )}

      <DonationsTableView donations={donations} />

      {status === "CanLoadMore" && (
        <div className="text-center mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadMore(20)}
            className="mx-auto gap-1 text-gray-500 hover:text-gray-900 hover:bg-transparent"
          >
            <ChevronDown className="w-4 h-4" /> Load more
          </Button>
        </div>
      )}
    </div>
  );
}

function DonationsTableView({ donations }: { donations: DonationView[] }) {
  return (
    <Table>
      <TableHeader>
        <HeadRow
          columns={["Campaign", "Amount", "Date", "Frequency", "Status", "Receipt"]}
        />
      </TableHeader>
      <TableBody>
        {donations.map((donation) => (
          <TableRow key={donation.id} className="text-black hover:bg-white border-gray-100">
            <TableCell className="px-4 py-4">
              <div className="flex items-center gap-3">
                <CampaignIcon name={donation.icon} />
                <span className="text-sm font-semibold">{donation.campaign}</span>
              </div>
            </TableCell>
            <TableCell className="px-4 py-4 text-sm font-bold">
              {donation.amount}
            </TableCell>
            <TableCell className="px-4 py-4 text-[13px]">
              {donation.date}
            </TableCell>
            <TableCell className="px-4 py-4">
              <StatusBadge label={donation.frequency} />
            </TableCell>
            <TableCell className="px-4 py-4">
              <StatusBadge label={donation.status} />
            </TableCell>
            <TableCell className="px-4 py-4">
              <ActionLink onClick={() => downloadDonationReceipt(donation.receipt)}>
                {donation.receiptAction}
              </ActionLink>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center mb-5">
        <Heart className="w-7 h-7 text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No donations yet</h3>
      <p className="text-gray-500 text-sm max-w-xs mb-6">
        Your donation history will appear here once you make your first contribution.
      </p>
      <Link
        to="/campaigns"
        className="inline-block bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white font-semibold px-6 py-2.5 rounded-full transition-colors cursor-pointer text-sm"
      >
        Explore Campaigns
      </Link>
    </div>
  );
}
