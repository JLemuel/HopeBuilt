export type MockCampaign = {
  id: string;
  _id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  offlineAmount?: number;
  donorCount: number;
  imageUrl: string;
  videoUrl?: string | null;
  mediaType?: "image" | "video";
  status: "published" | "pending_approval" | "draft";
};

export type MockDonation = {
  id: string;
  donorName: string;
  campaignTitle: string;
  amount: number;
  date: string;
};

export const mockUser = {
  id: "mock-user-1",
  name: "Frontend Designer",
  email: "frontend@example.com",
  role: "admin",
};

export const mockCampaigns: MockCampaign[] = [
  {
    id: "campaign-1",
    _id: "campaign-1",
    title: "Rebuild the Community Learning Center",
    slug: "community-learning-center",
    category: "Education",
    description:
      "Help restore a neighborhood learning center with new classroom materials, laptops, and after-school programming.",
    goalAmount: 45000,
    currentAmount: 31840,
    offlineAmount: 2500,
    donorCount: 284,
    imageUrl:
      "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=1200&q=80",
    videoUrl: null,
    mediaType: "image",
    status: "published",
  },
  {
    id: "campaign-2",
    _id: "campaign-2",
    title: "Emergency Medical Aid Fund",
    slug: "emergency-medical-aid",
    category: "Healthcare",
    description:
      "Support urgent treatment, transportation, and recovery costs for families facing unexpected medical emergencies.",
    goalAmount: 70000,
    currentAmount: 52210,
    donorCount: 417,
    imageUrl:
      "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
    videoUrl: null,
    mediaType: "image",
    status: "published",
  },
  {
    id: "campaign-3",
    _id: "campaign-3",
    title: "Warm Meals for Local Shelters",
    slug: "warm-meals-local-shelters",
    category: "Community",
    description:
      "Fund weekly prepared meals and pantry essentials for shelters serving families across the city.",
    goalAmount: 25000,
    currentAmount: 9800,
    donorCount: 126,
    imageUrl:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
    videoUrl: null,
    mediaType: "image",
    status: "pending_approval",
  },
];

export const mockDonations: MockDonation[] = [
  {
    id: "donation-1",
    donorName: "Alex Morgan",
    campaignTitle: "Rebuild the Community Learning Center",
    amount: 125,
    date: "2026-06-08",
  },
  {
    id: "donation-2",
    donorName: "Taylor Smith",
    campaignTitle: "Emergency Medical Aid Fund",
    amount: 250,
    date: "2026-06-07",
  },
  {
    id: "donation-3",
    donorName: "Jordan Lee",
    campaignTitle: "Warm Meals for Local Shelters",
    amount: 75,
    date: "2026-06-06",
  },
];

export const mockStats = {
  totalRaised: 93850,
  activeCampaigns: mockCampaigns.filter((campaign) => campaign.status === "published")
    .length,
  totalDonors: mockCampaigns.reduce((total, campaign) => total + campaign.donorCount, 0),
  conversionRate: "12.4%",
};

export const mockDonorsByCampaign: Record<string, Array<{ id: string; name: string }>> = {
  "campaign-1": Array.from({ length: 18 }, (_, index) => ({
    id: `campaign-1-donor-${index + 1}`,
    name: `Mock donor ${index + 1}`,
  })),
  "campaign-2": Array.from({ length: 24 }, (_, index) => ({
    id: `campaign-2-donor-${index + 1}`,
    name: `Mock donor ${index + 1}`,
  })),
  "campaign-3": Array.from({ length: 9 }, (_, index) => ({
    id: `campaign-3-donor-${index + 1}`,
    name: `Mock donor ${index + 1}`,
  })),
};
