export const ALL_PERMISSIONS = [
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
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const DEFAULT_EMPLOYEE_PERMISSIONS: Permission[] = [
  "dashboard",
  "campaigns",
  "new_campaign",
  "my_prestige",
  "leaderboard",
  "finance",
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  dashboard: "Dashboard",
  campaigns: "Campaigns",
  new_campaign: "New Campaign",
  staff: "Staff",
  prestige: "Prestige (Admin)",
  my_prestige: "My Prestige",
  donors: "Donors",
  leaderboard: "Leaderboard",
  analytics: "Analytics",
  finance: "Finance",
  meta_assets: "Meta Assets",
  processors: "Processors",
};
