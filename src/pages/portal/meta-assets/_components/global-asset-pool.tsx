import { useState } from "react";
import type { ComponentType, SVGProps } from "react";
import {
  MonitorSmartphone,
  Radar,
  Globe,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  HelpCircle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { Id, Doc } from "@/convex/_generated/dataModel.d.ts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";

// Custom Instagram glyph (Lucide no longer ships brand icons)
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

type MetaAsset = Doc<"metaAssets">;

const SLOT_TYPES = ["ad_account", "pixel", "page", "instagram"] as const;

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

const SLOT_CONFIG: Record<
  string,
  {
    label: string;
    emptyText: string;
    bg: string;
    border: string;
    activeBg: string;
    activeBorder: string;
    text: string;
    icon: IconComponent;
  }
> = {
  ad_account: {
    label: "Ad Accounts",
    emptyText: "No ad accounts yet",
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
    border: "border-blue-100 dark:border-blue-900",
    activeBg: "bg-blue-50 dark:bg-blue-950/30",
    activeBorder: "border-blue-200 dark:border-blue-800",
    text: "text-blue-600 dark:text-blue-400",
    icon: MonitorSmartphone,
  },
  pixel: {
    label: "Pixels",
    emptyText: "No pixels yet",
    bg: "bg-purple-50/50 dark:bg-purple-950/20",
    border: "border-purple-100 dark:border-purple-900",
    activeBg: "bg-purple-50 dark:bg-purple-950/30",
    activeBorder: "border-purple-200 dark:border-purple-800",
    text: "text-purple-600 dark:text-purple-400",
    icon: Radar,
  },
  page: {
    label: "Pages",
    emptyText: "No pages yet",
    bg: "bg-green-50/50 dark:bg-green-950/20",
    border: "border-green-100 dark:border-green-900",
    activeBg: "bg-green-50 dark:bg-green-950/30",
    activeBorder: "border-green-200 dark:border-green-800",
    text: "text-green-600 dark:text-green-400",
    icon: Globe,
  },
  instagram: {
    label: "Instagram",
    emptyText: "No Instagram accounts yet",
    bg: "bg-pink-50/50 dark:bg-pink-950/20",
    border: "border-pink-100 dark:border-pink-900",
    activeBg: "bg-pink-50 dark:bg-pink-950/30",
    activeBorder: "border-pink-200 dark:border-pink-800",
    text: "text-pink-600 dark:text-pink-400",
    icon: InstagramIcon,
  },
};

type HealthStatus = "active" | "disabled" | "error" | "pending" | "unknown";

const HEALTH_CONFIG: Record<
  HealthStatus,
  {
    icon: typeof CheckCircle2;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  active: {
    icon: CheckCircle2,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    label: "Active",
  },
  disabled: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Disabled / Banned",
  },
  error: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    label: "Needs Attention",
  },
  pending: {
    icon: Clock,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    label: "Pending Review",
  },
  unknown: {
    icon: HelpCircle,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    label: "Unknown",
  },
};

