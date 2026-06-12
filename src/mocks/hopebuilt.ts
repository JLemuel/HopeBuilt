import { Flame } from "lucide-react";
import type {
  ActiveCampaignCard,
  DonorDonation,
  OrgCampaignRow,
  OrgDonation,
  OrgSupporterRow,
  RecurringSubscription,
  Stat,
  TopSupporterCard,
} from "@/lib/hopebuilt-types.ts";

// Type definitions live in src/lib/hopebuilt-types.ts (a mirrored file that
// transfers at handoff); re-exported here for convenience inside the sandbox.
export type {
  ActiveCampaignCard,
  CampaignIconKey,
  DonorDonation,
  OrgCampaignRow,
  OrgDonation,
  OrgSupporterRow,
  RecurringSubscription,
  Stat,
  StatusKey,
  TopSupporterCard,
} from "@/lib/hopebuilt-types.ts";

export const donorProfile = {
  initials: "SM",
  name: "Sarah Mitchell",
  email: "sarah.mitchell@email.com",
  memberLine: "Member since March 2026",
  badge: "6-month giving streak",
  badgeIcon: Flame,
  actionLabel: "Edit Profile",
};

export const orgProfile = {
  initials: "HF",
  name: "Hope Foundation",
  email: "hope@foundation.org",
  memberLine: "Verified Organization · Joined January 2026",
  badge: "✅ Verified Nonprofit",
  actionLabel: "Edit Organization",
};

export const donorStats: Record<"all" | "recurring" | "one-time", Stat[]> = {
  all: [
    { label: "Total Donated", value: "$1,250" },
    { label: "Campaigns Supported", value: "8" },
    { label: "Giving Streak", value: "6 months" },
  ],
  recurring: [
    { label: "Monthly Total", value: "$175" },
    { label: "Active Subscriptions", value: "4" },
    { label: "Next Payment", value: "May 1" },
  ],
  "one-time": [
    { label: "One-Time Total", value: "$450" },
    { label: "Campaigns Supported", value: "5" },
    { label: "Last Donation", value: "Feb 28" },
  ],
};

export const donorEmptyStats: Stat[] = [
  { label: "Total Donated", value: "$0" },
  { label: "Campaigns Supported", value: "0" },
  { label: "Giving Streak", value: "—" },
];

export const allDonations: DonorDonation[] = [
  {
    id: "don-1",
    campaign: "Clean Water Initiative",
    icon: "droplet",
    amount: "$50.00",
    date: "Apr 1, 2026",
    frequency: "Monthly",
    status: "Active",
    receiptAction: "Download Receipt",
  },
  {
    id: "don-2",
    campaign: "Rebuild Greenfield School",
    icon: "home",
    amount: "$100.00",
    date: "Mar 15, 2026",
    frequency: "Monthly",
    status: "Active",
    receiptAction: "Download Receipt",
  },
  {
    id: "don-3",
    campaign: "Flood Relief Medical Aid",
    icon: "heart",
    amount: "$75.00",
    date: "Feb 28, 2026",
    frequency: "One-Time",
    status: "Completed",
    receiptAction: "Download Receipt",
  },
  {
    id: "don-4",
    campaign: "Education for Every Child",
    icon: "book",
    amount: "$25.00",
    date: "Feb 1, 2026",
    frequency: "Monthly",
    status: "Active",
    receiptAction: "Download Receipt",
  },
  {
    id: "don-5",
    campaign: "Green Energy Initiative",
    icon: "sun",
    amount: "$200.00",
    date: "Jan 10, 2026",
    frequency: "One-Time",
    status: "Completed",
    receiptAction: "Download Receipt",
  },
];

