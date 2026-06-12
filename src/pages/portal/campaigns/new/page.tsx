import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import {
  ImagePlus,
  Video,
  Sparkles,
  Loader2,
  DollarSign,
  ArrowLeft,
  Maximize,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import RichTextEditor from "@/components/ui/rich-text-editor.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { cn } from "@/lib/utils.ts";
import { slugify } from "@/lib/slug.ts";

type MediaType = "image" | "video" | "none";
type CampaignPreset = "none" | "medical" | "homeless" | "international";
type IntervalUnit = "seconds" | "minutes" | "hours" | "days";

/** Converts a value + unit pair to total minutes */
function toMinutes(value: number, unit: IntervalUnit): number {
  switch (unit) {
    case "seconds": return Math.max(1, Math.round(value / 60));
    case "minutes": return value;
    case "hours": return value * 60;
    case "days": return value * 1440;
  }
}

/** Returns a random integer between min and max (inclusive), rounded to the nearest 500. */
function randomInRange(min: number, max: number): number {
  const raw = Math.floor(Math.random() * (max - min + 1)) + min;
  return Math.round(raw / 500) * 500 || 500;
}

/** Returns a random round number in [min, max], rounded to the nearest step. */
function randomRoundInRange(min: number, max: number, step = 50): number {
  const raw = Math.floor(Math.random() * (max - min + 1)) + min;
  return Math.round(raw / step) * step || step;
}



const PRESET_CONFIG = {
  medical: {
    label: "Medical",
    goalRange: [15000, 85000] as const,
    goalRangeCancer: [50000, 85000] as const,
    raisedRange: [500, 1500] as const,
    donorFeedIntervalValue: "12",
    donorFeedIntervalUnit: "hours" as const,
    donorFeedMin: "5",
    donorFeedMax: "50",
  },
  homeless: {
    label: "Homeless",
    goalRange: [5000, 10000] as const,
    raisedRange: [5, 700] as const,
    donorFeedIntervalValue: "12",
    donorFeedIntervalUnit: "hours" as const,
    donorFeedMin: "5",
    donorFeedMax: "25",
  },
  international: {
    label: "International / Political",
    goalRange: [3000, 5000] as const,
    raisedRange: [20, 500] as const,
    donorFeedIntervalValue: "12",
    donorFeedIntervalUnit: "hours" as const,
    donorFeedMin: "5",
    donorFeedMax: "25",
  },
} as const;

export default function NewCampaignPage() {
  const navigate = useNavigate();
  const generateUploadUrl = useMutation(api.campaigns.generateUploadUrl);
  const createCampaign = useMutation(api.campaigns.create);
  const generateCopy = useAction(api.ai.actions.generateCopy);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("none");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  // Simulated donation state
  const [simEnabled, setSimEnabled] = useState(true);

  // Publish immediately


  // Preset state
  const [selectedPreset, setSelectedPreset] = useState<CampaignPreset>("none");
  const [isCancerRelated, setIsCancerRelated] = useState<boolean | null>(null);

  // Apply preset values
  const applyPreset = useCallback(
    (preset: CampaignPreset, cancer?: boolean | null) => {
      if (preset === "none") return;
      const config = PRESET_CONFIG[preset];

      // Determine goal range – for medical + cancer, use the higher range
      const goalRange =
        preset === "medical" && cancer === true
          ? PRESET_CONFIG.medical.goalRangeCancer
          : config.goalRange;

      setGoalAmount(String(randomInRange(goalRange[0], goalRange[1])));
      setCurrentAmount(String(randomRoundInRange(config.raisedRange[0], config.raisedRange[1])));
      setSimEnabled(true);
      setDonorFeedIntervalValue(config.donorFeedIntervalValue);
      setDonorFeedIntervalUnit(config.donorFeedIntervalUnit);
      setDonorFeedMinAmount(config.donorFeedMin);
      setDonorFeedMaxAmount(config.donorFeedMax);
    },
    [],
  );

  // Donor feed velocity settings (synced with simEnabled toggle)
  const [donorFeedIntervalValue, setDonorFeedIntervalValue] = useState("1");
  const [donorFeedIntervalUnit, setDonorFeedIntervalUnit] = useState<IntervalUnit>("hours");
  const [donorFeedMinAmount, setDonorFeedMinAmount] = useState("5");
  const [donorFeedMaxAmount, setDonorFeedMaxAmount] = useState("100");

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);

  const handleVideoFullscreen = useCallback(() => {
    const video = videoElRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ("webkitEnterFullscreen" in video) {
      (video as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
    }
  }, []);

  // Auto-generate slug from title
  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      if (!slugEdited) {
        setSlug(slugify(value));
      }
    },
    [slugEdited],
  );

  // Handle media file selection
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isVideo && !isImage) {
        toast.error("Please upload an image or video file.");
        return;
      }

      setMediaFile(file);
      setMediaType(isVideo ? "video" : "image");
      setMediaPreview(URL.createObjectURL(file));
    },
    [],
  );

  // Optimize description with AI
  const handleOptimizeDesc = useCallback(async () => {
    // Strip HTML tags to check for actual text content
    const plainText = description.replace(/<[^>]*>/g, "").trim();
    if (!plainText) {
      toast.error("Please write a description first before optimizing.");
      return;
    }
    setIsOptimizing(true);
    try {
      const result = await generateCopy({
        type: "description",
        context: `Rewrite and optimize the following campaign description. Keep the same meaning, story, and details but make it more compelling, clear, and easy to read. Do NOT ask for more information. Do NOT include any instructions or meta-commentary. Just return the improved description:\n\n${description}`,
        existingTitle: title || undefined,
      });
      setDescription(result.text.trim());
      toast.success("Description optimized!");
    } catch {
      toast.error("Failed to optimize description. Please try again.");
    } finally {
      setIsOptimizing(false);
    }
  }, [description, title, generateCopy]);

  // Submit campaign
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!title.trim()) {
        toast.error("Please enter a headline.");
        return;
      }
      if (!description.trim()) {
        toast.error("Please enter a description.");
        return;
      }
      if (!goalAmount || Number(goalAmount) <= 0) {
        toast.error("Please enter a valid goal amount.");
        return;
      }

      setIsSubmitting(true);

      try {
        // Upload media if selected
        let imageStorageId: string | undefined;
        let videoStorageId: string | undefined;

        if (mediaFile) {
          const uploadUrl = await generateUploadUrl();
          const uploadResult = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": mediaFile.type },
            body: mediaFile,
          });
          const { storageId } = (await uploadResult.json()) as {
            storageId: string;
          };

          if (mediaType === "image") {
            imageStorageId = storageId;
          } else {
            videoStorageId = storageId;
          }
        }

        const finalSlug = slug.trim() || slugify(title);

        // Storage IDs from the upload response are valid Convex storage IDs
        await createCampaign({
          title: title.trim(),
          slug: finalSlug,
          description: description.trim(),
          goalAmount: Number(goalAmount),
          currentAmount: Number(currentAmount) || 0,
          imageStorageId: imageStorageId as Id<"_storage"> | undefined,
          videoStorageId: videoStorageId as Id<"_storage"> | undefined,
          mediaType,
          simulatedEnabled: simEnabled,
          donorFeedIntervalMinutes: simEnabled ? toMinutes(Number(donorFeedIntervalValue) || 1, donorFeedIntervalUnit) : undefined,
          donorFeedMinAmount: simEnabled ? Number(donorFeedMinAmount) || 5 : undefined,
          donorFeedMaxAmount: simEnabled ? Number(donorFeedMaxAmount) || 100 : undefined,
        });

        toast.success("Campaign created successfully!");
        navigate("/portal/campaigns");
      } catch (error) {
        if (error instanceof ConvexError) {
          const { message } = error.data as { code: string; message: string };
          toast.error(message);
        } else {
          toast.error("Failed to create campaign. Please try again.");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      title,
      slug,
      description,
      goalAmount,
      mediaFile,
      mediaType,
      simEnabled,
      donorFeedIntervalValue,
      donorFeedIntervalUnit,
      donorFeedMinAmount,
      donorFeedMaxAmount,
      currentAmount,
      generateUploadUrl,
      createCampaign,
      navigate,
    ],
  );

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate("/portal/campaigns")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to campaigns
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-6">
        Create Campaign
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ---- Media upload ---- */}
        <section>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Campaign Image or Video
          </Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-xl cursor-pointer transition-colors",
              "flex flex-col items-center justify-center overflow-hidden",
              mediaPreview
                ? "border-[#1B4332] bg-[#1B4332]/5 dark:bg-[#1B4332]/20"
                : "border-border hover:border-[#1B4332] bg-muted",
              mediaPreview ? "h-auto" : "h-48",
            )}
          >
            {mediaPreview ? (
              mediaType === "video" ? (
                <div className="relative w-full bg-black rounded-xl" onClick={(e) => e.stopPropagation()}>
                  <video
                    ref={videoElRef}
                    src={mediaPreview}
                    controls
                    className="w-full block rounded-xl"
                    style={{ objectFit: "contain" }}
                  />
                  <button
                    type="button"
                    onClick={handleVideoFullscreen}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm"
                    title="Fullscreen"
                  >
                    <Maximize className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="w-full max-h-64 object-contain"
                />
              )
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <div className="flex gap-3">
                  <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  <Video className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Click to upload an image or video
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, GIF, MP4 up to 50MB
                </p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {mediaPreview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMediaFile(null);
                setMediaPreview(null);
                setMediaType("none");
              }}
              className="mt-2 text-xs text-red-600 hover:underline cursor-pointer"
            >
              Remove media
            </button>
          )}
        </section>

        {/* ---- Headline ---- */}
        <section>
          <Label
            htmlFor="title"
            className="text-sm font-medium text-foreground mb-2 block"
          >
            Headline
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Hope and Healing for Ryleigh's Fight"
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </section>

        {/* ---- URL slug ---- */}
        <section>
          <Label
            htmlFor="slug"
            className="text-sm font-medium text-foreground mb-2 block"
          >
            Campaign URL
          </Label>
          <div className="flex items-center rounded-lg border border-border bg-card overflow-hidden">
            <span className="px-3 text-sm text-muted-foreground bg-muted py-2.5 border-r border-border shrink-0">
              /campaign/
            </span>
            <input
              id="slug"
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value));
                setSlugEdited(true);
              }}
              placeholder="your-campaign-slug"
              className="flex-1 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none bg-background"
            />
          </div>
        </section>

        {/* ---- Description ---- */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <Label
              htmlFor="description"
              className="text-sm font-medium text-foreground"
            >
              Description
            </Label>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleOptimizeDesc}
              disabled={isOptimizing || !description.replace(/<[^>]*>/g, "").trim()}
              className="text-[#1B4332] dark:text-emerald-400 hover:bg-[#1B4332]/10 cursor-pointer h-7 text-xs"
            >
              {isOptimizing ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 mr-1" />
              )}
              Optimize
            </Button>
          </div>
          <RichTextEditor
            value={description}
            onChange={setDescription}
            placeholder="Tell the story behind your campaign..."
          />
        </section>

        {/* ---- Category Preset ---- */}
        <section className="rounded-xl border border-border bg-muted p-5">
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Campaign Category Preset
          </Label>
          <p className="text-xs text-muted-foreground mb-3">
            Choose a category to auto-fill recommended settings.
          </p>
          <Select
            value={selectedPreset}
            onValueChange={(v) => {
              const preset = v as CampaignPreset;
              setSelectedPreset(preset);
              setIsCancerRelated(null);
              if (preset !== "medical") {
                applyPreset(preset);
              }
            }}
          >
            <SelectTrigger className="bg-card border-border text-foreground text-sm cursor-pointer">
              <SelectValue placeholder="Select a category..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="cursor-pointer">
                No preset (manual)
              </SelectItem>
              <SelectItem value="medical" className="cursor-pointer">
                Medical
              </SelectItem>
              <SelectItem value="homeless" className="cursor-pointer">
                Homeless
              </SelectItem>
              <SelectItem value="international" className="cursor-pointer">
                International / Political
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Medical follow-up: cancer questionnaire */}
          {selectedPreset === "medical" && (
            <div className="mt-4 rounded-lg border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground mb-3">
                Is this cancer-related?
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    "cursor-pointer rounded-lg px-6",
                    isCancerRelated === true
                      ? "bg-[#1B4332] text-white hover:bg-[#1B4332]/90"
                      : "bg-card text-foreground border border-border hover:bg-accent",
                  )}
                  onClick={() => {
                    setIsCancerRelated(true);
                    applyPreset("medical", true);
                  }}
                >
                  Yes
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    "cursor-pointer rounded-lg px-6",
                    isCancerRelated === false
                      ? "bg-[#1B4332] text-white hover:bg-[#1B4332]/90"
                      : "bg-card text-foreground border border-border hover:bg-accent",
                  )}
                  onClick={() => {
                    setIsCancerRelated(false);
                    applyPreset("medical", false);
                  }}
                >
                  No
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isCancerRelated === true
                  ? "Campaign goal set to higher range ($50,000 – $85,000)."
                  : isCancerRelated === false
                    ? "Campaign goal set to standard medical range ($15,000 – $85,000)."
                    : "Please select to auto-fill campaign settings."}
              </p>
            </div>
          )}
        </section>

        {/* ---- Goal amount ---- */}
        <section>
          <Label
            htmlFor="goal"
            className="text-sm font-medium text-foreground mb-2 block"
          >
            Campaign Goal
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="goal"
              type="number"
              min="1"
              value={goalAmount}
              onChange={(e) => setGoalAmount(e.target.value)}
              placeholder="10000"
              className="pl-8 bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Make sure the goal aligns with the campaign shown in your video.
          </p>
        </section>

        {/* ---- Amount raised ---- */}
        <section>
          <Label
            htmlFor="currentAmount"
            className="text-sm font-medium text-foreground mb-2 block"
          >
            Amount Raised
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Set a starting amount if donations have already been collected.
          </p>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="currentAmount"
              type="number"
              min="0"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              placeholder="0"
              className="pl-8 bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </section>

        {/* ---- Donation simulation ---- */}
        <section className="rounded-xl border border-border bg-muted p-5">
          <div className="flex items-center justify-between mb-1">
            <Label className="text-sm font-medium text-foreground">
              Donation Simulation
            </Label>
            <Switch
              checked={simEnabled}
              onCheckedChange={setSimEnabled}
              className="cursor-pointer"
            />
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Simulate donors appearing on the campaign page. Each simulated donor adds to the progress bar.
          </p>

          {simEnabled && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">
                  New donor every
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    value={donorFeedIntervalValue}
                    onChange={(e) => setDonorFeedIntervalValue(e.target.value)}
                    className="w-20 bg-background border-border text-foreground text-sm"
                  />
                  <Select
                    value={donorFeedIntervalUnit}
                    onValueChange={(v) => setDonorFeedIntervalUnit(v as IntervalUnit)}
                  >
                    <SelectTrigger className="w-32 bg-card border-border text-foreground text-sm cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconds" className="cursor-pointer">second(s)</SelectItem>
                      <SelectItem value="minutes" className="cursor-pointer">minute(s)</SelectItem>
                      <SelectItem value="hours" className="cursor-pointer">hour(s)</SelectItem>
                      <SelectItem value="days" className="cursor-pointer">day(s)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Min amount
                  </Label>
                  <Select value={donorFeedMinAmount} onValueChange={setDonorFeedMinAmount}>
                    <SelectTrigger className="bg-background border-border text-foreground text-sm cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5" className="cursor-pointer">$5</SelectItem>
                      <SelectItem value="10" className="cursor-pointer">$10</SelectItem>
                      <SelectItem value="25" className="cursor-pointer">$25</SelectItem>
                      <SelectItem value="50" className="cursor-pointer">$50</SelectItem>
                      <SelectItem value="100" className="cursor-pointer">$100</SelectItem>
                      <SelectItem value="200" className="cursor-pointer">$200</SelectItem>
                      <SelectItem value="300" className="cursor-pointer">$300</SelectItem>
                      <SelectItem value="500" className="cursor-pointer">$500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Max amount
                  </Label>
                  <Select value={donorFeedMaxAmount} onValueChange={setDonorFeedMaxAmount}>
                    <SelectTrigger className="bg-background border-border text-foreground text-sm cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5" className="cursor-pointer">$5</SelectItem>
                      <SelectItem value="10" className="cursor-pointer">$10</SelectItem>
                      <SelectItem value="25" className="cursor-pointer">$25</SelectItem>
                      <SelectItem value="50" className="cursor-pointer">$50</SelectItem>
                      <SelectItem value="100" className="cursor-pointer">$100</SelectItem>
                      <SelectItem value="200" className="cursor-pointer">$200</SelectItem>
                      <SelectItem value="300" className="cursor-pointer">$300</SelectItem>
                      <SelectItem value="500" className="cursor-pointer">$500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ---- Submit ---- */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/portal/campaigns")}
            className="cursor-pointer text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Campaign"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
