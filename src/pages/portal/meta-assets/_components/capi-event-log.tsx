import { Fragment, useState } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  CheckCircle2,
  XCircle,
  Radio,
  ChevronDown,
  Activity,
} from "lucide-react";

type StatusFilter = "all" | "sent" | "failed";
type EventFilter = "all" | string;

export default function CapiEventLog() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");

  const stats = useQuery(api.meta.capiLog.stats);

  const {
    results: events,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.meta.capiLog.listPaginated,
    {
      statusFilter: statusFilter === "all" ? undefined : statusFilter,
      eventNameFilter: eventFilter === "all" ? undefined : eventFilter,
    },
    { initialNumItems: 25 },
  );

  const isFirstLoad = paginationStatus === "LoadingFirstPage";

  if (isFirstLoad) {
    return (
      <section className="rounded-xl border border-border bg-card p-5">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">CAPI Event Log</h3>
        </div>

        {stats && (
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted">
              <Activity className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground">24h:</span>
              <span className="font-semibold text-foreground">{stats.total}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 dark:bg-green-950/30">
              <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400" />
              <span className="font-semibold text-green-700 dark:text-green-300">{stats.sent}</span>
            </div>
            {stats.failed > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 dark:bg-red-950/30">
                <XCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
                <span className="font-semibold text-red-700 dark:text-red-300">{stats.failed}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs cursor-pointer">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={eventFilter}
          onValueChange={(v) => setEventFilter(v as EventFilter)}
        >
          <SelectTrigger className="w-[150px] h-8 text-xs cursor-pointer">
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            <SelectItem value="Purchase">Purchase</SelectItem>
            <SelectItem value="PageView">PageView</SelectItem>
            <SelectItem value="Lead">Lead</SelectItem>
            <SelectItem value="ViewContent">ViewContent</SelectItem>
          </SelectContent>
        </Select>

        {(statusFilter !== "all" || eventFilter !== "all") && (
          <button
            onClick={() => {
              setStatusFilter("all");
              setEventFilter("all");
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {events.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Radio />
            </EmptyMedia>
            <EmptyTitle>
              {statusFilter !== "all" || eventFilter !== "all"
                ? "No matching events"
                : "No CAPI events yet"}
            </EmptyTitle>
            <EmptyDescription>
              {statusFilter !== "all" || eventFilter !== "all"
                ? "Try adjusting your filters to see more results."
                : "Events will appear here once donations are processed with CAPI enabled."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Event</th>
                  <th className="pb-2 pr-4 font-medium">Campaign</th>
                  <th className="pb-2 pr-4 font-medium">Value</th>
                  <th className="pb-2 pr-4 font-medium">Pixel</th>
                  <th className="pb-2 pr-4 font-medium">Received</th>
                  <th className="pb-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {events.map((evt) => {
                  const hasErrorDetail =
                    evt.status === "failed" && !!evt.errorDetail;
                  return (
                    <Fragment key={evt._id}>
                      <tr
                        className={`${hasErrorDetail ? "" : "border-b border-border/50 last:border-0"} hover:bg-muted/30 transition-colors`}
                      >
                        <td className="py-2.5 pr-4">
                          {evt.status === "sent" ? (
                            <Badge
                              variant="secondary"
                              className="bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 text-[10px] px-1.5"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Sent
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800 text-[10px] px-1.5"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 font-medium text-foreground">
                          {evt.eventName}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground font-mono text-xs">
                          {evt.campaignSlug ?? "\u2014"}
                        </td>
                        <td className="py-2.5 pr-4 text-foreground tabular-nums">
                          ${evt.value.toFixed(2)} {evt.currency}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground font-mono text-xs">
                          {evt.pixelMetaId.length > 12
                            ? `${evt.pixelMetaId.slice(0, 12)}...`
                            : evt.pixelMetaId}
                        </td>
                        <td className="py-2.5 pr-4 text-foreground tabular-nums">
                          {evt.status === "sent" ? (
                            evt.eventsReceived ?? "\u2014"
                          ) : (
                            <span className="text-red-600 dark:text-red-400 text-xs">
                              Error
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                          {new Date(evt.sentAt).toLocaleString()}
                        </td>
                      </tr>
                      {hasErrorDetail && (
                        <tr className="border-b border-border/50 last:border-0">
                          <td colSpan={7} className="pb-2.5 pr-4">
                            <div className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded px-2 py-1.5 font-mono break-words whitespace-pre-wrap">
                              {evt.errorDetail}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {paginationStatus === "CanLoadMore" && (
            <div className="flex justify-center pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => loadMore(25)}
                className="cursor-pointer"
              >
                <ChevronDown className="w-4 h-4 mr-1.5" />
                Load more
              </Button>
            </div>
          )}
          {paginationStatus === "LoadingMore" && (
            <div className="flex justify-center pt-4">
              <Button variant="secondary" size="sm" disabled>
                Loading...
              </Button>
            </div>
          )}
          {paginationStatus === "Exhausted" && events.length > 25 && (
            <p className="text-center text-xs text-muted-foreground pt-4">
              All events loaded
            </p>
          )}
        </>
      )}
    </section>
  );
}