export const recurringDonations: DonorDonation[] = [
  {
    id: "rec-1",
    campaign: "Clean Water Initiative",
    icon: "droplet",
    amount: "$50.00",
    date: "Apr 1, 2026",
    frequency: "Monthly",
    status: "Active",
    receiptAction: "Manage",
  },
  {
    id: "rec-2",
    campaign: "Rebuild Greenfield School",
    icon: "home",
    amount: "$100.00",
    date: "Mar 15, 2026",
    frequency: "Monthly",
    status: "Active",
    receiptAction: "Manage",
  },
  {
    id: "rec-3",
    campaign: "Community Garden Project",
    icon: "heart",
    amount: "$30.00",
    date: "Mar 1, 2026",
    frequency: "Quarterly",
    status: "Active",
    receiptAction: "Manage",
  },
  {
    id: "rec-4",
    campaign: "Education for Every Child",
    icon: "book",
    amount: "$25.00",
    date: "Feb 1, 2026",
    frequency: "Monthly",
    status: "Active",
    receiptAction: "Manage",
  },
  {
    id: "rec-5",
    campaign: "Water Well Maintenance",
    icon: "sun",
    amount: "$50.00",
    date: "Jan 15, 2026",
    frequency: "Monthly",
    status: "Active",
    receiptAction: "Manage",
  },
];

export const oneTimeDonations: DonorDonation[] = allDonations.map((donation) => ({
  ...donation,
  id: `one-${donation.id}`,
  frequency: "One-Time",
  status: "Completed",
}));

export const recurringSubscriptions: RecurringSubscription[] = [
  {
    id: "sub-1",
    campaign: "Clean Water Initiative",
    icon: "droplet",
    amountPerMonth: "$50/month",
    nextCharge: "Next charge: May 7, 2026",
    paymentMethod: "Visa ending 4242",
  },
  {
    id: "sub-2",
    campaign: "Rebuild Greenfield School",
    icon: "home",
    amountPerMonth: "$100/month",
    nextCharge: "Next charge: May 15, 2026",
    paymentMethod: "Visa ending 4242",
  },
  {
    id: "sub-3",
    campaign: "Education for Every Child",
    icon: "book",
    amountPerMonth: "$25/month",
    nextCharge: "Next charge: May 1, 2026",
    paymentMethod: "Visa ending 4242",
  },
];

export const orgStats: Record<"overview" | "campaigns" | "supporters", Stat[]> = {
  overview: [
    { label: "Total Raised", value: "$128,450" },
    { label: "Active Campaigns", value: "5" },
    { label: "Total Donors", value: "847" },
  ],
  campaigns: [
    { label: "Total Raised", value: "$128,450" },
    { label: "Active Campaigns", value: "5" },
    { label: "Total Donors", value: "847" },
  ],
  supporters: [
    { label: "Total Supporters", value: "847" },
    { label: "Avg. Donation", value: "$152" },
    { label: "Retention Rate", value: "78%" },
  ],
};

export const orgDonations: OrgDonation[] = [
  {
    id: "org-don-1",
    donor: "Sarah Mitchell",
    icon: "droplet",
    amount: "$50.00",
    date: "Apr 3, 2026",
    campaign: "Clean Water",
    method: "Visa ••42",
    status: "Completed",
  },
  {
    id: "org-don-2",
    donor: "John Cooper",
    icon: "home",
    amount: "$125.00",
    date: "Apr 1, 2026",
    campaign: "Clean Water",
    method: "Stripe",
    status: "Completed",
  },
  {
    id: "org-don-3",
    donor: "Emily Watson",
    icon: "heart",
    amount: "$75.00",
    date: "Mar 28, 2026",
    campaign: "School Build",
    method: "PayPal",
    status: "Completed",
  },
  {
    id: "org-don-4",
    donor: "David Chen",
    icon: "book",
    amount: "$200.00",
    date: "Mar 25, 2026",
    campaign: "Flood Relief",
    method: "Visa ••42",
    status: "Completed",
  },
  {
    id: "org-don-5",
    donor: "Maria Garcia",
    icon: "sun",
    amount: "$30.00",
    date: "Mar 20, 2026",
    campaign: "Clean Water",
    method: "Stripe",
    status: "Pending",
  },
];

