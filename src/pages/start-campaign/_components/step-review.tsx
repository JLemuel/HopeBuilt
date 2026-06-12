import { Rocket, Loader2 } from "lucide-react";
import StepProgress from "./step-progress.tsx";
import type { WizardData, CampaignCategory } from "./types.ts";

const CATEGORY_LABELS: Record<CampaignCategory, string> = {
  education: "Education",
  healthcare: "Healthcare",
  disaster_relief: "Disaster Relief",
  community: "Community",
  children: "Children",
  environment: "Environment",
};

type StepReviewProps = {
  data: WizardData;
  onLaunch: () => void;
  onBack: () => void;
  onEditStep: (step: number) => void;
  isSubmitting: boolean;
  currentStep: number;
  totalSteps: number;
};

export default function StepReview({
  data,
  onLaunch,
  onBack,
  onEditStep,
  isSubmitting,
  currentStep,
  totalSteps,
}: StepReviewProps) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-[#121212] mb-1">Review & Submit</h2>
      <p className="text-sm text-[#525252] mb-4">
        Step {currentStep + 1} of {totalSteps} — Confirm and submit for review
      </p>
      <StepProgress currentStep={currentStep} totalSteps={totalSteps} />

      <div className="mt-8 space-y-4">
        {/* Campaign Basics */}
        <ReviewCard
          title="Campaign Basics"
          onEdit={() => onEditStep(0)}
        >
          <p className="text-sm font-medium text-[#121212]">{data.name}</p>
          <p className="text-xs text-[#525252] mt-1">
            Category: {CATEGORY_LABELS[data.category]} &middot; Goal: ${Number(data.goalAmount).toLocaleString()}
          </p>
        </ReviewCard>

        {/* Campaign Story */}
        <ReviewCard
          title="Campaign Story"
          onEdit={() => onEditStep(1)}
        >
          <p className="text-xs text-[#525252]">
            {data.description ? "Description added" : "No description"} &middot;{" "}
            {data.imageFile ? "Cover image uploaded" : "No cover image"} &middot;{" "}
            {data.videoFile ? "Video uploaded" : "No video"}
          </p>
        </ReviewCard>

        {/* Pending approval notice */}
        <div className="rounded-xl bg-[#3d8d7a]/10 border border-[#3d8d7a]/40 p-3.5">
          <p className="text-xs text-[#121212] leading-relaxed">
            After you sign up, your campaign will be submitted for review.
            Our team typically responds within 1–2 business days.
          </p>
        </div>

        {/* Submit button */}
        <button
          type="button"
          onClick={onLaunch}
          disabled={isSubmitting}
          className="w-full bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white font-semibold py-3.5 rounded-full transition-colors cursor-pointer text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              Submit Campaign
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full border border-[#c4c4c4] text-[#121212] font-semibold py-3.5 rounded-full transition-colors cursor-pointer text-sm hover:bg-[#f5f5f5] disabled:opacity-40"
        >
          Back to Story
        </button>
      </div>
    </div>
  );
}

function ReviewCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#cfcfcf] bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#121212]">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-[#2d6b5e] hover:text-[#1f4e44] font-semibold cursor-pointer"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}
