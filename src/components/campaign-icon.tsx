import { BookOpen, Droplets, Heart, Home, Sun, User } from "lucide-react";
import type { CampaignIconKey } from "@/lib/hopebuilt-types.ts";
import { cn } from "@/lib/utils.ts";

const iconStyles: Record<CampaignIconKey, { icon: typeof Droplets; className: string }> = {
  droplet: { icon: Droplets, className: "bg-emerald-50 text-emerald-500" },
  home: { icon: Home, className: "bg-amber-50 text-amber-500" },
  heart: { icon: Heart, className: "bg-blue-50 text-blue-500" },
  book: { icon: BookOpen, className: "bg-pink-50 text-pink-500" },
  sun: { icon: Sun, className: "bg-sky-50 text-sky-500" },
  user: { icon: User, className: "bg-emerald-50 text-emerald-500" },
};

export function CampaignIcon({
  name,
  className,
}: {
  name: CampaignIconKey;
  className?: string;
}) {
  const { icon: Icon, className: tone } = iconStyles[name];

  return (
    <span
      aria-hidden
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-sm",
        tone,
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}
