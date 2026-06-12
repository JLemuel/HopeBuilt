import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import StripeLogo from "@/components/stripe-logo.tsx";
import {
  BarChart3,
  DollarSign,
  Hash,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
} from "date-fns";

type RangePreset = "today" | "week" | "month";

export default function ProcessorVolumeCards() {
  const [preset, setPreset] = useState<RangePreset>("today");
  const [offset, setOffset] = useState(0); // 0 = current, -1 = previous, etc.

  const { startDate, endDate, label } = useMemo(() => {
    const now = new Date();
    let anchor: Date;
    let start: Date;
    let end: Date;

    if (preset === "today") {
      anchor = offset === 0 ? now : addDays(now, offset);
      start = startOfDay(anchor);
      end = endOfDay(anchor);
    } else if (preset === "week") {
      anchor = offset === 0 ? now : addWeeks(now, offset);
      start = startOfWeek(anchor, { weekStartsOn: 0 });
      end = endOfWeek(anchor, { weekStartsOn: 0 });
    } else {
      anchor = offset === 0 ? now : addMonths(now, offset);
      start = startOfMonth(anchor);
      end = endOfMonth(anchor);
    }

    let rangeLabel: string;
    if (preset === "today") {
      rangeLabel = offset === 0 ? "Today" : format(anchor, "MMM d, yyyy");
    } else if (preset === "week") {
      rangeLabel = `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
    } else {
      rangeLabel = format(anchor, "MMMM yyyy");
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      label: rangeLabel,
    };
  }, [preset, offset]);

  // suppress unused import warnings
  void subDays; void subWeeks; void subMonths;

  const volume = useQuery(api.processors.getProcessorVolume, {
    startDate,
    endDate,
  });

  const handlePrev = () => setOffset((o) => o - 1);
  const handleNext = () => {
    if (offset < 0) setOffset((o) => o + 1);
  };
  const handlePresetChange = (p: RangePreset) => {
    setPreset(p);
    setOffset(0);
  };

  const canGoNext = offset < 0;

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B4332]/10 dark:bg-[#1B4332]/30 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-[#1B4332] dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Processor Volume
            </h2>
            <p className="text-sm text-muted-foreground">
              Donation volume by processor for the selected period
            </p>
          </div>
        </div>
      </div>

      {/* Date controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Preset tabs */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePresetChange(p)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer",
                preset === p
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {p === "today" ? "Day" : p === "week" ? "Week" : "Month"}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground min-w-[140px] justify-center">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            {label}
          </div>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={cn(
              "p-1.5 rounded-lg transition-colors cursor-pointer",
              canGoNext
                ? "hover:bg-accent text-muted-foreground hover:text-foreground"
                : "text-muted-foreground/40 cursor-not-allowed",
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {offset !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOffset(0)}
              className="text-xs text-[#1B4332] dark:text-emerald-400 hover:text-[#143728] cursor-pointer"
            >
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Volume cards */}
      {volume === undefined ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : volume.totalCount === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No donation volume for this period
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary row */}
          <Card className="bg-[#1B4332] text-white border-none">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm text-white/70 font-medium">
                    Total Volume
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    ${volume.totalVolume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-white/70">Transactions</p>
                    <p className="text-xl font-bold">{volume.totalCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/70">Avg. Donation</p>
                    <p className="text-xl font-bold">
                      ${(volume.totalVolume / volume.totalCount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Per-processor cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {volume.entries.map((entry) => {
              const pct =
                volume.totalVolume > 0
                  ? (entry.volume / volume.totalVolume) * 100
                  : 0;
              return (
                <Card key={entry.processorId} className="overflow-hidden">
                  <CardContent className="p-5 space-y-4">
                    {/* Processor header */}
                    <div className="flex items-center gap-3">
                      <StripeLogo className="w-8 h-8" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {entry.name}
                        </p>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px]",
                            entry.mode === "live"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700",
                          )}
                        >
                          {entry.mode}
                        </Badge>
                      </div>
                    </div>

                    {/* Volume */}
                    <div>
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">
                          Volume
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        ${entry.volume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Hash className="w-3.5 h-3.5" />
                        {entry.count} transactions
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-[#1B4332]/10 dark:bg-[#1B4332]/30 text-[#1B4332] dark:text-emerald-400 text-xs font-semibold"
                      >
                        {pct.toFixed(1)}%
                      </Badge>
                    </div>

                    {/* Distribution bar */}
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-[#1B4332] rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 1)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Unattributed card (donations before processor tracking) */}
            {volume.unattributed.count > 0 && (
              <Card className="overflow-hidden border-dashed">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-muted-foreground truncate">
                        Unattributed
                      </p>
                      <span className="text-[10px] text-muted-foreground">
                        Before processor tracking
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium uppercase tracking-wide">
                        Volume
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-muted-foreground">
                      ${volume.unattributed.volume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Hash className="w-3.5 h-3.5" />
                      {volume.unattributed.count} transactions
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-muted text-muted-foreground text-xs font-semibold"
                    >
                      {volume.totalVolume > 0
                        ? ((volume.unattributed.volume / volume.totalVolume) * 100).toFixed(1)
                        : "0.0"}
                      %
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-[#9e9e9e] rounded-full transition-all"
                      style={{
                        width: `${volume.totalVolume > 0 ? Math.max((volume.unattributed.volume / volume.totalVolume) * 100, 1) : 0}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}
    </section>
  );
}
