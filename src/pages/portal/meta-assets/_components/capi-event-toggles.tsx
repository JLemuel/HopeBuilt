import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Switch } from "@/components/ui/switch.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { ShoppingCart, Eye, UserPlus, MousePointerClick } from "lucide-react";
import { toast } from "sonner";
import type { ReactNode } from "react";

/** All supported CAPI event types with metadata */
const CAPI_EVENT_TYPES = [
  {
    name: "Purchase",
    description: "Fires when a donation is completed",
    icon: <ShoppingCart className="w-4 h-4" />,
    available: true,
  },
  {
    name: "PageView",
    description: "Fires when a campaign page is viewed",
    icon: <Eye className="w-4 h-4" />,
    available: true,
  },
  {
    name: "Lead",
    description: "Fires when a donor initiates checkout",
    icon: <UserPlus className="w-4 h-4" />,
    available: true,
  },
  {
    name: "ViewContent",
    description: "Fires when campaign content is viewed",
    icon: <MousePointerClick className="w-4 h-4" />,
    available: true,
  },
] satisfies Array<{
  name: string;
  description: string;
  icon: ReactNode;
  available: boolean;
}>;

type CapiEventTogglesProps = {
  enabledEvents: string[];
};

export default function CapiEventToggles({ enabledEvents }: CapiEventTogglesProps) {
  const toggleCapiEvent = useMutation(api.meta.settings.toggleCapiEvent);

  const handleToggle = async (eventName: string, checked: boolean) => {
    try {
      await toggleCapiEvent({ eventName, enabled: checked });
      toast.success(
        checked
          ? `${eventName} event enabled`
          : `${eventName} event disabled`,
      );
    } catch {
      toast.error(`Failed to update ${eventName} event`);
    }
  };

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Tracked Events
      </p>
      {CAPI_EVENT_TYPES.map((event) => (
        <div
          key={event.name}
          className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">{event.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium text-foreground">
                  {event.name}
                </Label>
                {!event.available && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Coming soon
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{event.description}</p>
            </div>
          </div>
          <Switch
            checked={enabledEvents.includes(event.name)}
            onCheckedChange={(checked) => handleToggle(event.name, checked)}
            disabled={!event.available}
            className="cursor-pointer"
          />
        </div>
      ))}
    </div>
  );
}
