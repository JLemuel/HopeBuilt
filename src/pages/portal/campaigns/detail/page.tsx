import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import {
  ArrowLeft,
  ExternalLink,
  Trash2,
  FileEdit,
  EyeOff,
  Pencil,
  Check,
  X,
  DollarSign,
  Loader2,
  Sparkles,
  ImagePlus,
  Video,
  Save,
  Undo2,
  Maximize,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { getDisplayedAmount } from "@/pages/campaign/_lib/utils.ts";
import { useUserRole } from "@/hooks/use-user-role.ts";

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

/** Converts total minutes back to the best-fit value + unit pair */
function fromMinutes(totalMinutes: number): { value: string; unit: IntervalUnit } {
  if (totalMinutes >= 1440 && totalMinutes % 1440 === 0) {
    return { value: String(totalMinutes / 1440), unit: "days" };
  }
  if (totalMinutes >= 60 && totalMinutes % 60 === 0) {
    return { value: String(totalMinutes / 60), unit: "hours" };
  }
  if (totalMinutes >= 1) {
    return { value: String(totalMinutes), unit: "minutes" };
  }
  return { value: "1", unit: "minutes" };
}
import { Progress } from "@/components/ui/progress.tsx";
import CampaignDonations from "./_components/campaign-donations.tsx";
import CampaignRevenue from "./_components/campaign-revenue.tsx";
import AdLaunchStatus from "./_components/ad-launch-status.tsx";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  pending_launch: "bg-amber-100 text-amber-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_launch: "Pending Launch",
  published: "Launched",
  archived: "Archived",
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const campaign = useQuery(
    api.campaigns.getById,
    id ? { campaignId: id as Id<"campaigns"> } : "skip",
  );
  const updateCampaign = useMutation(api.campaigns.update);
  const deleteCampaign = useMutation(api.campaigns.deleteCampaign);
  const generateUploadUrl = useMutation(api.campaigns.generateUploadUrl);
  const generateCopy = useAction(api.ai.actions.generateCopy);

  // Inline editing toggles (for click-to-edit fields)
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [editingAmount, setEditingAmount] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);

  // Draft state for all editable fields
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftGoal, setDraftGoal] = useState("");
  const [draftAmount, setDraftAmount] = useState("");
  const [draftSlug, setDraftSlug] = useState("");
  const [draftSimEnabled, setDraftSimEnabled] = useState(false);
  const [draftDonorFeedIntervalValue, setDraftDonorFeedIntervalValue] = useState("1");
  const [draftDonorFeedIntervalUnit, setDraftDonorFeedIntervalUnit] = useState<IntervalUnit>("hours");
  const [draftDonorFeedMinAmount, setDraftDonorFeedMinAmount] = useState("10");
  const [draftDonorFeedMaxAmount, setDraftDonorFeedMaxAmount] = useState("100");

  // AI regenerate loading
  const [isRegeneratingTitle, setIsRegeneratingTitle] = useState(false);
  const [isRegeneratingDesc, setIsRegeneratingDesc] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Media upload (immediate — not part of save/discard)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  const handleVideoFullscreen = useCallback(() => {
    const video = videoElRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ("webkitEnterFullscreen" in video) {
      (video as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
    }
  }, []);

  // Global save state
  const [isSaving, setIsSaving] = useState(false);

  // Track whether we've initialized drafts from campaign data
  const initializedRef = useRef(false);

  // Initialize / re-sync drafts when campaign data loads
  useEffect(() => {
    if (campaign && !initializedRef.current) {
      setDraftTitle(campaign.title);
      setDraftDesc(campaign.description);
      setDraftGoal(String(campaign.goalAmount));
      setDraftAmount(String(campaign.currentAmount ?? 0));
      setDraftSlug(campaign.slug);
      setDraftSimEnabled(campaign.simulatedEnabled ?? false);
      const parsed = fromMinutes(campaign.donorFeedIntervalMinutes ?? 60);
      setDraftDonorFeedIntervalValue(parsed.value);
      setDraftDonorFeedIntervalUnit(parsed.unit);
      setDraftDonorFeedMinAmount(String(campaign.donorFeedMinAmount ?? 10));
      setDraftDonorFeedMaxAmount(String(campaign.donorFeedMaxAmount ?? 100));
      initializedRef.current = true;
    }
  }, [campaign]);

  // Detect unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!campaign) return false;
    const savedInterval = fromMinutes(campaign.donorFeedIntervalMinutes ?? 60);
    return (
      draftTitle !== campaign.title ||
      draftDesc !== campaign.description ||
      draftGoal !== String(campaign.goalAmount) ||
      draftAmount !== String(campaign.currentAmount ?? 0) ||
      draftSlug !== campaign.slug ||
      draftSimEnabled !== (campaign.simulatedEnabled ?? false) ||
      draftDonorFeedIntervalValue !== savedInterval.value ||
      draftDonorFeedIntervalUnit !== savedInterval.unit ||
      draftDonorFeedMinAmount !== String(campaign.donorFeedMinAmount ?? 10) ||
      draftDonorFeedMaxAmount !== String(campaign.donorFeedMaxAmount ?? 100)
    );
  }, [
    campaign,
    draftTitle,
    draftDesc,
    draftGoal,
    draftAmount,
    draftSlug,
    draftSimEnabled,
    draftDonorFeedIntervalValue,
    draftDonorFeedIntervalUnit,
    draftDonorFeedMinAmount,
    draftDonorFeedMaxAmount,
  ]);

  // Warn on browser close/refresh when unsaved changes exist
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // Confirm local edit for a field (just closes the inline editor, change is already in draft)
  const confirmField = useCallback(
    async (field: "title" | "description" | "goalAmount" | "currentAmount" | "slug") => {
      if (!id || !campaign) return;
      const updatePayload: Record<string, unknown> = {
        campaignId: id as Id<"campaigns">,
      };

      if (field === "title") {
        if (!draftTitle.trim()) {
          toast.error("Please enter a headline.");
          return;
        }
        if (draftTitle.trim() === campaign.title) {
          setEditingTitle(false);
          return;
        }
        updatePayload.title = draftTitle.trim();
      }
      if (field === "description") {
        if (draftDesc === campaign.description) {
          setEditingDesc(false);
          return;
        }
        updatePayload.description = draftDesc;
      }
      if (field === "goalAmount") {
        const num = Number(draftGoal);
        if (isNaN(num) || num < 0) {
          toast.error("Please enter a valid goal amount.");
          return;
        }
        if (num === campaign.goalAmount) {
          setEditingGoal(false);
          return;
        }
        updatePayload.goalAmount = num;
      }
      if (field === "currentAmount") {
        const num = Number(draftAmount);
        if (isNaN(num) || num < 0) {
          toast.error("Please enter a valid amount.");
          return;
        }
        // Ensure amount raised is always odd
        const finalAmount = num > 0 && num % 2 === 0 ? num + 1 : num;
        if (finalAmount !== num) {
          setDraftAmount(String(finalAmount));
        }
        if (finalAmount === (campaign.currentAmount ?? 0)) {
          setEditingAmount(false);
          return;
        }
        updatePayload.currentAmount = finalAmount;
      }
      if (field === "slug") {
        const trimmed = draftSlug
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
        if (!trimmed) {
          toast.error("Please enter a valid URL slug.");
          return;
        }
        setDraftSlug(trimmed);
        if (trimmed === campaign.slug) {
          setEditingSlug(false);
          return;
        }
        updatePayload.slug = trimmed;
      }

      setIsSaving(true);
      try {
        await updateCampaign(updatePayload as Parameters<typeof updateCampaign>[0]);
        toast.success("Saved!");
        if (field === "title") setEditingTitle(false);
        if (field === "description") setEditingDesc(false);
        if (field === "goalAmount") setEditingGoal(false);
        if (field === "currentAmount") setEditingAmount(false);
        if (field === "slug") setEditingSlug(false);
        // Reset initialized flag so drafts re-sync from updated campaign
        initializedRef.current = false;
      } catch (error) {
        if (error instanceof ConvexError) {
          const { message } = error.data as { code: string; message: string };
          toast.error(message);
        } else {
          toast.error("Failed to save.");
        }
      } finally {
        setIsSaving(false);
      }
    },
    [id, campaign, draftTitle, draftDesc, draftGoal, draftAmount, draftSlug, updateCampaign],
  );

  // Save all changes to DB
  const saveAllChanges = useCallback(async () => {
    if (!id || !campaign) return;

    // Validate
    if (!draftTitle.trim()) {
      toast.error("Headline cannot be empty.");
      return;
    }
    const goalNum = Number(draftGoal);
    if (isNaN(goalNum) || goalNum < 0) {
      toast.error("Please enter a valid goal amount.");
      return;
    }
    const amountNum = Number(draftAmount);
    if (isNaN(amountNum) || amountNum < 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        campaignId: id as Id<"campaigns">,
      };

      if (draftTitle !== campaign.title) payload.title = draftTitle.trim();
      if (draftDesc !== campaign.description) payload.description = draftDesc;
      if (draftGoal !== String(campaign.goalAmount)) payload.goalAmount = goalNum;
      if (draftAmount !== String(campaign.currentAmount ?? 0)) {
        // Ensure amount raised is always odd
        payload.currentAmount = amountNum > 0 && amountNum % 2 === 0 ? amountNum + 1 : amountNum;
      }

      // Slug change with uniqueness handled by backend
      if (draftSlug !== campaign.slug) {
        const trimmedSlug = draftSlug
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_]+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
        payload.slug = trimmedSlug;
      }

      // Sim settings
      if (draftSimEnabled !== (campaign.simulatedEnabled ?? false)) {
        payload.simulatedEnabled = draftSimEnabled;
      }

      // Donor feed settings
      if (draftSimEnabled) {
        const computedInterval = toMinutes(Number(draftDonorFeedIntervalValue) || 1, draftDonorFeedIntervalUnit);
        if (computedInterval !== (campaign.donorFeedIntervalMinutes ?? 60)) {
          payload.donorFeedIntervalMinutes = computedInterval;
        }
        if (draftDonorFeedMinAmount !== String(campaign.donorFeedMinAmount ?? 10)) {
          payload.donorFeedMinAmount = Number(draftDonorFeedMinAmount) || 10;
        }
        if (draftDonorFeedMaxAmount !== String(campaign.donorFeedMaxAmount ?? 100)) {
          payload.donorFeedMaxAmount = Number(draftDonorFeedMaxAmount) || 100;
        }
      }

      await updateCampaign(payload as Parameters<typeof updateCampaign>[0]);
      toast.success("All changes saved!");

      // Reset initialized flag so drafts re-sync from updated campaign
      initializedRef.current = false;

      // Close all editing modes
      setEditingTitle(false);
      setEditingDesc(false);
      setEditingGoal(false);
      setEditingAmount(false);
      setEditingSlug(false);
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Failed to save changes.");
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    id,
    campaign,
    draftTitle,
    draftDesc,
    draftGoal,
    draftAmount,
    draftSlug,
    draftSimEnabled,
    draftDonorFeedIntervalValue,
    draftDonorFeedIntervalUnit,
    draftDonorFeedMinAmount,
    draftDonorFeedMaxAmount,
    updateCampaign,
  ]);

  // Discard all changes
  const discardAllChanges = useCallback(() => {
    if (!campaign) return;
    setDraftTitle(campaign.title);
    setDraftDesc(campaign.description);
    setDraftGoal(String(campaign.goalAmount));
    setDraftAmount(String(campaign.currentAmount ?? 0));
    setDraftSlug(campaign.slug);
    setDraftSimEnabled(campaign.simulatedEnabled ?? false);
    const parsed = fromMinutes(campaign.donorFeedIntervalMinutes ?? 60);
    setDraftDonorFeedIntervalValue(parsed.value);
    setDraftDonorFeedIntervalUnit(parsed.unit);
    setDraftDonorFeedMinAmount(String(campaign.donorFeedMinAmount ?? 10));
    setDraftDonorFeedMaxAmount(String(campaign.donorFeedMaxAmount ?? 100));
    // Close all editing modes
    setEditingTitle(false);
    setEditingDesc(false);
    setEditingGoal(false);
    setEditingAmount(false);
    setEditingSlug(false);
    toast.info("Changes discarded.");
  }, [campaign]);

  // Publish dialog state
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishBudget, setPublishBudget] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Publish with budget
  const handlePublishWithBudget = useCallback(async () => {
    if (!id) return;
    setIsPublishing(true);
    try {
      const budgetCents = publishBudget ? Math.round(Number(publishBudget) * 100) : undefined;
      await updateCampaign({
        campaignId: id as Id<"campaigns">,
        status: "published",
        adBudgetCents: budgetCents,
      } as Parameters<typeof updateCampaign>[0]);
      toast.success("Campaign is now live!");
      setShowPublishDialog(false);
      setPublishBudget("");
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Failed to publish campaign.");
      }
    } finally {
      setIsPublishing(false);
    }
  }, [id, publishBudget, updateCampaign]);

  // Status changes remain immediate (separate from content edits)
  const handleStatusChange = async (
    newStatus: "draft" | "pending_launch" | "published" | "archived",
  ) => {
    if (!id) return;
    try {
      await updateCampaign({
        campaignId: id as Id<"campaigns">,
        status: newStatus,
      });
      toast.success(
        newStatus === "published"
          ? "Campaign launched!"
          : newStatus === "pending_launch"
            ? "Campaign moved to pending launch."
            : newStatus === "archived"
              ? "Campaign archived."
              : "Campaign moved to drafts.",
      );
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Failed to update campaign.");
      }
    }
  };

  // Media upload remains immediate (file uploads are async and complex to defer)
  const handleMediaUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !id) return;

      const isVideoFile = file.type.startsWith("video/");
      const isImageFile = file.type.startsWith("image/");
      if (!isVideoFile && !isImageFile) {
        toast.error("Please upload an image or video file.");
        return;
      }

      setIsUploadingMedia(true);
      try {
        const uploadUrl = await generateUploadUrl();
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = (await uploadResult.json()) as { storageId: string };

        const newMediaType = isVideoFile ? "video" : "image";
        const updatePayload: Record<string, unknown> = {
          campaignId: id as Id<"campaigns">,
          mediaType: newMediaType,
        };
        if (isVideoFile) {
          updatePayload.videoStorageId = storageId;
        } else {
          updatePayload.imageStorageId = storageId;
        }
        await updateCampaign(updatePayload as Parameters<typeof updateCampaign>[0]);
        toast.success("Media updated!");
      } catch (error) {
        if (error instanceof ConvexError) {
          const { message } = error.data as { code: string; message: string };
          toast.error(message);
        } else {
          toast.error("Failed to upload media.");
        }
      } finally {
        setIsUploadingMedia(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [id, generateUploadUrl, updateCampaign],
  );

  const handleRemoveMedia = useCallback(async () => {
    if (!id) return;
    try {
      await updateCampaign({
        campaignId: id as Id<"campaigns">,
        mediaType: "none",
      } as Parameters<typeof updateCampaign>[0]);
      toast.success("Media removed.");
    } catch {
      toast.error("Failed to remove media.");
    }
  }, [id, updateCampaign]);

  const handleRegenerateTitle = useCallback(async () => {
    if (!campaign) return;
    if (!draftTitle?.trim()) {
      toast.error("Please write a headline first before optimizing.");
      return;
    }
    setIsRegeneratingTitle(true);
    try {
      const result = await generateCopy({
        type: "headline",
        context: `Rewrite and optimize this existing headline. Keep the same meaning but make it more compelling, clear, and easy to read. Do NOT ask for more information. Do NOT include any instructions or meta-commentary. Just return the improved headline: "${draftTitle}"`,
        existingDescription: draftDesc || undefined,
      });
      const newTitle = result.text.trim();
      setDraftTitle(newTitle);
      setEditingTitle(true);
      toast.success("Headline optimized — review and save it.");
    } catch {
      toast.error("Failed to optimize headline.");
    } finally {
      setIsRegeneratingTitle(false);
    }
  }, [campaign, draftTitle, draftDesc, generateCopy]);

  const handleRegenerateDesc = useCallback(async () => {
    if (!campaign) return;
    if (!draftDesc?.replace(/<[^>]*>/g, "").trim()) {
      toast.error("Please write a description first before optimizing.");
      return;
    }
    setIsRegeneratingDesc(true);
    try {
      const result = await generateCopy({
        type: "description",
        context: `Rewrite and optimize the following campaign description. Keep the same meaning, story, and details but make it more compelling, clear, and easy to read. Do NOT ask for more information. Do NOT include any instructions or meta-commentary. Just return the improved description:\n\n${draftDesc}`,
        existingTitle: draftTitle || undefined,
      });
      const newDesc = result.text.trim();
      setDraftDesc(newDesc);
      setEditingDesc(true);
      toast.success("Description optimized — review and save it.");
    } catch {
      toast.error("Failed to optimize description.");
    } finally {
      setIsRegeneratingDesc(false);
    }
  }, [campaign, draftDesc, draftTitle, generateCopy]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteCampaign({ id: id as Id<"campaigns"> });
      toast.success("Campaign deleted.");
      navigate("/portal/campaigns");
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Failed to delete campaign.");
      }
      setIsDeleting(false);
    }
  }, [id, deleteCampaign, navigate]);

  if (campaign === undefined) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-3xl mx-auto">
        <p className="text-muted-foreground">Campaign not found.</p>
        <button
          onClick={() => navigate("/portal/campaigns")}
          className="text-sm text-[#1B4332] hover:underline mt-2 cursor-pointer"
        >
          Back to campaigns
        </button>
      </div>
    );
  }

  const displayedAmount = getDisplayedAmount(campaign);
  const progressPercent =
    campaign.goalAmount > 0
      ? Math.min(100, (displayedAmount / campaign.goalAmount) * 100)
      : 0;

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto pb-28">
      {/* Back */}
      <button
        onClick={() => navigate("/portal/campaigns")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to campaigns
      </button>

      {/* Header with editable title */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <div className="flex items-center gap-2 mb-1">
              <Input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="text-xl font-bold bg-background border-border text-foreground"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmField("title");
                  if (e.key === "Escape") {
                    setDraftTitle(campaign.title);
                    setEditingTitle(false);
                  }
                }}
              />
              <Button
                size="icon"
                className="shrink-0 h-9 w-9 bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                onClick={() => confirmField("title")}
              >
                <Check className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 h-9 w-9 border border-border cursor-pointer"
                onClick={() => {
                  setDraftTitle(campaign.title);
                  setEditingTitle(false);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1 group">
              <h1 className="text-2xl font-bold text-foreground truncate">
                {draftTitle || campaign.title}
              </h1>
              <Badge
                className={cn(
                  "text-xs capitalize shrink-0",
                  STATUS_STYLES[campaign.status] ?? "",
                )}
              >
                {STATUS_LABELS[campaign.status] ?? campaign.status}
              </Badge>
              <button
                onClick={() => {
                  setEditingTitle(true);
                }}
                className="shrink-0 cursor-pointer p-1 rounded hover:bg-accent transition-colors"
                title="Edit headline"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={handleRegenerateTitle}
                disabled={isRegeneratingTitle}
                className="shrink-0 cursor-pointer p-1 rounded hover:bg-accent transition-colors text-xs text-[#1B4332] flex items-center gap-1"
                title="Optimize headline"
              >
                {isRegeneratingTitle ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#1B4332] animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#1B4332]" />
                )}
                Optimize
              </button>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            {editingSlug ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-border bg-card overflow-hidden">
                  <span className="px-2 text-xs text-muted-foreground bg-muted py-1.5 border-r border-border shrink-0">
                    /campaign/
                  </span>
                  <input
                    value={draftSlug}
                    onChange={(e) => setDraftSlug(e.target.value)}
                    className="px-2 py-1.5 text-sm text-foreground outline-none bg-background w-40"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") confirmField("slug");
                      if (e.key === "Escape") {
                        setDraftSlug(campaign.slug);
                        setEditingSlug(false);
                      }
                    }}
                  />
                </div>
                <Button
                  size="icon"
                  className="h-7 w-7 bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                  onClick={() => confirmField("slug")}
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 border border-border cursor-pointer"
                  onClick={() => {
                    setDraftSlug(campaign.slug);
                    setEditingSlug(false);
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">/campaign/{draftSlug || campaign.slug}</p>
                <button
                  onClick={() => {
                    setEditingSlug(true);
                  }}
                  className="cursor-pointer p-1 rounded hover:bg-accent transition-colors"
                  title="Edit URL slug"
                >
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 shrink-0 flex-wrap">
          {(campaign.status === "pending_launch" || campaign.status === "draft") && (
            <>
              {isAdmin && (
                <Button
                  onClick={() => setShowPublishDialog(true)}
                  className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Launch
                </Button>
              )}
              <a
                href={`/campaign/${campaign.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Page
                </Button>
              </a>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
          {campaign.status === "published" && (
            <>
              <a
                href={`/campaign/${campaign.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Page
                </Button>
              </a>
              <Button
                variant="ghost"
                onClick={() => handleStatusChange("pending_launch")}
                className="border border-border text-amber-700 cursor-pointer"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Stop Ads
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
          {campaign.status === "archived" && (
            <>
              <Button
                variant="ghost"
                onClick={() => handleStatusChange("pending_launch")}
                className="border border-border cursor-pointer"
              >
                <FileEdit className="w-4 h-4 mr-2" />
                Restore
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(true)}
                className="border border-red-200 text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Media preview with upload/replace/remove */}
      <div className="mb-6">
        {campaign.mediaType === "video" && campaign.videoUrl ? (
          <div className="rounded-xl overflow-hidden border border-border bg-black">
            <div className="relative">
              <video
                ref={videoElRef}
                src={campaign.videoUrl}
                controls
                playsInline
                preload="auto"
                className="w-full block"
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
            <div className="flex items-center justify-between px-4 py-2 bg-muted border-t border-border">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="text-xs text-[#1B4332] hover:underline cursor-pointer flex items-center gap-1"
              >
                {isUploadingMedia ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
                Replace
              </button>
              <button
                onClick={handleRemoveMedia}
                className="text-xs text-red-600 hover:underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        ) : campaign.mediaType === "image" && campaign.imageUrl ? (
          <div className="rounded-xl overflow-hidden border border-border">
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="w-full h-auto max-h-[300px] object-cover"
            />
            <div className="flex items-center justify-between px-4 py-2 bg-muted border-t border-border">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingMedia}
                className="text-xs text-[#1B4332] hover:underline cursor-pointer flex items-center gap-1"
              >
                {isUploadingMedia ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
                Replace
              </button>
              <button
                onClick={handleRemoveMedia}
                className="text-xs text-red-600 hover:underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-xl cursor-pointer transition-colors",
              "flex flex-col items-center justify-center h-48",
              "border-border hover:border-[#1B4332] bg-muted",
            )}
          >
            {isUploadingMedia ? (
              <Loader2 className="w-6 h-6 text-[#1B4332] animate-spin" />
            ) : (
              <div className="flex flex-col items-center gap-2 py-8">
                <div className="flex gap-3">
                  <ImagePlus className="w-6 h-6 text-muted-foreground" />
                  <Video className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Click to upload an image or video</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF, MP4 up to 50MB</p>
              </div>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleMediaUpload}
          className="hidden"
        />
      </div>

      {/* Mini revenue dashboard */}
      <CampaignRevenue campaignId={id as Id<"campaigns">} campaignSlug={campaign.slug} isAdmin={isAdmin} />

      {/* Facebook Ad launch status */}
      <AdLaunchStatus campaignId={id as Id<"campaigns">} />

      {/* Donation history for this campaign — admin only */}
      {isAdmin && (
        <CampaignDonations
          campaignId={id as Id<"campaigns">}
          campaignTitle={campaign.title}
        />
      )}

      {/* Progress with editable amount and goal */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="flex flex-wrap items-baseline gap-2 mb-2">
          {editingAmount ? (
            <div className="flex items-center gap-2">
              <div className="relative w-28">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1B4332]" />
                <Input
                  type="number"
                  min="0"
                  value={draftAmount}
                  onChange={(e) => setDraftAmount(e.target.value)}
                  className="pl-6 h-8 text-sm font-bold bg-background border-border text-[#1B4332]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmField("currentAmount");
                    if (e.key === "Escape") {
                      setDraftAmount(String(campaign.currentAmount ?? 0));
                      setEditingAmount(false);
                    }
                  }}
                />
              </div>
              <Button
                size="icon"
                className="h-7 w-7 bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                onClick={() => confirmField("currentAmount")}
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 border border-border cursor-pointer"
                onClick={() => {
                  setDraftAmount(String(campaign.currentAmount ?? 0));
                  setEditingAmount(false);
                }}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <span className="text-xl font-bold text-[#1B4332] flex items-center gap-1.5">
              ${(draftAmount !== "" && draftAmount !== String(campaign.currentAmount ?? 0)
                ? Number(draftAmount) || 0
                : displayedAmount
              ).toLocaleString()}
              <button
                onClick={() => {
                  setEditingAmount(true);
                }}
                className="cursor-pointer p-1 rounded hover:bg-accent transition-colors"
                title="Edit amount raised"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </span>
          )}
          {editingGoal ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">raised of</span>
              <div className="relative w-28">
                <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  value={draftGoal}
                  onChange={(e) => setDraftGoal(e.target.value)}
                  className="pl-6 h-8 text-sm bg-background border-border text-foreground"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmField("goalAmount");
                    if (e.key === "Escape") {
                      setDraftGoal(String(campaign.goalAmount));
                      setEditingGoal(false);
                    }
                  }}
                />
              </div>
              <span className="text-sm text-muted-foreground">goal</span>
              <Button
                size="icon"
                className="h-7 w-7 bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                onClick={() => confirmField("goalAmount")}
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 border border-border cursor-pointer"
                onClick={() => {
                  setDraftGoal(String(campaign.goalAmount));
                  setEditingGoal(false);
                }}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground flex items-center gap-1.5">
              raised of $
              {(draftGoal !== "" && draftGoal !== String(campaign.goalAmount)
                ? Number(draftGoal) || 0
                : campaign.goalAmount
              ).toLocaleString()}{" "}
              goal
              <button
                onClick={() => {
                  setEditingGoal(true);
                }}
                className="cursor-pointer p-1 rounded hover:bg-accent transition-colors"
                title="Edit goal"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </span>
          )}
        </div>
        <Progress value={progressPercent} className="h-2 bg-muted" />
      </div>

      {/* Editable description */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Description</h2>
          {!editingDesc && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setEditingDesc(true);
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded hover:bg-accent transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
            </div>
          )}
        </div>
        {editingDesc ? (
          <div className="space-y-3">
            <RichTextEditor
              value={draftDesc}
              onChange={setDraftDesc}
              placeholder="Tell the story behind your campaign..."
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleRegenerateDesc}
                disabled={isRegeneratingDesc}
                className="flex items-center gap-1 text-xs text-[#1B4332] hover:text-[#1B4332]/80 cursor-pointer p-1 rounded hover:bg-accent transition-colors mr-auto"
                title="Optimize description"
              >
                {isRegeneratingDesc ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Optimize
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="border border-border cursor-pointer"
                onClick={() => {
                  setDraftDesc(campaign.description);
                  setEditingDesc(false);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                onClick={() => confirmField("description")}
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: draftDesc || campaign.description }}
          />
        )}
      </div>

      {/* Donation simulation settings (unified) */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-foreground">
            Donation Simulation
          </h2>
          <Switch
            checked={draftSimEnabled}
            onCheckedChange={(checked) => setDraftSimEnabled(checked)}
            className="cursor-pointer data-[state=checked]:bg-[#1B4332] data-[state=unchecked]:bg-muted-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Simulate donors appearing on the campaign page. Each simulated donor adds to the progress bar.
        </p>

        {draftSimEnabled && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">
                New donor every
              </Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={draftDonorFeedIntervalValue}
                  onChange={(e) => setDraftDonorFeedIntervalValue(e.target.value)}
                  className="w-20 bg-background border-border text-foreground text-sm"
                />
                <Select
                  value={draftDonorFeedIntervalUnit}
                  onValueChange={(v) => setDraftDonorFeedIntervalUnit(v as IntervalUnit)}
                >
                  <SelectTrigger className="w-32 bg-background border-border text-foreground text-sm cursor-pointer">
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
                <Select value={draftDonorFeedMinAmount} onValueChange={setDraftDonorFeedMinAmount}>
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
                <Select value={draftDonorFeedMaxAmount} onValueChange={setDraftDonorFeedMaxAmount}>
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
      </div>

      {/* ---- Unsaved changes bar ---- */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm shadow-lg">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground">
              You have unsaved changes
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={discardAllChanges}
                disabled={isSaving}
                className="border border-border cursor-pointer"
              >
                <Undo2 className="w-3.5 h-3.5 mr-1.5" />
                Discard
              </Button>
              <Button
                size="sm"
                onClick={saveAllChanges}
                disabled={isSaving}
                className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Delete campaign?
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              This action is permanent and affects your quota.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="border border-border cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Launch confirmation dialog with budget (Meta ads) */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Launch Campaign on Meta</DialogTitle>
            <DialogDescription>
              This will launch a Facebook &amp; Instagram ad for this campaign.
              Set a daily ad budget below, or leave blank to use the global default.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="publishBudget" className="text-sm font-medium text-foreground mb-2 block">
              Daily Ad Budget (optional)
            </Label>
            <div className="relative w-48">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                id="publishBudget"
                type="number"
                min="1"
                step="0.01"
                value={publishBudget}
                onChange={(e) => setPublishBudget(e.target.value)}
                placeholder="e.g. 20"
                className="pl-7 bg-background border-border text-foreground text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowPublishDialog(false)}
              disabled={isPublishing}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublishWithBudget}
              disabled={isPublishing}
              className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {isPublishing ? "Launching..." : "Launch on Meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
