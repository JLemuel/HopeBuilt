import { createBackendPlaceholder } from "./backend-placeholders.ts";
import {
  mockCampaigns,
  mockDonations,
  mockDonorsByCampaign,
  mockStats,
} from "./data.ts";

export type CreateCampaignPlaceholderArgs = {
  title: string;
  category: string;
  goalAmount: number;
};

export type DonatePlaceholderArgs = {
  campaignId: string;
  amount: number;
  donorEmail?: string;
};

export const createCampaignPlaceholder = createBackendPlaceholder<
  CreateCampaignPlaceholderArgs,
  { ok: true; temporaryId: string }
>({
  name: "campaigns.create",
  description:
    "Placeholder for creating a campaign. Main app integration should replace this with the real campaign creation mutation.",
  mockResult: (args) => ({
    ok: true,
    temporaryId: `mock-campaign-${args.title.toLowerCase().replace(/\s+/g, "-")}`,
  }),
});

export const donatePlaceholder = createBackendPlaceholder<
  DonatePlaceholderArgs,
  { ok: true; checkoutMode: "mock" }
>({
  name: "donations.createCheckout",
  description:
    "Placeholder for donation checkout. Main app integration should replace this with the real Stripe/Convex flow.",
  mockResult: {
    ok: true,
    checkoutMode: "mock",
  },
});

export function useMockCampaigns() {
  return {
    campaigns: mockCampaigns,
    isLoading: false,
    createCampaign: createCampaignPlaceholder,
    donate: donatePlaceholder,
  };
}

export function useMockCampaignBySlug(slug: string) {
  const campaign =
    mockCampaigns.find((mockCampaign) => mockCampaign.slug === slug) ?? null;

  return {
    campaign,
    donors: campaign ? (mockDonorsByCampaign[campaign.id] ?? []) : [],
    isLoading: false,
    donate: donatePlaceholder,
  };
}

export function useMockDashboard() {
  return {
    stats: mockStats,
    recentDonations: mockDonations,
    campaigns: mockCampaigns,
    isLoading: false,
  };
}
