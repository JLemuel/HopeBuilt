import type { ReactNode } from "react";
import { mockCampaigns, mockDonations, mockDonorsByCampaign, mockStats, mockUser } from "../data.ts";

type FunctionReference = {
  __path?: string;
  toString?: () => string;
};

type QueryArgs = Record<string, any> | "skip" | undefined;
type MockBackendResult = string & {
  products: Array<{
    shopifyId: number;
    title: string;
    description: string;
    slug: string;
    hasVideo: boolean;
    videoUrl: string | null;
    thumbnailUrl: string | null;
  }>;
  imported: number;
  skipped: number;
  failed: number;
  errors: any;
  valid: boolean;
  accountName: string;
  mode: string;
  clientSecret: string;
  paymentIntentId: string;
  text: string;
  [key: string]: any;
};
type MockBackendFunction = {
  (): Promise<MockBackendResult>;
  (args: Record<string, any>): Promise<MockBackendResult>;
};

function getPath(reference: FunctionReference | string): string {
  if (typeof reference === "string") return reference;
  return reference.__path ?? reference.toString?.() ?? "unknown";
}

const now = Date.now();
const currentUser = {
  _id: mockUser.id,
  _creationTime: now,
  email: mockUser.email,
  name: mockUser.name,
  role: "admin",
  avatarUrl: null,
  permissions: [
    "dashboard",
    "campaigns",
    "new_campaign",
    "staff",
    "prestige",
    "my_prestige",
    "donors",
    "leaderboard",
    "analytics",
    "finance",
    "meta_assets",
    "processors",
  ],
};

const campaigns = mockCampaigns.map((campaign, index) => ({
  ...campaign,
  _creationTime: now - index * 100000,
  targetAmount: campaign.goalAmount,
  raisedAmount: campaign.currentAmount,
  totalRaised: campaign.currentAmount + (campaign.offlineAmount ?? 0),
  featured: index === 0,
  imageUrl: campaign.imageUrl,
  videoUrl: campaign.videoUrl ?? null,
  mediaType: campaign.mediaType ?? "image",
  slug: campaign.slug,
  launchStatus: campaign.status === "published" ? "launched" : campaign.status,
  processorId: "mock-processor",
}));

const donations = mockDonations.map((donation, index) => ({
  _id: donation.id,
  _creationTime: now - index * 86400000,
  ...donation,
  amount: donation.amount,
  currency: "usd",
  status: "succeeded",
  donorEmail: "donor@example.com",
}));

// Donor dashboard mocks — shapes mirror the real convex/donorDashboard
// queries consumed by src/pages/dashboard. The dummy values mirror the
// design-system dataset in src/mocks/hopebuilt.ts (allDonations,
// recurringSubscriptions, donorStats) but in backend shapes: numeric
// amounts, ISO dates, and real campaign categories instead of icon keys.
const donorDonationSeed = [
  { id: "don-1", campaignTitle: "Clean Water Initiative", campaignCategory: "environment", amount: 50, completedAt: "2026-04-01", donationType: "monthly" },
  { id: "don-2", campaignTitle: "Rebuild Greenfield School", campaignCategory: "disaster_relief", amount: 100, completedAt: "2026-03-15", donationType: "monthly" },
  { id: "don-3", campaignTitle: "Flood Relief Medical Aid", campaignCategory: "healthcare", amount: 75, completedAt: "2026-02-28", donationType: "onetime" },
  { id: "don-4", campaignTitle: "Education for Every Child", campaignCategory: "education", amount: 25, completedAt: "2026-02-01", donationType: "monthly" },
  { id: "don-5", campaignTitle: "Green Energy Initiative", campaignCategory: "children", amount: 200, completedAt: "2026-01-10", donationType: "onetime" },
];

const donorDonations = donorDonationSeed.map((donation, index) => ({
  _id: `my-${donation.id}`,
  _creationTime: now - index * 86400000,
  amount: donation.amount,
  currency: "usd",
  status: "succeeded",
  donorName: mockUser.name,
  donorEmail: mockUser.email,
  donationType: donation.donationType,
  completedAt: donation.completedAt,
  receiptId: `RCPT-2026-00${index + 1}`,
  campaignTitle: donation.campaignTitle,
  campaignCategory: donation.campaignCategory,
}));

