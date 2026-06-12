import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge.tsx";
import { cn } from "@/lib/utils.ts";

const statusBadgeVariants = cva("px-2.5 py-1 text-[11px] font-semibold", {
  variants: {
    tone: {
      emerald: "",
      neutral: "",
      blue: "",
      amber: "",
    },
    appearance: {
      soft: "",
      outline: "bg-card",
    },
  },
  compoundVariants: [
    { tone: "emerald", appearance: "soft", className: "bg-emerald-50 text-emerald-700" },
    { tone: "neutral", appearance: "soft", className: "bg-neutral-100 text-neutral-600" },
    { tone: "blue", appearance: "soft", className: "bg-blue-50 text-blue-700" },
    { tone: "amber", appearance: "soft", className: "bg-amber-50 text-amber-700" },
    { tone: "emerald", appearance: "outline", className: "border-emerald-200 text-emerald-600" },
    { tone: "neutral", appearance: "outline", className: "border-neutral-200 text-neutral-600" },
    { tone: "blue", appearance: "outline", className: "border-blue-200 text-blue-600" },
    { tone: "amber", appearance: "outline", className: "border-amber-300 text-amber-600" },
  ],
  defaultVariants: {
    tone: "neutral",
    appearance: "soft",
  },
});

const toneByLabel: Record<string, VariantProps<typeof statusBadgeVariants>["tone"]> = {
  Active: "emerald",
  Monthly: "emerald",
  Quarterly: "blue",
  "One-Time": "neutral",
  Completed: "neutral",
  Paused: "amber",
};

export function StatusBadge({
  label,
  icon: Icon,
  tone,
  appearance,
  className,
}: {
  label: string;
  icon?: LucideIcon;
  className?: string;
} & VariantProps<typeof statusBadgeVariants>) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        statusBadgeVariants({ tone: tone ?? toneByLabel[label] ?? "neutral", appearance }),
        className,
      )}
    >
      {Icon ? <Icon /> : null}
      {label}
    </Badge>
  );
}
