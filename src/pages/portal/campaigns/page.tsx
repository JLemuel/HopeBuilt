import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { useUserRole } from "@/hooks/use-user-role.ts";
import {
  PlusCircle,
  ExternalLink,
  Search,
  DollarSign,
  Trash2,
  CheckSquare,
  Zap,
  Eye,
  ArrowRightLeft,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  MousePointerClick,
  Target,
  Wallet,
  BarChart3,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import { cn } from "@/lib/utils.ts";
import type React from "react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import LaunchDialog from "./_components/launch-dialog.tsx";
import type { AdLaunchConfig } from "./_components/launch-dialog.tsx";

type TabKey = "all" | "pending_approval" | "pending_launch" | "launched" | "relaunch" | "archive";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800",
  pending_approval: "bg-blue-100 text-blue-800",
  pending_launch: "bg-amber-100 text-amber-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-gray-100 text-gray-600",
  needs_relaunch: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  pending_launch: "Pending Launch",
  published: "Launched",
  archived: "Archived",
  needs_relaunch: "Needs Relaunch",
};

/** Extract a human-readable error from a relaunchReason that may contain raw JSON. */
function parseRelaunchReason(raw: string): string {
  // Try to extract a "message" field from embedded JSON
  const jsonMatch = raw.match(/\{[\s\S]*"message"\s*:\s*"([^"]+)"/);
  if (jsonMatch?.[1]) {
    // Strip the JSON prefix (e.g. "Video upload to Meta failed: {…}" → clean message)
    const prefix = raw.substring(0, raw.indexOf("{")).replace(/:\s*$/, "").trim();
    return prefix ? `${prefix}: ${jsonMatch[1]}` : jsonMatch[1];
  }
  return raw;
}

