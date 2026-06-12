export type CampaignCategory =
  | "education"
  | "healthcare"
  | "disaster_relief"
  | "community"
  | "children"
  | "environment";

export type WizardData = {
  name: string;
  category: CampaignCategory;
  goalAmount: string;
  description: string;
  imageFile: File | null;
  imagePreview: string | null;
  videoFile: File | null;
  videoPreview: string | null;
};
