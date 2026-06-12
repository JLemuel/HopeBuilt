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
import { Heart, Flame, Download, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { format } from "date-fns";
import { downloadDonationReceipt } from "./_lib/generate-receipt.ts";
import EditProfileModal from "./_components/edit-profile-modal.tsx";
import ActiveSubscriptionsTable from "./_components/active-subscriptions-table.tsx";
import SiteHeader from "@/components/site-header.tsx";
import Footer from "@/components/footer.tsx";

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

      {/* CTA banner */}
      <section className="bg-[#3d8d7a] py-14 text-center">
        <h2 className="text-2xl font-bold text-white mb-5">Want to start a campaign?</h2>
        <Link
          to="/start-campaign"
          className="inline-block bg-[#fff597] hover:bg-[#ddd47d] text-[#2d6b5e] font-semibold px-8 py-3 rounded-full transition-colors cursor-pointer"
        >
          Get Started
        </Link>
      </section>

      <Footer />

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}

// ── Profile header ──────────────────────────────────────────────────────────

type Profile = {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
} | null | undefined;

function ProfileHeader({
  profile,
  onEditProfile,
}: {
  profile: Profile;
  onEditProfile: () => void;
}) {
  const stats = useQuery(api.donorDashboard.getMyStats, {});
  const memberSinceQuery = useQuery(api.users.getCurrentUser, {});
  const initials = getInitials(profile?.name ?? profile?.email ?? "?");
  const memberSince = memberSinceQuery?._creationTime
    ? format(new Date(memberSinceQuery._creationTime), "MMMM yyyy")
    : "";

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
      {/* Avatar */}
      <div className="w-14 h-14 rounded-full overflow-hidden bg-[#3d8d7a]/15 text-[#2d6b5e] font-bold text-lg flex items-center justify-center uppercase shrink-0">
        {profile?.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.name || "Profile"}
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <h1 className="text-xl font-bold text-gray-900">
          {profile?.name || "Loading..."}
        </h1>
        <p className="text-sm text-gray-500">{profile?.email}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          Member since {memberSince}
        </p>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 sm:ml-auto shrink-0">
        {(stats?.givingStreak ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2d6b5e] border border-[#3d8d7a]/30 bg-[#3d8d7a]/5 px-3 py-1.5 rounded-full">
            <Flame className="w-3.5 h-3.5" />
            {stats?.givingStreak}-month giving streak
          </span>
        )}
        <button
          onClick={onEditProfile}
          className="text-sm font-medium border border-gray-200 px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}

// ── Tab content ──────────────────────────────────────────────────────────────

function TabContent({ tab }: { tab: Tab }) {
  const stats = useQuery(api.donorDashboard.getMyStats, {});

  return (
    <div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {tab === "all" && <AllStatCards stats={stats} />}
        {tab === "recurring" && <RecurringStatCards stats={stats} />}
        {tab === "onetime" && <OneTimeStatCards stats={stats} />}
      </div>

      {tab === "recurring" ? (
        <div className="space-y-10">
          <ActiveSubscriptionsTable />
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <p className="text-xs text-gray-500 mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function AllStatCards({ stats }: { stats: StatsResult }) {
  if (!stats) {
    return (
      <>
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </>
    );
  }
  return (
    <>
      <StatCard
        label="Total Donated"
        value={`$${stats.totalDonated.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
      />
      <StatCard label="Campaigns Supported" value={stats.campaignsSupported.toString()} />
      <StatCard
        label="Giving Streak"
        value={stats.givingStreak > 0 ? `${stats.givingStreak} months` : "—"}
      />
    </>
  );
}

function RecurringStatCards({ stats }: { stats: StatsResult }) {
  if (!stats) {
    return (
      <>
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </>
    );
  }
  return (
    <>
      <StatCard
        label="Monthly Total"
        value={`$${stats.monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
      />
      <StatCard label="Active Subscriptions" value={stats.activeSubscriptions.toString()} />
      <StatCard
        label="Next Payment"
        value={stats.nextPayment ? format(new Date(stats.nextPayment), "MMM d") : "—"}
      />
    </>
  );
}

function OneTimeStatCards({ stats }: { stats: StatsResult }) {
  if (!stats) {
    return (
      <>
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </>
    );
  }
  return (
    <>
      <StatCard
        label="One-Time Total"
        value={`$${stats.oneTimeTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`}
      />
      <StatCard label="Campaigns Supported" value={stats.oneTimeCampaignsSupported.toString()} />
      <StatCard
        label="Last Donation"
        value={stats.lastDonation ? format(new Date(stats.lastDonation), "MMM d") : "—"}
      />
    </>
  );
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

const CATEGORY_COLORS: Record<string, string> = {
  education: "bg-blue-100 text-blue-700",
  healthcare: "bg-pink-100 text-pink-700",
  disaster_relief: "bg-orange-100 text-orange-700",
  community: "bg-purple-100 text-purple-700",
  children: "bg-yellow-100 text-yellow-700",
  environment: "bg-green-100 text-green-700",
};

function CategoryIcon({ category }: { category: string | null }) {
  const cls =
    CATEGORY_COLORS[category ?? ""] ?? "bg-gray-100 text-gray-500";
  return (
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold uppercase shrink-0 ${cls}`}>
      {(category ?? "G").charAt(0).toUpperCase()}
    </div>
  );
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

  return (
    <div>
      {tab === "onetime" && (
        <h3 className="font-semibold text-base mb-4">One-Time Donations</h3>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-500">Campaign</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Frequency</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {(results as DonationRow[]).map((d, i) => (
              <tr
                key={d._id}
                className={`border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/60"}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <CategoryIcon category={(d as DonationRow & { campaignCategory?: string | null }).campaignCategory ?? null} />
                    <span className="font-medium text-gray-900 truncate max-w-[140px]">
                      {d.campaignTitle}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold">
                  ${d.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                  {d.completedAt ? format(new Date(d.completedAt), "MMM d, yyyy") : "—"}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${d.donationType === "monthly" ? "bg-[#3d8d7a]/10 text-[#2d6b5e]" : "bg-gray-100 text-gray-600"}`}>
                    {d.donationType === "monthly" ? "Monthly" : "One-Time"}
                  </span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600">
                    Completed
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      downloadDonationReceipt({
                        donorName: d.donorName,
                        donorEmail: d.donorEmail,
                        campaignTitle: d.campaignTitle,
                        amount: d.amount,
                        currency: d.currency,
                        donationType: d.donationType ?? "onetime",
                        completedAt: d.completedAt,
                        receiptId: d.receiptId,
                      })
                    }
                    className="text-[#2d6b5e] hover:text-[#2d6b5e] text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Download Receipt</span>
                    <span className="sm:hidden">PDF</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {status === "CanLoadMore" && (
        <div className="text-center mt-4">
          <button
            onClick={() => loadMore(20)}
            className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mx-auto cursor-pointer transition-colors"
          >
            <ChevronDown className="w-4 h-4" /> Load more
          </button>
        </div>
      )}
    </div>
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

// ── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}
