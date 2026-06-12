import { useState, useEffect } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { FlaskConical, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { ConvexError } from "convex/values";

type Pixel = { metaId: string; name: string };

type TestEventsPanelProps = {
  pixels: Pixel[];
  savedCode: string | null;
};

const EVENT_TYPES = [
  { value: "Purchase", label: "Purchase" },
  { value: "DONATE", label: "Donate" },
  { value: "PageView", label: "PageView" },
  { value: "Lead", label: "Lead" },
  { value: "ViewContent", label: "ViewContent" },
] as const;

export default function TestEventsPanel({
  pixels,
  savedCode,
}: TestEventsPanelProps) {
  const saveTestEventCode = useMutation(api.meta.settings.saveTestEventCode);
  const sendTestEvent = useAction(api.meta.capi.sendTestEvent);

  const [code, setCode] = useState(savedCode ?? "");
  const [pixelId, setPixelId] = useState<string>(pixels[0]?.metaId ?? "");
  const [eventName, setEventName] = useState<string>("Purchase");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Keep local code in sync if the saved value changes from elsewhere
  useEffect(() => {
    setCode(savedCode ?? "");
  }, [savedCode]);

  // Auto-select the first pixel when the list loads
  useEffect(() => {
    if (!pixelId && pixels[0]) setPixelId(pixels[0].metaId);
  }, [pixels, pixelId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveTestEventCode({ code });
      toast.success(
        code.trim() === ""
          ? "Test code cleared — events will go live"
          : `Test code saved — events will appear in Test Events`,
      );
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to save test code");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (!pixelId) {
      toast.error("Select a pixel first");
      return;
    }
    if (!code.trim()) {
      toast.error("Save a test code first so it lands in Test Events");
      return;
    }
    setIsSending(true);
    try {
      const result = await sendTestEvent({ pixelMetaId: pixelId, eventName });
      if (result.ok) {
        toast.success(
          `${eventName} sent to pixel ${pixelId}. Check Meta Events Manager → Test Events.`,
        );
      } else {
        toast.error(
          result.error
            ? `Meta rejected the event: ${result.error}`
            : "Test event failed — see the CAPI Event Log below for details.",
          { duration: 10000 },
        );
      }
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to send test event");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <FlaskConical className="w-5 h-5 text-muted-foreground" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Test Events
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Paste the code from Meta Events Manager → Test Events. When saved,
            every event fires to the Test Events tab instead of counting as a
            live conversion.
          </p>
        </div>
      </div>

      {/* Save test code */}
      <div className="grid sm:grid-cols-[1fr_auto] gap-2 mb-5">
        <div className="space-y-1.5">
          <Label htmlFor="test-event-code">Test event code</Label>
          <Input
            id="test-event-code"
            placeholder="TEST12345"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono"
          />
        </div>
        <div className="flex items-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="cursor-pointer"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Send a test event now */}
      <div className="border-t border-border pt-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Send test event now
        </p>
        {pixels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add a pixel to the asset pool above to send test events.
          </p>
        ) : (
          <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="test-pixel">Pixel</Label>
              <Select value={pixelId} onValueChange={setPixelId}>
                <SelectTrigger id="test-pixel" className="cursor-pointer">
                  <SelectValue placeholder="Select a pixel" />
                </SelectTrigger>
                <SelectContent>
                  {pixels.map((p) => (
                    <SelectItem
                      key={p.metaId}
                      value={p.metaId}
                      className="cursor-pointer"
                    >
                      {p.name}{" "}
                      <span className="text-muted-foreground font-mono text-xs">
                        ({p.metaId})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="test-event-type">Event</Label>
              <Select value={eventName} onValueChange={setEventName}>
                <SelectTrigger id="test-event-type" className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((e) => (
                    <SelectItem
                      key={e.value}
                      value={e.value}
                      className="cursor-pointer"
                    >
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleSend}
                disabled={isSending || !pixelId}
                size="sm"
                className="cursor-pointer"
              >
                <Send className="w-4 h-4 mr-1.5" />
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
