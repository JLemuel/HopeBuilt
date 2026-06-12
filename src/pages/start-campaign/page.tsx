import { useState, useRef, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { Link, useNavigate } from "react-router-dom";
import StepBasics from "./_components/step-basics.tsx";
import StepStory from "./_components/step-story.tsx";
import StepReview from "./_components/step-review.tsx";
import type { WizardData } from "./_components/types.ts";
import SeoHead from "@/components/seo-head.tsx";

const STEP_COUNT = 3;
const DRAFT_STORAGE_KEY = "start_campaign_draft_v1";

type PersistedDraft = {
  name: string;
  category: string;
  goalAmount: string;
  description: string;
  step: number;
};

function loadPersistedDraft(): PersistedDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedDraft;
    if (typeof parsed.name !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearPersistedDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Ignore (private mode, etc.)
  }
}

const STEP_LEFT_PANEL = [
  {
    heading: "Launch Your\nFirst Campaign",
    description: "Tell us the basics about your cause.\nWe'll guide you through everything step by step.",
  },
  {
    heading: "Tell Your\nStory",
    description: "A compelling story connects donors to your cause.\nShare what drives your mission.",
  },
  {
    heading: "Ready to\nSubmit!",
    description: "Review your campaign details and submit\nfor approval — we'll take it from there.",
  },
];

export default function StartCampaignPage() {
  const persisted = loadPersistedDraft();
  const [step, setStep] = useState(persisted?.step ?? 0);
  const navigate = useNavigate();

  // Form state
  const [data, setData] = useState<WizardData>({
    name: persisted?.name ?? "",
    category: (persisted?.category as WizardData["category"]) ?? "education",
    goalAmount: persisted?.goalAmount ?? "",
    description: persisted?.description ?? "",
    imageFile: null,
    imagePreview: null,
    videoFile: null,
    videoPreview: null,
  });

  // Persist text fields + current step on every change. Media files are
  // intentionally not persisted (File objects can't be serialized, and
  // re-uploading on reload would create stale storage entries).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const toSave: PersistedDraft = {
        name: data.name,
        category: data.category,
        goalAmount: data.goalAmount,
        description: data.description,
        step,
      };
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // Ignore (quota, private mode, etc.)
    }
  }, [data.name, data.category, data.goalAmount, data.description, step]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitDraft = useMutation(api.campaignDrafts.submit);
  const generateUploadUrl = useMutation(api.campaignDrafts.generateUploadUrl);

  // Track uploaded storage IDs so we don't re-upload on retry
  const uploadedImageStorageIdRef = useRef<string | null>(null);
  const uploadedVideoStorageIdRef = useRef<string | null>(null);

  const updateData = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  }, []);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const goToStep = useCallback((s: number) => {
    setStep(s);
  }, []);

  // Validate current step before proceeding
  const validateAndNext = useCallback(() => {
    if (step === 0) {
      if (!data.name.trim()) {
        toast.error("Please enter a campaign name.");
        return;
      }
      if (!data.goalAmount || Number(data.goalAmount) <= 0) {
        toast.error("Please enter a fundraising goal.");
        return;
      }
    }
    if (step === 1) {
      if (!data.description.trim()) {
        toast.error("Please add a campaign description.");
        return;
      }
    }
    goNext();
  }, [step, data, goNext]);

  // Upload a file to Convex storage, returning the storage id.
  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const json = (await result.json()) as { storageId: string };
      return json.storageId;
    },
    [generateUploadUrl],
  );

  // Submit draft and redirect to sign up
  const handleLaunch = useCallback(async () => {
    setIsSubmitting(true);
    try {
      // Upload image if present (cache to avoid re-upload on retry)
      let imageStorageId: string | undefined = uploadedImageStorageIdRef.current ?? undefined;
      if (data.imageFile && !imageStorageId) {
        imageStorageId = await uploadFile(data.imageFile);
        uploadedImageStorageIdRef.current = imageStorageId;
      }

      // Upload video if present
      let videoStorageId: string | undefined = uploadedVideoStorageIdRef.current ?? undefined;
      if (data.videoFile && !videoStorageId) {
        videoStorageId = await uploadFile(data.videoFile);
        uploadedVideoStorageIdRef.current = videoStorageId;
      }

      const draftId = await submitDraft({
        name: data.name.trim(),
        category: data.category,
        goalAmount: Number(data.goalAmount),
        description: data.description.trim(),
        imageStorageId: imageStorageId as Id<"_storage"> | undefined,
        videoStorageId: videoStorageId as Id<"_storage"> | undefined,
      });

      // Store draft ID so we can claim it after auth callback
      sessionStorage.setItem("pending_campaign_draft_id", draftId);
      sessionStorage.setItem("auth_return_path", "/start-campaign/success");

      // Draft is now server-side — clear the local in-progress copy.
      clearPersistedDraft();

      // Send the user to the login page; they can sign in or sign up there.
      // The draft id + return path are stashed in sessionStorage above so the
      // claim-draft step can pick them up after auth.
      navigate("/login");
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      setIsSubmitting(false);
    }
  }, [data, submitDraft, uploadFile, navigate]);

  const panel = STEP_LEFT_PANEL[step];

  return (
    <div className="flex min-h-screen">
      <SeoHead
        title="Start a campaign"
        description="Launch your fundraiser on HopeBuilt — tell your story, set a goal, and start receiving donations in days."
        canonicalPath="/start-campaign"
      />
      {/* Left panel — solid brand teal, identical to the home hero (#3d8d7a) */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#3d8d7a] flex-col justify-between p-10 xl:p-14 relative overflow-hidden">
        {/* Logo */}
        <Link to="/" className="cursor-pointer relative z-10">
          <img
            src="https://hercules-cdn.com/file_UhilzQ5c5eKlEltiVpI0Nvai"
            alt="HopeBuilt"
            className="h-7"
          />
        </Link>

        {/* Heading */}
        <div className="relative z-10">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight whitespace-pre-line">
            {panel.heading}
          </h1>
          <p className="text-white/90 text-sm mt-5 leading-relaxed whitespace-pre-line">
            {panel.description}
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 text-sm">
          <span className="text-white/85">Need help?</span>
          <Link to="/campaign-guide" className="text-[#fff597] hover:text-[#ddd47d] cursor-pointer transition-colors font-semibold">
            View our campaign guide
          </Link>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile logo */}
        <div className="lg:hidden px-5 py-4 border-b border-[#cfcfcf]">
          <Link to="/" className="cursor-pointer">
            <img
              src="https://hercules-cdn.com/file_ebZdt9zWl6O1Ze49Imb2v3LO"
              alt="HopeBuilt"
              className="h-7"
            />
          </Link>
        </div>

        <div className="flex-1 flex items-start justify-center px-5 sm:px-8 py-8 sm:py-12 overflow-auto">
          <div className="w-full max-w-md">
            {step === 0 && (
              <StepBasics
                data={data}
                updateData={updateData}
                onNext={validateAndNext}
                currentStep={step}
                totalSteps={STEP_COUNT}
              />
            )}
            {step === 1 && (
              <StepStory
                data={data}
                updateData={updateData}
                onNext={validateAndNext}
                onBack={goBack}
                currentStep={step}
                totalSteps={STEP_COUNT}
              />
            )}
            {step === 2 && (
              <StepReview
                data={data}
                onLaunch={handleLaunch}
                onBack={goBack}
                onEditStep={goToStep}
                isSubmitting={isSubmitting}
                currentStep={step}
                totalSteps={STEP_COUNT}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