const donorSubscriptions = [
  {
    _id: "my-subscription-1",
    stripeSubscriptionId: "sub_mock_frontend_only_1",
    amount: 50,
    currency: "usd",
    campaignTitle: "Clean Water Initiative",
    campaignCategory: "environment",
    campaignSlug: mockCampaigns[0]?.slug ?? null,
    subscriptionStatus: "active",
    startedAt: "2026-01-07",
    subscriptionPausedAt: null,
    nextChargeAt: "2026-05-07",
    paymentMethod: "Visa ending 4242",
  },
  {
    _id: "my-subscription-2",
    stripeSubscriptionId: "sub_mock_frontend_only_2",
    amount: 100,
    currency: "usd",
    campaignTitle: "Rebuild Greenfield School",
    campaignCategory: "disaster_relief",
    campaignSlug: mockCampaigns[1]?.slug ?? null,
    subscriptionStatus: "active",
    startedAt: "2026-02-15",
    subscriptionPausedAt: null,
    nextChargeAt: "2026-05-15",
    paymentMethod: "Visa ending 4242",
  },
  {
    _id: "my-subscription-3",
    stripeSubscriptionId: "sub_mock_frontend_only_3",
    amount: 25,
    currency: "usd",
    campaignTitle: "Education for Every Child",
    campaignCategory: "education",
    campaignSlug: mockCampaigns[2]?.slug ?? null,
    subscriptionStatus: "active",
    startedAt: "2026-02-01",
    subscriptionPausedAt: null,
    nextChargeAt: "2026-05-01",
    paymentMethod: "Visa ending 4242",
  },
];

const donorStats = {
  // Aggregate totals follow hopebuilt.ts donorStats ("all" tab) — they
  // intentionally exceed the visible rows, representing older history.
  totalDonated: 1250,
  campaignsSupported: 8,
  givingStreak: 6,
  monthlyTotal: donorSubscriptions.reduce(
    (total, subscription) => total + subscription.amount,
    0,
  ),
  activeSubscriptions: donorSubscriptions.length,
  nextPayment: "2026-05-01",
  oneTimeTotal: donorDonations
    .filter((donation) => donation.donationType === "onetime")
    .reduce((total, donation) => total + donation.amount, 0),
  oneTimeCampaignsSupported: new Set(
    donorDonations
      .filter((donation) => donation.donationType === "onetime")
      .map((donation) => donation.campaignTitle),
  ).size,
  lastDonation: donorDonations[0]?.completedAt ?? null,
};

const staff = [
  {
    _id: "mock-staff-1",
    _creationTime: now,
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    permissions: currentUser.permissions,
    status: "active",
  },
];

const notifications = [
  {
    _id: "mock-notification-1",
    _creationTime: now,
    title: "Frontend sandbox",
    message: "This notification is mock data.",
    read: false,
    type: "info",
  },
];

const processors = [
  {
    _id: "mock-processor",
    _creationTime: now,
    name: "Mock Stripe Processor",
    publicKey: "pk_test_mock_frontend_only",
    status: "active",
    volumeCap: 100000,
    currentVolume: 12500,
    paymentMethodConfigurationId: "pmc_mock",
  },
];

const checkoutConfig = {
  publicKey: "pk_test_mock_frontend_only",
  paymentMethodTypes: ["card"],
  paymentMethodConfigurationId: "pmc_mock",
  applePayEnabled: false,
  googlePayEnabled: false,
};

const revenueOverview = {
  totalRevenue: mockStats.totalRaised,
  totalDonations: donations.length,
  onetimeCount: 18,
  monthlyCount: 6,
  byEmployee: staff.map((employee) => ({
    userId: employee._id,
    name: employee.name,
    email: employee.email,
    totalRevenue: 48250,
    donationCount: 24,
    campaignCount: 3,
  })),
  byCampaign: campaigns.map((campaign) => ({
    campaignId: campaign._id,
    title: campaign.title,
    slug: campaign.slug,
    totalRevenue: campaign.currentAmount + (campaign.offlineAmount ?? 0),
    donationCount: campaign.donorCount,
  })),
};

const conversionStats = {
  totalVisitors: 1280,
  totalConverted: 94,
  conversionRate: 7.3,
};

const payrollOverview = {
  totalNextPayout: 4200,
  employees: staff.map((employee) => ({
    userId: employee._id,
    name: employee.name,
    email: employee.email,
    nextPayout: 4200,
    status: "scheduled",
  })),
};

function campaignBySlug(slug?: string) {
  return campaigns.find((campaign) => campaign.slug === slug) ?? campaigns[0] ?? null;
}