function HealthBadge({ asset }: { asset: MetaAsset }) {
  const status = asset.healthStatus;
  if (!status) return null;

  const config = HEALTH_CONFIG[status];
  const Icon = config.icon;
  const checkedAt = asset.healthCheckedAt
    ? new Date(asset.healthCheckedAt).toLocaleString()
    : null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0",
              config.bgColor,
              config.color,
            )}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs font-medium">{asset.healthDetail ?? "No details"}</p>
          {checkedAt && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Checked: {checkedAt}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

type AssetType = "ad_account" | "pixel" | "page" | "instagram";

type GlobalAssetPoolProps = {
  assets: MetaAsset[];
  onRemove: (assetId: Id<"metaAssets">) => void;
  onAdd: (type: AssetType, metaId: string, name: string) => Promise<void>;
};

export default function GlobalAssetPool({ assets, onRemove, onAdd }: GlobalAssetPoolProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addDialogType, setAddDialogType] = useState<AssetType | null>(null);
  const [addName, setAddName] = useState("");
  const [addMetaId, setAddMetaId] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleRemove = async (assetId: Id<"metaAssets">) => {
    setRemovingId(assetId);
    try {
      await onRemove(assetId);
    } finally {
      setRemovingId(null);
    }
  };

  const handleAdd = async () => {
    if (!addDialogType || !addName.trim() || !addMetaId.trim()) return;
    setIsAdding(true);
    try {
      await onAdd(addDialogType, addMetaId.trim(), addName.trim());
      setAddDialogType(null);
      setAddName("");
      setAddMetaId("");
    } finally {
      setIsAdding(false);
    }
  };

  const openAddDialog = (type: AssetType) => {
    setAddDialogType(type);
    setAddName("");
    setAddMetaId("");
  };

  // Count assets with issues across all types
  const issueCount = assets.filter(
    (a) => a.healthStatus && a.healthStatus !== "active" && a.healthStatus !== "unknown",
  ).length;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-foreground">Global Asset Pool</h3>
          <p className="text-xs text-muted-foreground mt-1">
            These assets are shared across all staff and used for every campaign launch.
          </p>
        </div>
        {issueCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-semibold shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
            {issueCount} issue{issueCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SLOT_TYPES.map((slotType) => {
          const config = SLOT_CONFIG[slotType];
          const Icon = config.icon;
          const slotAssets = assets.filter((a) => a.type === slotType);
          const hasAssets = slotAssets.length > 0;

          return (
            <div
              key={slotType}
              className={cn(
                "rounded-xl border-2 p-4 min-h-[100px] flex flex-col gap-3 transition-all",
                hasAssets
                  ? cn(config.activeBg, config.activeBorder, "border-solid")
                  : cn(config.bg, config.border, "border-dashed"),
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4 shrink-0", hasAssets ? config.text : "text-muted-foreground")} />
                  <span
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wide",
                      hasAssets ? config.text : "text-muted-foreground",
                    )}
                  >
                    {config.label} ({slotAssets.length})
                  </span>
                </div>
                <button
                  onClick={() => openAddDialog(slotType)}
                  className={cn(
                    "p-1 rounded-md transition-colors cursor-pointer",
                    "hover:bg-foreground/10",
                    config.text,
                  )}
                  title={`Manually add ${config.label.toLowerCase()}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {hasAssets ? (
                <div className="flex flex-col gap-2">
                  {slotAssets.map((asset) => (
                    <div
                      key={asset._id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border",
                        "bg-background/60",
                        config.activeBorder,
                      )}
                    >
                      <Icon className={cn("w-3.5 h-3.5 shrink-0", config.text)} />
                      <span className={cn("text-xs font-semibold truncate flex-1", config.text)}>
                        {asset.name}
                      </span>
                      <HealthBadge asset={asset} />
                      <button
                        onClick={() => handleRemove(asset._id)}
                        disabled={removingId === asset._id}
                        className="p-1 hover:bg-destructive/10 rounded transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                        title="Remove asset"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground px-1">
                  {config.emptyText}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Manual Add Dialog */}
      <Dialog open={addDialogType !== null} onOpenChange={(open) => !open && setAddDialogType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add {addDialogType ? SLOT_CONFIG[addDialogType].label.replace(/s$/, "") : "Asset"}
            </DialogTitle>
            <DialogDescription>
              {addDialogType === "instagram"
                ? "Enter the Instagram account username (e.g. @hopebuilt) and its Meta ID. You can find the Meta ID in Meta Business Suite under Settings > Instagram Accounts."
                : `Enter the ${addDialogType ? SLOT_CONFIG[addDialogType].label.toLowerCase().replace(/s$/, "") : "asset"} name and its Meta ID.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="asset-name">
                {addDialogType === "instagram" ? "Username" : "Name"}
              </Label>
              <Input
                id="asset-name"
                placeholder={addDialogType === "instagram" ? "@myaccount" : "My Asset Name"}
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="asset-meta-id">Meta ID</Label>
              <Input
                id="asset-meta-id"
                placeholder="e.g. 17841400123456789"
                value={addMetaId}
                onChange={(e) => setAddMetaId(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAdd}
              disabled={isAdding || !addName.trim() || !addMetaId.trim()}
              className="cursor-pointer"
            >
              {isAdding ? "Adding..." : "Add"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
