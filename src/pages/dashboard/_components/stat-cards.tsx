import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import type { Stat } from "@/mocks/hopebuilt.ts";

export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="gap-2 rounded-2xl py-6 shadow-none bg-white text-black border-gray-100"
        >
          <CardHeader className="gap-2">
            <CardDescription className="text-[13px] text-background font-medium">
              {stat.label}
            </CardDescription>
            <CardTitle className="text-3xl font-bold tracking-tight">
              {stat.value}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export function StatCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[104px] w-full rounded-2xl" />
      ))}
    </div>
  );
}