function defaultQueryValue(path: string, args: QueryArgs): any {
  if (args === "skip") return undefined;
  const normalized = path.toLowerCase();

  // Donor dashboard — must be matched before the generic "stats"/"dashboard"/
  // "donation" rules below, which return the wrong shapes for these queries.
  if (normalized.includes("getmystats")) return donorStats;
  if (normalized.includes("getmyactivesubscriptions")) return donorSubscriptions;
  if (normalized.includes("getmydonations")) {
    const donationType = (args as Record<string, any> | undefined)?.donationType;
    return donationType
      ? donorDonations.filter((donation) => donation.donationType === donationType)
      : donorDonations;
  }

  if (normalized.includes("getcurrentuser") || normalized.includes("getmyprofile")) {
    return currentUser;
  }
  if (normalized.includes("useuserrole") || normalized.includes("getmyrole")) {
    return { role: "admin", permissions: currentUser.permissions, hasPortalAccess: true };
  }
  if (normalized.includes("permissions")) return currentUser.permissions;
  if (normalized.includes("campaign") && normalized.includes("getbyslug")) {
    return campaignBySlug((args as Record<string, any> | undefined)?.slug);
  }
  if (normalized.includes("campaign") && normalized.includes("get")) return campaigns[0] ?? null;
  if (normalized.includes("campaign") && (normalized.includes("list") || normalized.includes("browse"))) {
    return campaigns;
  }
  if (normalized.includes("conversionstats")) return conversionStats;
  if (normalized.includes("revenue") && normalized.includes("overview")) {
    return revenueOverview;
  }
  if (normalized.includes("payroll") && normalized.includes("overview")) {
    return payrollOverview;
  }
  if (normalized.includes("publicstats") || normalized.includes("stats")) return mockStats;
  if (normalized.includes("donor") && normalized.includes("listbycampaign")) {
    const campaignId = (args as Record<string, any> | undefined)?.campaignId ?? campaigns[0]?._id;
    return mockDonorsByCampaign[campaignId] ?? [];
  }
  if (normalized.includes("donation")) return donations;
  if (normalized.includes("dashboard")) {
    return { stats: mockStats, campaigns, donations, recentDonations: donations };
  }
  if (normalized.includes("notification")) return notifications;
  if (normalized.includes("message") || normalized.includes("chat")) return [];
  if (normalized.includes("staff") || normalized.includes("user")) return staff;
  if (normalized.includes("processor") || normalized.includes("checkoutconfig")) return checkoutConfig;
  if (normalized.includes("leaderboard")) return staff;
  if (normalized.includes("prestige")) return { tier: "Gold", quota: 10000, progress: 0.72 };
  if (normalized.includes("analytics") || normalized.includes("revenue")) {
    return { ...revenueOverview, totalRaised: mockStats.totalRaised, series: [], campaigns };
  }
  if (normalized.includes("meta") || normalized.includes("asset")) return [];
  if (normalized.includes("shopify")) return { products: [], imports: [] };
  if (normalized.includes("finance") || normalized.includes("payroll")) return payrollOverview;

  console.info(`[mock-convex-query:${path}]`, { args });
  return [];
}

function defaultMutationResult(path: string, args: Record<string, any> | undefined): any {
  console.info(`[mock-convex-mutation:${path}]`, { args });
  if (path.toLowerCase().includes("generateuploadurl")) return "https://example.com/mock-upload";
  if (path.toLowerCase().includes("createpaymentintent")) {
    return { clientSecret: "pi_mock_secret_frontend_only", paymentIntentId: "pi_mock" };
  }
  return { ok: true, id: "mock-result" };
}

export class ConvexReactClient {
  url: string;

  constructor(url: string) {
    this.url = url;
  }
}

export function useQuery(reference: FunctionReference, args?: QueryArgs): any {
  return defaultQueryValue(getPath(reference), args);
}

export function useMutation(reference: FunctionReference): MockBackendFunction {
  const path = getPath(reference);
  return (async (args?: Record<string, any>) =>
    defaultMutationResult(path, args)) as MockBackendFunction;
}

export function useAction(reference: FunctionReference): MockBackendFunction {
  const path = getPath(reference);
  return (async (args?: Record<string, any>) =>
    defaultMutationResult(path, args)) as MockBackendFunction;
}

function getPaginationStatus():
  | "LoadingFirstPage"
  | "CanLoadMore"
  | "LoadingMore"
  | "Exhausted" {
  return "Exhausted";
}

export function usePaginatedQuery(
  reference: FunctionReference,
  args?: QueryArgs,
  _options?: Record<string, any>,
) {
  const results = defaultQueryValue(getPath(reference), args);
  return {
    results: Array.isArray(results) ? results : [],
    status: getPaginationStatus(),
    loadMore: (_numItems?: number) => undefined,
  };
}

export function useConvex() {
  return {
    query: async (reference: FunctionReference, args?: QueryArgs) =>
      defaultQueryValue(getPath(reference), args),
    mutation: async (reference: FunctionReference, args?: Record<string, any>) =>
      defaultMutationResult(getPath(reference), args),
    action: async (reference: FunctionReference, args?: Record<string, any>) =>
      defaultMutationResult(getPath(reference), args),
  };
}

// Whether the sandbox pretends to be signed in. Override without touching
// code via the browser console:
//   localStorage.setItem("mock_authenticated", "false"); location.reload();
const MOCK_AUTHENTICATED_DEFAULT = true;

function isMockAuthenticated(): boolean {
  try {
    const stored = window.localStorage.getItem("mock_authenticated");
    if (stored !== null) return stored === "true";
  } catch {
    // localStorage unavailable (private mode, etc.) — fall through to default.
  }
  return MOCK_AUTHENTICATED_DEFAULT;
}

export function useConvexAuth() {
  return {
    isAuthenticated: isMockAuthenticated(),
    isLoading: false,
  };
}

export function Authenticated({ children }: { children?: ReactNode }) {
  return isMockAuthenticated() ? <>{children}</> : null;
}

export function Unauthenticated({ children }: { children?: ReactNode }) {
  return isMockAuthenticated() ? null : <>{children}</>;
}

export function AuthLoading(_props: { children?: ReactNode }) {
  return null;
}
