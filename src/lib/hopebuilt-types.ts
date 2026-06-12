// View-model types for the HopeBuilt design system (stat cards, donation
// tables, subscription cards, org dashboards). These live in src/lib so
// mirrored pages/components never import from the sandbox-only src/mocks
// tree — at handoff this file transfers to the main app as-is, while the
// dummy datasets in src/mocks/hopebuilt.ts stay behind.

export type CampaignIconKey = "droplet" | "home" | "heart" | "book" | "sun" | "user";

export type StatusKey =
  | "active"
  | "completed"
  | "pending"
  | "paused"
  | "inactive"
  | "monthly"
  | "quarterly"
  | "one-time";

export type Stat = {
  label: string;
  value: string;
};

export type DonorDonation = {
  id: string;
  campaign: string;
  icon: CampaignIconKey;
  amount: string;
  date: string;
  frequency: "Monthly" | "Quarterly" | "One-Time";
  status: "Active" | "Completed";
  receiptAction: "Download Receipt" | "Manage";
};

export type RecurringSubscription = {
  id: string;
  campaign: string;
  icon: CampaignIconKey;
  amountPerMonth: string;
  nextCharge: string;
  paymentMethod: string;
};

export type OrgDonation = {
  id: string;
  donor: string;
  icon: CampaignIconKey;
  amount: string;
  date: string;
  campaign: string;
  method: string;
  status: "Completed" | "Pending";
};

export type OrgCampaignRow = {
  id: string;
  name: string;
  icon: CampaignIconKey;
  goal: string;
  raised: string;
  donors: string;
  status: "Active" | "Completed" | "Paused";
  action: "Edit" | "View";
};

export type OrgSupporterRow = {
  id: string;
  supporter: string;
  icon: CampaignIconKey;
  totalGiven: string;
  lastDonation: string;
  frequency: "Monthly" | "Quarterly" | "One-Time";
  campaign: string;
  status: "Completed" | "Inactive";
};

export type ActiveCampaignCard = {
  id: string;
  name: string;
  icon: CampaignIconKey;
  raisedLine: string;
  fundedLine: string;
  endsLine: string;
  status: "Active" | "Completed";
  actions: [string, string];
};

export type TopSupporterCard = {
  id: string;
  name: string;
  totalLine: string;
  frequencyLine: string;
  memberLine: string;
};
