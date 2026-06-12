import type * as React from "react";
import { TableHead, TableRow } from "@/components/ui/table.tsx";
import { cn } from "@/lib/utils.ts";

export function HeadRow({ columns }: { columns: string[] }) {
  return (
    <TableRow className="border-0 hover:bg-transparent">
      {columns.map((column, index) => (
        <TableHead
          key={column}
          className={cn(
            "h-11 bg-gray-100 text-black px-4 text-xs font-medium",
            index === 0 && "rounded-tl-lg",
            index === columns.length - 1 && "rounded-tr-lg",
          )}
        >
          {column}
        </TableHead>
      ))}
    </TableRow>
  );
}

export function cellClass(className?: string) {
  return cn("px-4 py-4", className);
}

export type ActionLinkTone = "emerald" | "red";

export function ActionLink({
  tone = "emerald",
  className,
  onClick,
  children,
}: {
  tone?: ActionLinkTone;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-[13px] font-semibold transition-colors cursor-pointer",
        tone === "emerald" && "text-emerald-700 hover:text-emerald-800",
        tone === "red" && "text-red-500 hover:text-red-600",
        className,
      )}
    >
      {children}
    </button>
  );
}

export type StatusTextTone = "emerald" | "orange" | "red";

export function StatusText({
  tone,
  children,
}: {
  tone: StatusTextTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "text-[13px] font-semibold",
        tone === "emerald" && "text-emerald-600",
        tone === "orange" && "text-orange-500",
        tone === "red" && "text-red-500",
      )}
    >
      {children}
    </span>
  );
}
