import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { ConvexError } from "convex/values";
import StripeLogo from "@/components/stripe-logo.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Scale,
  Save,
  Loader2,
  Plus,
  Trash2,
  AlertCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";

type ProcessorItem = {
  _id: Id<"paymentProcessors">;
  name: string;
  provider: "stripe";
  mode: "live" | "sandbox";
  status: "active" | "inactive";
  processorId: string;
  publicKey?: string;
  addedAt: string;
  _creationTime: number;
};

type WeightEntry = {
  processorId: Id<"paymentProcessors">;
  weight: number;
};

export default function ProcessorBalance({
  processors,
}: {
  processors: ProcessorItem[];
}) {
  const config = useQuery(api.processors.getBalanceConfig);
  const saveConfig = useMutation(api.processors.saveBalanceConfig);

  const [enabled, setEnabled] = useState(false);
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync local state from server config
  useEffect(() => {
    if (config === undefined) return;
    if (config) {
      setEnabled(config.enabled);
      // Filter out entries referencing deleted processors
      const validEntries = config.entries.filter((e) =>
        processors.some((p) => p._id === e.processorId),
      );
      setEntries(validEntries);
    } else {
      setEnabled(false);
      setEntries([]);
    }
    setHasUnsavedChanges(false);
  }, [config, processors]);

  const activeProcessors = processors.filter((p) => p.status === "active");

  // Processors not yet in the balance pool
  const availableToAdd = activeProcessors.filter(
    (p) => !entries.some((e) => e.processorId === p._id),
  );

  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0);
  const isWeightValid = entries.length === 0 || Math.abs(totalWeight - 100) < 0.01;

  const handleAddProcessor = useCallback(
    (processorId: Id<"paymentProcessors">) => {
      // When adding, auto-distribute remaining weight
      const remaining = Math.max(0, 100 - totalWeight);
      setEntries((prev) => [...prev, { processorId, weight: remaining }]);
      setHasUnsavedChanges(true);
    },
    [totalWeight],
  );

  const handleRemoveProcessor = useCallback(
    (processorId: Id<"paymentProcessors">) => {
      setEntries((prev) => prev.filter((e) => e.processorId !== processorId));
      setHasUnsavedChanges(true);
    },
    [],
  );

  const handleWeightChange = useCallback(
    (processorId: Id<"paymentProcessors">, weight: number) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.processorId === processorId ? { ...e, weight } : e,
        ),
      );
      setHasUnsavedChanges(true);
    },
    [],
  );

  const handleEqualDistribute = useCallback(() => {
    if (entries.length === 0) return;
    const equalWeight = Math.floor((100 / entries.length) * 100) / 100;
    const remainder = 100 - equalWeight * entries.length;
    setEntries((prev) =>
      prev.map((e, i) => ({
        ...e,
        weight: i === 0 ? equalWeight + remainder : equalWeight,
      })),
    );
    setHasUnsavedChanges(true);
  }, [entries.length]);

  const handleToggleEnabled = useCallback(
    (checked: boolean) => {
      setEnabled(checked);
      setHasUnsavedChanges(true);
    },
    [],
  );

  const handleSave = async () => {
    if (!isWeightValid && entries.length > 0) {
      toast.error("Weights must add up to 100%");
      return;
    }
    setIsSaving(true);
    try {
      await saveConfig({ enabled, entries });
      toast.success("Load balance configuration saved");
      setHasUnsavedChanges(false);
    } catch (err) {
      const msg =
        err instanceof ConvexError
          ? (err.data as { message: string }).message
          : "Failed to save configuration";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (config === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B4332]/10 dark:bg-[#1B4332]/30 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5 text-[#1B4332] dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Traffic Load Balancing
            </h2>
            <p className="text-sm text-muted-foreground">
              Split checkout traffic across multiple processors
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {enabled ? "Enabled" : "Disabled"}
          </span>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggleEnabled}
            className="cursor-pointer"
          />
        </div>
      </div>

      {/* Main config card */}
      <Card
        className={cn(
          "transition-opacity",
          !enabled && "opacity-50 pointer-events-none",
        )}
      >
        <CardContent className="p-5 space-y-5">
          {/* Entries list */}
          {entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Scale className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">
                No processors in the balance pool yet.
                <br />
                Add processors below to start splitting traffic.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const proc = processors.find(
                  (p) => p._id === entry.processorId,
                );
                if (!proc) return null;
                return (
                  <ProcessorWeightRow
                    key={entry.processorId}
                    processor={proc}
                    weight={entry.weight}
                    onWeightChange={(w) =>
                      handleWeightChange(entry.processorId, w)
                    }
                    onRemove={() => handleRemoveProcessor(entry.processorId)}
                  />
                );
              })}

              {/* Weight total indicator */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  {!isWeightValid && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isWeightValid ? "text-[#1B4332] dark:text-emerald-400" : "text-red-500",
                    )}
                  >
                    Total: {totalWeight.toFixed(1)}%
                  </span>
                  {!isWeightValid && (
                    <span className="text-xs text-red-500">
                      (must equal 100%)
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEqualDistribute}
                  className="text-[#1B4332] dark:text-emerald-400 hover:text-[#143728] cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Equal Split
                </Button>
              </div>
            </div>
          )}

          {/* Add processor dropdown */}
          {availableToAdd.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Add to pool
              </p>
              <div className="flex flex-wrap gap-2">
                {availableToAdd.map((proc) => (
                  <button
                    key={proc._id}
                    onClick={() => handleAddProcessor(proc._id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-[#1B4332]/10 text-sm font-medium text-foreground transition-colors cursor-pointer border border-transparent hover:border-[#1B4332]/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {proc.name}
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] ml-1",
                        proc.mode === "live"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700",
                      )}
                    >
                      {proc.mode}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeProcessors.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">
                No active processors available. Add and activate processors
                first.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual distribution preview */}
      {entries.length > 0 && enabled && (
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Traffic Distribution Preview
            </p>
            <div className="flex rounded-lg overflow-hidden h-10 border border-border">
              {entries.map((entry, i) => {
                const proc = processors.find(
                  (p) => p._id === entry.processorId,
                );
                if (!proc || entry.weight <= 0) return null;
                const colors = POOL_COLORS[i % POOL_COLORS.length];
                return (
                  <div
                    key={entry.processorId}
                    className="flex items-center justify-center text-xs font-semibold transition-all"
                    style={{
                      width: `${entry.weight}%`,
                      backgroundColor: colors.bg,
                      color: colors.text,
                      minWidth: entry.weight > 0 ? "32px" : 0,
                    }}
                    title={`${proc.name}: ${entry.weight}%`}
                  >
                    {entry.weight >= 10 ? `${entry.weight}%` : ""}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {entries.map((entry, i) => {
                const proc = processors.find(
                  (p) => p._id === entry.processorId,
                );
                if (!proc) return null;
                const colors = POOL_COLORS[i % POOL_COLORS.length];
                return (
                  <div
                    key={entry.processorId}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <span
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: colors.bg }}
                    />
                    <span className="text-foreground font-medium">
                      {proc.name}
                    </span>
                    <span className="text-muted-foreground">{entry.weight}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save button */}
      {hasUnsavedChanges && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || (!isWeightValid && entries.length > 0)}
            className="bg-[#1B4332] hover:bg-[#143728] text-white cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Configuration
          </Button>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Single processor weight row                                        */
/* ------------------------------------------------------------------ */

function ProcessorWeightRow({
  processor,
  weight,
  onWeightChange,
  onRemove,
}: {
  processor: ProcessorItem;
  weight: number;
  onWeightChange: (w: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border">
      {/* Processor info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
          <StripeLogo className="w-8 h-8" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {processor.name}
          </p>
          <div className="flex items-center gap-1.5">
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px]",
                processor.mode === "live"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700",
              )}
            >
              {processor.mode}
            </Badge>
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px]",
                processor.status === "active"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-500",
              )}
            >
              {processor.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Weight slider + input */}
      <div className="flex items-center gap-2 shrink-0">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={weight}
          onChange={(e) => onWeightChange(Number(e.target.value))}
          className="w-24 sm:w-32 accent-[#1B4332] cursor-pointer"
        />
        <div className="relative w-16">
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={weight}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (!isNaN(val)) onWeightChange(Math.min(100, Math.max(0, val)));
            }}
            className="w-full text-center text-sm font-semibold border border-border rounded-lg py-1.5 pr-5 bg-card focus:ring-1 focus:ring-[#1B4332] focus:border-[#1B4332] outline-none"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            %
          </span>
        </div>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
        title="Remove from pool"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Color palette for distribution bar                                 */
/* ------------------------------------------------------------------ */

const POOL_COLORS = [
  { bg: "#1B4332", text: "#ffffff" },
  { bg: "#3d8d7a", text: "#ffffff" },
  { bg: "#635BFF", text: "#ffffff" },
  { bg: "#f59e0b", text: "#121212" },
  { bg: "#ef4444", text: "#ffffff" },
  { bg: "#8b5cf6", text: "#ffffff" },
];
