import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { startOfDay, endOfDay, format } from "date-fns";
import { motion } from "motion/react";

/**
 * Dynamic bubble map that shows each processor as a proportionally-sized
 * circle based on today's actual donation volume and traffic distribution.
 */
export default function ProcessorBubbleMap() {
  const now = useMemo(() => new Date(), []);
  const startDate = useMemo(() => startOfDay(now).toISOString(), [now]);
  const endDate = useMemo(() => endOfDay(now).toISOString(), [now]);

  const volume = useQuery(api.processors.getProcessorVolume, {
    startDate,
    endDate,
  });

  if (volume === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Skeleton className="h-48 w-48 rounded-full" />
        <Skeleton className="h-40 w-40 rounded-full -ml-4" />
      </div>
    );
  }

  // Combine processor entries + unattributed into bubble data
  const bubbles: BubbleData[] = volume.entries.map((entry) => ({
    id: entry.processorId,
    name: entry.name,
    trafficPct:
      volume.totalVolume > 0
        ? (entry.volume / volume.totalVolume) * 100
        : 0,
    revenue: entry.volume,
    count: entry.count,
  }));

  // If there's unattributed volume, add it as a bubble too
  if (volume.unattributed.count > 0) {
    bubbles.push({
      id: "unattributed",
      name: "Unattributed",
      trafficPct:
        volume.totalVolume > 0
          ? (volume.unattributed.volume / volume.totalVolume) * 100
          : 0,
      revenue: volume.unattributed.volume,
      count: volume.unattributed.count,
    });
  }

  const hasData = bubbles.length > 0 && volume.totalCount > 0;

  return (
    <section className="space-y-4">
      {/* "Today" badge header */}
      <div className="flex justify-center">
        <Badge className="bg-[#121212] text-white px-5 py-1.5 text-sm font-semibold rounded-full">
          {format(now, "EEEE, MMM d")}
        </Badge>
      </div>

      {hasData ? (
        <div className="flex flex-wrap items-center justify-center gap-6 py-6">
          {bubbles.map((bubble, i) => (
            <BubbleCircle key={bubble.id} bubble={bubble} index={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-3">
            <span className="text-3xl text-muted-foreground/40">0</span>
          </div>
          <p className="text-sm">No processor activity today</p>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type BubbleData = {
  id: string;
  name: string;
  trafficPct: number;
  revenue: number;
  count: number;
};

/* ------------------------------------------------------------------ */
/*  Single bubble                                                      */
/* ------------------------------------------------------------------ */

// Min/max bubble diameter in pixels
const MIN_SIZE = 140;
const MAX_SIZE = 260;

function BubbleCircle({
  bubble,
  index,
}: {
  bubble: BubbleData;
  index: number;
}) {
  // Scale bubble size proportionally to traffic percentage
  // Use sqrt scaling so small values are still visible
  const normalized = Math.max(bubble.trafficPct, 5); // floor at 5% so tiny bubbles are still readable
  const size = MIN_SIZE + ((MAX_SIZE - MIN_SIZE) * Math.sqrt(normalized)) / Math.sqrt(100);

  const formattedRevenue = bubble.revenue.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const isUnattributed = bubble.id === "unattributed";

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: index * 0.12,
      }}
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className={`
          w-full h-full rounded-full flex flex-col items-center justify-center
          text-white shadow-xl transition-transform hover:scale-105
          ${isUnattributed ? "bg-[#555555]" : "bg-[#121212]"}
        `}
        style={{
          boxShadow: isUnattributed
            ? "0 8px 32px rgba(85, 85, 85, 0.3)"
            : "0 8px 32px rgba(18, 18, 18, 0.4)",
        }}
      >
        <p className="text-base font-bold leading-tight text-center px-3 mb-1">
          {bubble.name}
        </p>
        <p className="text-xs text-white/70 leading-tight text-center px-2">
          Traffic distributed: {bubble.trafficPct.toFixed(2)}%
        </p>
        <p className="text-xs text-white/70 leading-tight text-center px-2">
          Total revenue processed: {formattedRevenue}
        </p>
      </div>
    </motion.div>
  );
}
