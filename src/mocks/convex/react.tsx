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

export function useConvexAuth() {
  return {
    isAuthenticated: false,
    isLoading: false,
  };
}

export function Authenticated({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

export function Unauthenticated(_props: { children?: ReactNode }) {
  return null;
}

export function AuthLoading(_props: { children?: ReactNode }) {
  return null;
}