export default function CampaignsListPage() {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const campaigns = useQuery(api.campaigns.list);
  const deleteCampaign = useMutation(api.campaigns.deleteCampaign);
  const bulkQuickLaunch = useMutation(api.campaigns.bulkQuickLaunch);
  const relaunchCampaigns = useMutation(api.campaigns.relaunchCampaigns);
  const relaunchFromArchive = useMutation(api.campaigns.relaunchFromArchive);
  const archiveCampaignsMutation = useMutation(api.campaigns.archiveCampaigns);
  const reviewPendingApproval = useMutation(api.campaigns.reviewPendingApproval);

  // Meta ad insights for all campaigns
  const allCampaignIds = useMemo(
    () => (campaigns ?? []).map((c) => c._id),
    [campaigns],
  );
  const metaInsights = useQuery(
    api.meta.insightsHelpers.getBatchInsights,
    allCampaignIds.length > 0 ? { campaignIds: allCampaignIds } : "skip",
  );
  const refreshInsights = useMutation(api.meta.refreshInsights.refreshInsights);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Collect all slugs for batch analytics query
  const allSlugs = useMemo(
    () => (campaigns ?? []).map((c) => c.slug),
    [campaigns],
  );
  const campaignStats = useQuery(
    api.pageViews.getCampaignStatsBatch,
    allSlugs.length > 0 ? { slugs: allSlugs } : "skip",
  );

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<Id<"campaigns">>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Launch & Relaunch dialog state
  const [showLaunchDialog, setShowLaunchDialog] = useState(false);
  const [showRelaunchDialog, setShowRelaunchDialog] = useState(false);
  const [showArchiveRelaunchConfirm, setShowArchiveRelaunchConfirm] = useState(false);
  const [isArchiveRelaunching, setIsArchiveRelaunching] = useState(false);

  // Fetch saved launch config for the first selected campaign (used in relaunch dialog)
  const firstSelectedId = useMemo(() => {
    const arr = Array.from(selected);
    return arr.length > 0 ? arr[0] : null;
  }, [selected]);
  const savedLaunchConfig = useQuery(
    api.meta.adDefaults.getLastLaunchConfig,
    showRelaunchDialog && firstSelectedId ? { campaignId: firstSelectedId } : "skip",
  );

  function toggleSelect(id: Id<"campaigns">) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
  }

  function switchTab(tab: TabKey) {
    setActiveTab(tab);
    exitSelectMode();
    setSearch("");
  }

  async function handleDeleteSelected() {
    setIsDeleting(true);
    try {
      const ids = Array.from(selected);
      for (const id of ids) {
        await deleteCampaign({ id });
      }
      toast.success(
        `${ids.length} campaign${ids.length !== 1 ? "s" : ""} permanently deleted`,
      );
      setShowDeleteConfirm(false);
      exitSelectMode();
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to delete campaigns");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleLaunch(config: AdLaunchConfig, budgets: Record<string, number>) {
    const ids = Array.from(selected);
    const hasBudgets = Object.keys(budgets).length > 0;
    const results = await bulkQuickLaunch({
      campaignIds: ids,
      budgets: hasBudgets ? (budgets as Record<Id<"campaigns">, number>) : undefined,
      adAccountMetaId: config.adAccountMetaId,
      pixelMetaId: config.pixelMetaId,
      pageMetaId: config.pageMetaId,
      instagramAccountMetaId: config.instagramAccountMetaId,
      objective: config.objective,
      cboEnabled: config.cboEnabled,
      cboBudgetCents: config.cboBudgetCents,
      optimizationGoal: config.optimizationGoal,
      bidStrategy: config.bidStrategy,
      bidAmountCents: config.bidAmountCents,
      conversionEvent: config.conversionEvent,
      targetingCountries: config.targetingCountries,
      targetingAgeMin: config.targetingAgeMin,
      targetingAgeMax: config.targetingAgeMax,
      cta: config.cta,
      scheduledStartTime: config.scheduledStartTime,
    });

    const succeeded = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    if (succeeded.length > 0) {
      toast.success(
        `${succeeded.length} campaign${succeeded.length !== 1 ? "s" : ""} launched on Meta!`,
      );
    }
    if (failed.length > 0) {
      for (const f of failed) {
        toast.error(`"${f.title}" failed: ${f.error ?? "Unknown error"}`);
      }
    }
    exitSelectMode();
  }

  async function handleRelaunch(config: AdLaunchConfig, budgets: Record<string, number>) {
    const ids = Array.from(selected);
    const hasBudgets = Object.keys(budgets).length > 0;
    const results = await relaunchCampaigns({
      campaignIds: ids,
      budgets: hasBudgets ? (budgets as Record<Id<"campaigns">, number>) : undefined,
      adAccountMetaId: config.adAccountMetaId,
      pixelMetaId: config.pixelMetaId,
      pageMetaId: config.pageMetaId,
      instagramAccountMetaId: config.instagramAccountMetaId,
      objective: config.objective,
      cboEnabled: config.cboEnabled,
      cboBudgetCents: config.cboBudgetCents,
      optimizationGoal: config.optimizationGoal,
      bidStrategy: config.bidStrategy,
      bidAmountCents: config.bidAmountCents,
      conversionEvent: config.conversionEvent,
      targetingCountries: config.targetingCountries,
      targetingAgeMin: config.targetingAgeMin,
      targetingAgeMax: config.targetingAgeMax,
      cta: config.cta,
      scheduledStartTime: config.scheduledStartTime,
    });

    const succeeded = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    if (succeeded.length > 0) {
      toast.success(
        `${succeeded.length} campaign${succeeded.length !== 1 ? "s" : ""} relaunched!`,
      );
    }
    if (failed.length > 0) {
      for (const f of failed) {
        toast.error(`"${f.title}" failed: ${f.error ?? "Unknown error"}`);
      }
    }
    exitSelectMode();
  }

  async function handleArchiveSelected() {
    const ids = Array.from(selected) as Id<"campaigns">[];
    if (ids.length === 0) return;
    try {
      const results = await archiveCampaignsMutation({ campaignIds: ids });
      const succeeded = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);
      if (succeeded.length > 0) {
        toast.success(
          `${succeeded.length} campaign${succeeded.length !== 1 ? "s" : ""} archived — ads paused on Meta`,
        );
      }
      if (failed.length > 0) {
        for (const f of failed) {
          toast.error(`"${f.title}" failed: ${f.error ?? "Unknown error"}`);
        }
      }
    } catch {
      toast.error("Failed to archive campaigns");
    }
    exitSelectMode();
  }

  async function handleArchiveRelaunch() {
    setIsArchiveRelaunching(true);
    try {
      const ids = Array.from(selected) as Id<"campaigns">[];
      const results = await relaunchFromArchive({ campaignIds: ids });
      const succeeded = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);
      if (succeeded.length > 0) {
        toast.success(
          `${succeeded.length} campaign${succeeded.length !== 1 ? "s" : ""} relaunched with original settings!`,
        );
      }
      if (failed.length > 0) {
        for (const f of failed) {
          toast.error(`"${f.title}" failed: ${f.error ?? "Unknown error"}`);
        }
      }
    } catch {
      toast.error("Failed to relaunch campaigns");
    } finally {
      setIsArchiveRelaunching(false);
      setShowArchiveRelaunchConfirm(false);
      exitSelectMode();
    }
  }

  // Split campaigns by status (safe when campaigns is undefined)
  const safeList = campaigns ?? [];
  const pendingApproval = safeList.filter((c) => c.status === "pending_approval");
  const pendingLaunch = safeList.filter((c) => c.status === "pending_launch" || c.status === "draft");
  const launched = safeList.filter((c) => c.status === "published");
  const needsRelaunch = safeList.filter((c) => c.status === "needs_relaunch");
  const archived = safeList.filter((c) => c.status === "archived");

  const currentList =
    activeTab === "all"
      ? safeList
      : activeTab === "pending_approval"
        ? pendingApproval
        : activeTab === "pending_launch"
          ? pendingLaunch
          : activeTab === "launched"
            ? launched
            : activeTab === "archive"
              ? archived
              : needsRelaunch;

  async function handleReviewCampaign(
    campaignId: Id<"campaigns">,
    decision: "approve" | "reject",
    title: string,
  ) {
    try {
      await reviewPendingApproval({ campaignId, decision });
      toast.success(
        decision === "approve"
          ? `"${title}" approved and moved to Pending Launch.`
          : `"${title}" was rejected.`,
      );
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to update campaign");
      }
    }
  }

  // Apply search filter
  const filtered = currentList.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      (c.creatorEmail ?? "").toLowerCase().includes(q) ||
      (c.creatorName ?? "").toLowerCase().includes(q)
    );
  });

  // Group by staff member for the "All" tab
  const groupedByStaff = useMemo(() => {
    if (activeTab !== "all") return null;
    const groups: Record<string, { name: string; email: string; campaigns: typeof filtered }> = {};
    for (const c of filtered) {
      const key = c.createdBy ?? "unknown";
      if (!groups[key]) {
        groups[key] = {
          name: c.creatorName ?? "Unknown",
          email: c.creatorEmail ?? "",
          campaigns: [],
        };
      }
      groups[key].campaigns.push(c);
    }
    // Sort groups by name
    return Object.entries(groups).sort((a, b) =>
      a[1].name.localeCompare(b[1].name),
    );
  }, [activeTab, filtered]);

  if (campaigns === undefined) {
    return (
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 py-6 md:py-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAdmin ? "All Campaigns" : "Campaigns"}
          </h1>
          {isAdmin && (
            <p className="text-sm text-muted-foreground mt-1">
              {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}{" "}
              across all staff
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <Button
                variant="ghost"
                onClick={exitSelectMode}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              {activeTab === "pending_launch" && isAdmin && (
                <Button
                  onClick={() => setShowLaunchDialog(true)}
                  disabled={selected.size === 0}
                  className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Launch ({selected.size})
                </Button>
              )}
              {activeTab === "relaunch" && isAdmin && (
                <Button
                  onClick={() => setShowRelaunchDialog(true)}
                  disabled={selected.size === 0}
                  className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Relaunch ({selected.size})
                </Button>
              )}
              {activeTab === "launched" && isAdmin && (
                <Button
                  onClick={handleArchiveSelected}
                  disabled={selected.size === 0}
                  className="bg-gray-600 hover:bg-gray-700 text-white cursor-pointer"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive ({selected.size})
                </Button>
              )}
              {activeTab === "archive" && isAdmin && (
                <Button
                  onClick={() => setShowArchiveRelaunchConfirm(true)}
                  disabled={selected.size === 0}
                  className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Relaunch ({selected.size})
                </Button>
              )}
              {isAdmin && (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={selected.size === 0}
                  className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selected.size})
                </Button>
              )}
            </>
          ) : (
            <>
              {currentList.length > 0 && isAdmin && (
                <Button
                  variant="ghost"
                  onClick={() => setSelectMode(true)}
                  className="cursor-pointer text-muted-foreground"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Select
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="ghost"
                  onClick={async () => {
                    setIsRefreshing(true);
                    try {
                      await refreshInsights({});
                      toast.success("Meta insights refreshing...");
                    } catch {
                      toast.error("Failed to refresh insights");
                    } finally {
                      setIsRefreshing(false);
                    }
                  }}
                  disabled={isRefreshing}
                  className="cursor-pointer text-muted-foreground"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
                  {isRefreshing ? "Refreshing..." : "Refresh Insights"}
                </Button>
              )}
              <Button
                onClick={() => navigate("/portal/campaigns/new")}
                className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-5">
        <button
          onClick={() => switchTab("all")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer relative",
            activeTab === "all"
              ? "text-[#1B4332] dark:text-emerald-400"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          All
          <Badge
            className={cn(
              "ml-2 text-[10px] px-1.5 py-0",
              activeTab === "all"
                ? "bg-[#1B4332]/10 text-[#1B4332] dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            {campaigns.length}
          </Badge>
          {activeTab === "all" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B4332] rounded-t" />
          )}
        </button>
        {isAdmin && (
          <button
            onClick={() => switchTab("pending_approval")}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer relative",
              activeTab === "pending_approval"
                ? "text-blue-700 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Pending Approval
            <Badge
              className={cn(
                "ml-2 text-[10px] px-1.5 py-0",
                activeTab === "pending_approval"
                  ? "bg-blue-100 text-blue-800"
                  : pendingApproval.length > 0
                    ? "bg-blue-100 text-blue-700"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {pendingApproval.length}
            </Badge>
            {activeTab === "pending_approval" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />
            )}
          </button>
        )}
        <button
          onClick={() => switchTab("pending_launch")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer relative",
            activeTab === "pending_launch"
              ? "text-[#1B4332] dark:text-emerald-400"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Pending Launch
          <Badge
            className={cn(
              "ml-2 text-[10px] px-1.5 py-0",
              activeTab === "pending_launch"
                ? "bg-amber-100 text-amber-800"
                : "bg-muted text-muted-foreground",
            )}
          >
            {pendingLaunch.length}
          </Badge>
          {activeTab === "pending_launch" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B4332] rounded-t" />
          )}
        </button>
        <button
          onClick={() => switchTab("launched")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer relative",
            activeTab === "launched"
              ? "text-[#1B4332] dark:text-emerald-400"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Running Ads
          <Badge
            className={cn(
              "ml-2 text-[10px] px-1.5 py-0",
              activeTab === "launched"
                ? "bg-green-100 text-green-800"
                : "bg-muted text-muted-foreground",
            )}
          >
            {launched.length}
          </Badge>
          {activeTab === "launched" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1B4332] rounded-t" />
          )}
        </button>
        <button
          onClick={() => switchTab("relaunch")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer relative",
            activeTab === "relaunch"
              ? "text-red-600 dark:text-red-400"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Relaunch
          <Badge
            className={cn(
              "ml-2 text-[10px] px-1.5 py-0",
              activeTab === "relaunch"
                ? "bg-red-100 text-red-800"
                : needsRelaunch.length > 0
                  ? "bg-red-100 text-red-700"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {needsRelaunch.length}
          </Badge>
          {activeTab === "relaunch" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-t" />
          )}
        </button>
        <button
          onClick={() => switchTab("archive")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer relative",
            activeTab === "archive"
              ? "text-gray-600 dark:text-gray-400"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Archive
          <Badge
            className={cn(
              "ml-2 text-[10px] px-1.5 py-0",
              activeTab === "archive"
                ? "bg-gray-200 text-gray-700"
                : "bg-muted text-muted-foreground",
            )}
          >
            {archived.length}
          </Badge>
          {activeTab === "archive" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-500 rounded-t" />
          )}
        </button>
      </div>

      {/* Search */}
      {currentList.length > 0 && (
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={
              isAdmin
                ? "Search by title, staff name, or email..."
                : "Search campaigns..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background border-border"
          />
        </div>
      )}

      {/* Campaign list or empty state */}
      {filtered.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PlusCircle />
            </EmptyMedia>
            <EmptyTitle>
              {search
                ? "No matching campaigns"
                : activeTab === "all"
                  ? "No campaigns yet"
                  : activeTab === "pending_approval"
                    ? "No campaigns pending approval"
                    : activeTab === "pending_launch"
                      ? "No campaigns pending launch"
                      : activeTab === "relaunch"
                        ? "No campaigns need relaunch"
                        : "No campaigns running ads"}
            </EmptyTitle>
            <EmptyDescription>
              {search
                ? "Try a different search term"
                : activeTab === "all"
                  ? "Create your first campaign to get started."
                  : activeTab === "pending_approval"
                    ? "Campaigns submitted via the public Start a Campaign wizard will appear here for review."
                    : activeTab === "pending_launch"
                      ? "Campaigns created by staff will appear here."
                      : activeTab === "relaunch"
                        ? "Campaigns that fail due to banned accounts or launch errors will appear here automatically."
                        : "Launch campaigns through Meta to see them here."}
            </EmptyDescription>
          </EmptyHeader>
          {!search && (activeTab === "pending_launch" || activeTab === "all") && (
            <EmptyContent>
              <Button
                size="sm"
                onClick={() => navigate("/portal/campaigns/new")}
                className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
              >
                Create Campaign
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : activeTab === "all" && groupedByStaff ? (
        <div className="space-y-6">
          {groupedByStaff.map(([staffId, group]) => (
            <div key={staffId}>
              {/* Staff member header */}
              <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border/50">
                <div className="w-8 h-8 rounded-full bg-[#1B4332]/10 dark:bg-[#1B4332]/30 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#1B4332] dark:text-emerald-400">
                    {group.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {group.name}
                  </p>
                  {group.email && (
                    <p className="text-xs text-muted-foreground truncate">{group.email}</p>
                  )}
                </div>
                <Badge className="ml-auto shrink-0 bg-muted text-muted-foreground text-[10px] px-1.5 py-0">
                  {group.campaigns.length} campaign{group.campaigns.length !== 1 ? "s" : ""}
                </Badge>
              </div>

              {/* Campaigns for this staff member */}
              <div className="space-y-3">
                {group.campaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign._id}
                    campaign={campaign}
                    selectMode={selectMode}
                    selected={selected}
                    toggleSelect={toggleSelect}
                    navigate={navigate}
                    isAdmin={isAdmin}
                    campaignStats={campaignStats}
                    showCreator={false}
                    metaInsights={metaInsights}
                    onReview={isAdmin ? handleReviewCampaign : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((campaign) => (
            <CampaignCard
              key={campaign._id}
              campaign={campaign}
              selectMode={selectMode}
              selected={selected}
              toggleSelect={toggleSelect}
              navigate={navigate}
              isAdmin={isAdmin}
              campaignStats={campaignStats}
              showCreator={true}
              metaInsights={metaInsights}
              onReview={isAdmin ? handleReviewCampaign : undefined}
            />
          ))}
        </div>
      )}

      {/* Archive relaunch confirmation — uses saved config, no config dialog */}
      <Dialog open={showArchiveRelaunchConfirm} onOpenChange={setShowArchiveRelaunchConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#1B4332]" />
              Relaunch {selected.size} Archived Campaign
              {selected.size !== 1 ? "s" : ""}?
            </DialogTitle>
            <DialogDescription>
              Each campaign will be relaunched using its{" "}
              <span className="font-semibold text-foreground">
                original ad settings
              </span>{" "}
              (objective, targeting, budget, creative, and UTM tracking). Only
              the on/off state changes — nothing else is modified.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-1.5 max-h-48 overflow-y-auto">
            {(campaigns ?? [])
              .filter((c) => selected.has(c._id))
              .map((c) => (
                <div key={c._id} className="flex items-center gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332] shrink-0" />
                  <span className="truncate text-foreground">{c.title}</span>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {c.adBudgetCents ? `$${(c.adBudgetCents / 100).toFixed(0)}/day` : "default budget"}
                  </span>
                </div>
              ))}
          </div>
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="flex w-full justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowArchiveRelaunchConfirm(false)}
                disabled={isArchiveRelaunching}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleArchiveRelaunch}
                disabled={isArchiveRelaunching}
                className="bg-[#1B4332] hover:bg-[#1B4332]/90 text-white cursor-pointer"
              >
                {isArchiveRelaunching ? (
                  <>
                    <Spinner className="mr-2" />
                    Relaunching...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Relaunch with Same Settings
                  </>
                )}
              </Button>
            </div>
            <button
              type="button"
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors cursor-pointer"
              onClick={() => {
                setShowArchiveRelaunchConfirm(false);
                const firstId = Array.from(selected)[0];
                if (firstId) navigate(`/portal/campaigns/${firstId}`);
              }}
            >
              Edit settings before relaunching
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Delete {selected.size} Campaign
              {selected.size !== 1 ? "s" : ""}?
            </DialogTitle>
            <DialogDescription>
              This action is{" "}
              <span className="font-semibold text-foreground">
                permanent and cannot be undone
              </span>
              . All selected campaigns, their media, and associated simulated
              donors will be permanently removed. Real donations will not be
              deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            Are you absolutely sure you want to proceed? This cannot be
            reversed.
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {isDeleting ? "Deleting..." : "Yes, Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Launch dialog — full ad manager config */}
      <LaunchDialog
        open={showLaunchDialog}
        onOpenChange={setShowLaunchDialog}
        selectedCampaigns={
          (campaigns ?? [])
            .filter((c) => selected.has(c._id))
            .map((c) => ({
              _id: c._id,
              title: c.title,
              creatorName: c.creatorName,
              status: c.status,
              adBudgetCents: c.adBudgetCents,
            }))
        }
        onLaunch={handleLaunch}
      />

      {/* Relaunch dialog — same config, relaunch mode */}
      <LaunchDialog
        open={showRelaunchDialog}
        onOpenChange={setShowRelaunchDialog}
        selectedCampaigns={
          (campaigns ?? [])
            .filter((c) => selected.has(c._id))
            .map((c) => ({
              _id: c._id,
              title: c.title,
              creatorName: c.creatorName,
              status: c.status,
              adBudgetCents: c.adBudgetCents,
              previousAdBudgetCents: c.previousAdBudgetCents,
            }))
        }
        isRelaunch
        onLaunch={handleRelaunch}
        savedConfig={savedLaunchConfig}
      />
    </div>
  );
}

/* ---- Reusable campaign card row ---- */

type CampaignItem = {
  _id: Id<"campaigns">;
  title: string;
  slug: string;
  status: string;
  goalAmount: number;
  currentAmount: number;
  imageUrl: string | null;
  creatorName: string | null;
  creatorEmail: string | null;
  createdBy: Id<"users">;
  adBudgetCents?: number;
  relaunchReason?: string;
  relaunchDetectedAt?: string;
  previousAdBudgetCents?: number;
  failedAdAccountMetaId?: string;
  adAccountName?: string | null;
};

type CampaignStatsMap = Record<string, { totalViews: number; totalConverted: number; conversionRate: number }> | undefined;

type MetaInsightsMap = Record<
  string,
  {
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    cpa: number;
    dailyBudget: number;
    updatedAt: string | null;
  }
> | undefined;

function CampaignCard({
  campaign,
  selectMode,
  selected,
  toggleSelect,
  navigate,
  isAdmin,
  campaignStats,
  showCreator,
  metaInsights,
  onReview,
}: {
  campaign: CampaignItem;
  selectMode: boolean;
  selected: Set<Id<"campaigns">>;
  toggleSelect: (id: Id<"campaigns">) => void;
  navigate: NavigateFunction;
  isAdmin: boolean;
  campaignStats: CampaignStatsMap;
  showCreator: boolean;
  metaInsights: MetaInsightsMap;
  onReview?: (
    campaignId: Id<"campaigns">,
    decision: "approve" | "reject",
    title: string,
  ) => void;
}) {
  const isPendingApproval = campaign.status === "pending_approval";
  const insight = metaInsights?.[campaign._id as string];

  return (
    <div
      className="rounded-xl border border-border bg-card hover:shadow-sm transition-shadow cursor-pointer"
      onClick={() => {
        if (selectMode) {
          toggleSelect(campaign._id);
        } else {
          navigate(`/portal/campaigns/${campaign._id}`);
        }
      }}
    >
      {/* Main row */}
      <div className="flex items-center gap-4 p-4">
        {/* Select checkbox */}
        {selectMode && (
          <Checkbox
            checked={selected.has(campaign._id)}
            onCheckedChange={() => toggleSelect(campaign._id)}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 cursor-pointer"
          />
        )}
        {/* Thumbnail */}
        {campaign.imageUrl ? (
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className="w-16 h-16 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <span className="text-2xl">📢</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">
              {campaign.title}
            </h3>
            <Badge
              className={cn(
                "shrink-0 text-xs capitalize",
                STATUS_STYLES[campaign.status] ?? "",
              )}
            >
              {STATUS_LABELS[campaign.status] ?? campaign.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            Goal: ${campaign.goalAmount.toLocaleString()} &middot; Raised:
            ${campaign.currentAmount.toLocaleString()}
          </p>
          {showCreator && isAdmin && (campaign.creatorName || campaign.creatorEmail) && (
            <p className="text-xs text-muted-foreground truncate">
              By {campaign.creatorName || campaign.creatorEmail}
            </p>
          )}
          {campaign.adAccountName && (
            <p className="text-xs text-muted-foreground truncate">
              Ad Account: {campaign.adAccountName}
            </p>
          )}
          {campaign.status === "needs_relaunch" && campaign.relaunchReason && (
            <div className="flex items-start gap-1.5 mt-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                {parseRelaunchReason(campaign.relaunchReason)}
              </p>
            </div>
          )}
          {campaign.status === "needs_relaunch" && campaign.previousAdBudgetCents && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Previous budget: ${(campaign.previousAdBudgetCents / 100).toFixed(2)}/day
              {campaign.relaunchDetectedAt && (
                <span> &middot; Detected {new Date(campaign.relaunchDetectedAt).toLocaleDateString()}</span>
              )}
            </p>
          )}
        </div>

        {/* Mini revenue box */}
        <CampaignRevenueChip campaignId={campaign._id} isAdmin={isAdmin} />

        {/* Views & conversions */}
        {campaignStats && (
          <div className="shrink-0 flex flex-col items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 px-3 py-2 min-w-[5.5rem]">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                {campaignStats[campaign.slug]?.totalViews ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowRightLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {campaignStats[campaign.slug]?.totalConverted ?? 0}
              </span>
            </div>
            <p className="text-[9px] text-muted-foreground mt-0.5">
              {(campaignStats[campaign.slug]?.conversionRate ?? 0).toFixed(1)}% CVR
            </p>
          </div>
        )}

        {/* Approve/Reject for pending_approval campaigns (admin only) */}
        {isPendingApproval && onReview ? (
          <div className="shrink-0 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              onClick={() => onReview(campaign._id, "approve", campaign.title)}
              className="bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white cursor-pointer h-9"
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReview(campaign._id, "reject", campaign.title)}
              className="border-red-200 text-red-700 hover:bg-red-50 cursor-pointer h-9"
            >
              Reject
            </Button>
          </div>
        ) : (
          campaign.slug && (
            <a
              href={`/campaign/${campaign.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1B4332]/20 bg-[#1B4332]/5 dark:bg-[#1B4332]/20 text-[#1B4332] dark:text-emerald-400 hover:bg-[#1B4332]/10 dark:hover:bg-[#1B4332]/30 transition-colors text-xs font-medium"
              title={`/campaign/${campaign.slug}`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View page</span>
            </a>
          )
        )}
      </div>

      {/* Meta Ad Insight Cards — staff see CTR & CPA only; admins see all */}
      {insight && (
        <div className="px-4 pb-3 pt-0">
          <div className={cn("grid gap-2", isAdmin ? "grid-cols-5" : "grid-cols-2")}>
            {isAdmin && (
              <InsightMiniCard
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                label="ROAS"
                color="purple"
              >
                <CampaignRoasValue campaignId={campaign._id} spend={insight.spend} />
              </InsightMiniCard>
            )}
            <InsightMiniCard
              icon={<Target className="w-3.5 h-3.5" />}
              label="CPA"
              value={insight.cpa > 0 ? `$${insight.cpa.toFixed(2)}` : "—"}
              color="orange"
            />
            <InsightMiniCard
              icon={<MousePointerClick className="w-3.5 h-3.5" />}
              label="CTR"
              value={insight.ctr > 0 ? `${insight.ctr.toFixed(2)}%` : "—"}
              color="blue"
            />
            {isAdmin && (
              <InsightMiniCard
                icon={<Wallet className="w-3.5 h-3.5" />}
                label="Daily Budget"
                value={insight.dailyBudget > 0 ? `$${insight.dailyBudget.toFixed(2)}` : "—"}
                color="green"
              />
            )}
            {isAdmin && (
              <InsightMiniCard
                icon={<BarChart3 className="w-3.5 h-3.5" />}
                label="Spent"
                value={insight.spend > 0 ? `$${insight.spend.toFixed(2)}` : "—"}
                color="red"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Mini revenue chip shown on each campaign card ---- */

function CampaignRevenueChip({
  campaignId,
  isAdmin,
}: {
  campaignId: Id<"campaigns">;
  isAdmin: boolean;
}) {
  const revenue = useQuery(api.donations.getRevenueByCampaign, isAdmin ? { campaignId } : "skip");
  const commission = useQuery(api.donations.getCommissionByCampaign, !isAdmin ? { campaignId } : "skip");

  if (isAdmin) {
    if (revenue === undefined) {
      return <Skeleton className="h-14 w-24 rounded-lg shrink-0" />;
    }

    return (
      <div className="shrink-0 flex flex-col items-center justify-center rounded-lg bg-[#1B4332]/5 dark:bg-[#1B4332]/20 border border-[#1B4332]/10 px-3 py-2 min-w-[5.5rem]">
        <div className="flex items-center gap-1 mb-0.5">
          <DollarSign className="w-3 h-3 text-[#1B4332] dark:text-emerald-400" />
          <span className="text-xs font-medium text-muted-foreground">Revenue</span>
        </div>
        <p className="text-sm font-bold text-[#1B4332] dark:text-emerald-400">
          ${revenue.total.toLocaleString()}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {revenue.count} donation{revenue.count !== 1 ? "s" : ""}
        </p>
      </div>
    );
  }

  // Staff view — show commission
  if (commission === undefined) {
    return <Skeleton className="h-14 w-24 rounded-lg shrink-0" />;
  }

  return (
    <div className="shrink-0 flex flex-col items-center justify-center rounded-lg bg-[#1B4332]/5 dark:bg-[#1B4332]/20 border border-[#1B4332]/10 px-3 py-2 min-w-[5.5rem]">
      <div className="flex items-center gap-1 mb-0.5">
        <DollarSign className="w-3 h-3 text-[#1B4332] dark:text-emerald-400" />
        <span className="text-xs font-medium text-muted-foreground">Commission</span>
      </div>
      <p className="text-sm font-bold text-[#1B4332] dark:text-emerald-400">
        ${commission.commission.toLocaleString()}
      </p>
      <p className="text-[10px] text-muted-foreground">
        {(commission.commissionRate * 100).toFixed(1)}% rate
      </p>
    </div>
  );
}

/* ---- Meta insight mini-card ---- */

const INSIGHT_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-100 dark:border-purple-900/50",
    icon: "text-purple-600 dark:text-purple-400",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-100 dark:border-orange-900/50",
    icon: "text-orange-600 dark:text-orange-400",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-100 dark:border-blue-900/50",
    icon: "text-blue-600 dark:text-blue-400",
  },
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-100 dark:border-emerald-900/50",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-100 dark:border-red-900/50",
    icon: "text-red-600 dark:text-red-400",
  },
};

function InsightMiniCard({
  icon,
  label,
  value,
  color,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  color: string;
  children?: React.ReactNode;
}) {
  const c = INSIGHT_COLORS[color] ?? INSIGHT_COLORS.blue;
  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-2 flex flex-col items-center justify-center text-center",
        c.bg,
        c.border,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={cn("mb-0.5", c.icon)}>{icon}</div>
      <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      {children ?? (
        <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
      )}
    </div>
  );
}

/* ---- ROAS value that uses donation revenue ---- */

function CampaignRoasValue({
  campaignId,
  spend,
}: {
  campaignId: Id<"campaigns">;
  spend: number;
}) {
  const revenue = useQuery(api.donations.getRevenueByCampaign, { campaignId });

  if (revenue === undefined) {
    return <Skeleton className="h-4 w-10 mt-0.5" />;
  }

  if (spend <= 0) {
    return <p className="text-sm font-bold text-foreground mt-0.5">—</p>;
  }

  const roas = revenue.total / spend;
  return (
    <p className={cn(
      "text-sm font-bold mt-0.5",
      roas >= 1 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
    )}>
      {roas.toFixed(2)}x
    </p>
  );
}