export const orgCampaignRows: OrgCampaignRow[] = [
  {
    id: "org-camp-1",
    name: "Clean Water Initiative",
    icon: "droplet",
    goal: "$50,000",
    raised: "$32,450",
    donors: "124",
    status: "Active",
    action: "Edit",
  },
  {
    id: "org-camp-2",
    name: "School Building Fund",
    icon: "home",
    goal: "$75,000",
    raised: "$68,200",
    donors: "256",
    status: "Active",
    action: "Edit",
  },
  {
    id: "org-camp-3",
    name: "Medical Supplies Drive",
    icon: "heart",
    goal: "$25,000",
    raised: "$25,000",
    donors: "89",
    status: "Completed",
    action: "View",
  },
  {
    id: "org-camp-4",
    name: "Flood Relief Program",
    icon: "book",
    goal: "$100,000",
    raised: "$41,800",
    donors: "312",
    status: "Active",
    action: "Edit",
  },
  {
    id: "org-camp-5",
    name: "Community Garden",
    icon: "sun",
    goal: "$15,000",
    raised: "$8,750",
    donors: "47",
    status: "Paused",
    action: "Edit",
  },
];

export const orgSupporterRows: OrgSupporterRow[] = [
  {
    id: "org-sup-1",
    supporter: "Sarah Mitchell",
    icon: "droplet",
    totalGiven: "$1,250",
    lastDonation: "Apr 3, 2026",
    frequency: "Monthly",
    campaign: "Clean Water",
    status: "Completed",
  },
  {
    id: "org-sup-2",
    supporter: "John Cooper",
    icon: "home",
    totalGiven: "$3,400",
    lastDonation: "Apr 1, 2026",
    frequency: "One-Time",
    campaign: "School Build",
    status: "Completed",
  },
  {
    id: "org-sup-3",
    supporter: "Emily Watson",
    icon: "heart",
    totalGiven: "$890",
    lastDonation: "Mar 28, 2026",
    frequency: "Monthly",
    campaign: "Medical Supplies",
    status: "Completed",
  },
  {
    id: "org-sup-4",
    supporter: "David Chen",
    icon: "book",
    totalGiven: "$5,200",
    lastDonation: "Mar 25, 2026",
    frequency: "Quarterly",
    campaign: "Flood Relief",
    status: "Completed",
  },
  {
    id: "org-sup-5",
    supporter: "Maria Garcia",
    icon: "sun",
    totalGiven: "$450",
    lastDonation: "Mar 20, 2026",
    frequency: "One-Time",
    campaign: "Community Garden",
    status: "Inactive",
  },
];

export const activeCampaignCards: ActiveCampaignCard[] = [
  {
    id: "active-1",
    name: "Clean Water Initiative",
    icon: "droplet",
    raisedLine: "$32,450 raised of $50,000",
    fundedLine: "65% funded · 124 donors",
    endsLine: "Ends May 30, 2026",
    status: "Active",
    actions: ["View Details", "Edit Campaign"],
  },
  {
    id: "active-2",
    name: "Rebuild Greenfield School",
    icon: "home",
    raisedLine: "$67,890 raised of $100,000",
    fundedLine: "68% funded · 89 donors",
    endsLine: "Ends June 15, 2026",
    status: "Active",
    actions: ["View Details", "Edit Campaign"],
  },
  {
    id: "active-3",
    name: "Education for Every Child",
    icon: "book",
    raisedLine: "$25,000 raised of $25,000",
    fundedLine: "100% funded · 203 donors",
    endsLine: "Campaign completed",
    status: "Completed",
    actions: ["View Details", "View Report"],
  },
];

export const topSupporterCards: TopSupporterCard[] = [
  {
    id: "top-1",
    name: "David Chen",
    totalLine: "$5,200 total donated",
    frequencyLine: "Quarterly donor · 4 campaigns",
    memberLine: "Member since Jan 2025",
  },
  {
    id: "top-2",
    name: "John Cooper",
    totalLine: "$3,400 total donated",
    frequencyLine: "One-time donor · 2 campaigns",
    memberLine: "Member since Mar 2025",
  },
  {
    id: "top-3",
    name: "Sarah Mitchell",
    totalLine: "$1,250 total donated",
    frequencyLine: "Monthly donor · 3 campaigns",
    memberLine: "Member since Oct 2024",
  },
];
