import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Trophy, Crown, Medal, Award, Star, User } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils.ts";

/** Prestige tier name lookup */
const PRESTIGE_NAMES: Record<number, string> = {
  1: "Prestige 1",
  2: "Prestige 2",
  3: "Prestige 3",
  4: "Prestige 4",
  5: "Prestige 5",
};

/** Rank badge for #1, #2, #3 */
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-400/20 text-amber-500 shrink-0">
        <Trophy className="w-5 h-5" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-300/30 text-slate-500 shrink-0">
        <Medal className="w-5 h-5" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-300/20 text-orange-500 shrink-0">
        <Award className="w-5 h-5" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground shrink-0">
      <span className="text-sm font-bold">#{rank}</span>
    </div>
  );
}

/** Prestige badge pill */
function PrestigeBadge({ level }: { level: number }) {
  const colors: Record<number, string> = {
    1: "bg-slate-100 text-slate-600",
    2: "bg-emerald-50 text-emerald-700",
    3: "bg-blue-50 text-blue-700",
    4: "bg-purple-50 text-purple-700",
    5: "bg-amber-50 text-amber-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full",
        colors[level] ?? colors[1],
      )}
    >
      <Crown className="w-2.5 h-2.5" />
      {PRESTIGE_NAMES[level] ?? `Prestige ${level}`}
    </span>
  );
}

export default function LeaderboardPage() {
  const data = useQuery(api.leaderboard.getMonthlyLeaderboard);

  if (data === undefined) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const { entries, monthLabel } = data;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#1B4332]/10 dark:bg-[#1B4332]/30">
            <Trophy className="w-5 h-5 text-[#1B4332] dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
        </div>
        <p className="text-sm text-muted-foreground ml-12">
          {monthLabel} — Ranked by unique donors generated
        </p>
      </motion.div>

      {/* Leaderboard list */}
      {entries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 text-muted-foreground"
        >
          <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No activity yet this month</p>
          <p className="text-xs mt-1">Start generating donors to climb the ranks!</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => {
            const rank = index + 1;
            const isTop3 = rank <= 3;

            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                  ease: "easeOut" as const,
                }}
              >
                <div
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 rounded-xl border transition-all",
                    isTop3
                      ? "bg-card border-border shadow-sm"
                      : "bg-card/60 border-border/50",
                    rank === 1 && "ring-2 ring-amber-400/30 border-amber-200",
                  )}
                >
                  {/* Rank badge */}
                  <RankBadge rank={rank} />

                  {/* Avatar */}
                  <div
                    className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden shrink-0",
                      entry.avatarUrl ? "" : "bg-[#1B4332] text-white",
                    )}
                  >
                    {entry.avatarUrl ? (
                      <img
                        src={entry.avatarUrl}
                        alt={entry.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>

                  {/* Name + prestige */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-semibold truncate",
                        isTop3 ? "text-foreground" : "text-foreground",
                      )}
                    >
                      {entry.name}
                    </p>
                    <div className="mt-1">
                      <PrestigeBadge level={entry.prestigeLevel} />
                    </div>
                  </div>

                  {/* Donor count */}
                  <div className="text-right shrink-0">
                    <p
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        rank === 1
                          ? "text-amber-600"
                          : rank === 2
                            ? "text-slate-600"
                            : rank === 3
                              ? "text-orange-600"
                              : "text-foreground",
                      )}
                    >
                      {entry.uniqueDonors}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      Donors
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
