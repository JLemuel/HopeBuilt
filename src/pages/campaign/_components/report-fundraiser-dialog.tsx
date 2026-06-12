import { useState } from "react";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group.tsx";
import { HandHeart, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Reason = "fraud" | "misleading" | "inappropriate" | "duplicate" | "other";

const REASON_OPTIONS: Array<{ value: Reason; label: string }> = [
  { value: "fraud", label: "Fraud or scam" },
  { value: "misleading", label: "Misleading information" },
  { value: "inappropriate", label: "Inappropriate or offensive content" },
  { value: "duplicate", label: "Duplicate fundraiser" },
  { value: "other", label: "Something else" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: Id<"campaigns">;
  campaignTitle: string;
};

export default function ReportFundraiserDialog({
  open,
  onOpenChange,
  campaignId,
  campaignTitle,
}: Props) {
  const submitReport = useMutation(api.campaignReports.submitReport);

  const [step, setStep] = useState<"form" | "success">("form");
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetAndClose = (value: boolean) => {
    onOpenChange(value);
    if (!value) {
      // Reset after close animation
      setTimeout(() => {
        setStep("form");
        setReason(null);
        setDetails("");
        setIsSubmitting(false);
      }, 200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast.error("Please select a reason.");
      return;
    }
    if (details.trim().length < 10) {
      toast.error("Please share a few more details (at least 10 characters).");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReport({
        campaignId,
        reason,
        details: details.trim(),
      });
      setStep("success");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message?: string };
        toast.error(data?.message ?? "Could not submit report.");
      } else {
        toast.error("Could not submit report. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[480px] bg-white text-[#121212] border border-[#cfcfcf]">
        {step === "form" ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-[#121212]">
                Why are you reporting this fundraiser?
              </DialogTitle>
              <DialogDescription className="text-[#525252]">
                You're reporting{" "}
                <span className="font-medium text-[#121212]">
                  {campaignTitle}
                </span>
                .{" "}
                <a
                  href="/help"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#2d6b5e] hover:text-[#2d6b5e]"
                >
                  See more details here
                </a>{" "}
                to learn how we prevent fraud.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-[#121212]">
                  Reason
                </Label>
                <RadioGroup
                  value={reason ?? ""}
                  onValueChange={(v) => setReason(v as Reason)}
                  className="gap-2"
                >
                  {REASON_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      htmlFor={`reason-${opt.value}`}
                      className="flex items-center gap-3 rounded-md border border-[#cfcfcf] bg-white px-3 py-2.5 cursor-pointer hover:bg-[#f5f5f5] transition-colors has-[[data-state=checked]]:border-[#3d8d7a] has-[[data-state=checked]]:bg-[#3d8d7a]/5"
                    >
                      <RadioGroupItem
                        id={`reason-${opt.value}`}
                        value={opt.value}
                        className="border-[#c4c4c4] text-[#2d6b5e] data-[state=checked]:border-[#3d8d7a]"
                      />
                      <span className="text-sm text-[#121212]">
                        {opt.label}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="report-details"
                  className="text-sm font-medium text-[#121212]"
                >
                  Tell us more
                </Label>
                <Textarea
                  id="report-details"
                  placeholder="Share any details that can help our team review this fundraiser..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={4}
                  className="resize-none bg-white border-[#c4c4c4] text-[#121212] placeholder:text-[#999] focus-visible:ring-[#3d8d7a]/30 focus-visible:border-[#3d8d7a]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => resetAndClose(false)}
                disabled={isSubmitting}
                className="cursor-pointer text-[#525252] hover:text-[#121212] hover:bg-[#f5f5f5]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !reason}
                className="cursor-pointer bg-[#3d8d7a] hover:bg-[#3d8d7a]/90 text-white border-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-4 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-[#3d8d7a]/10 flex items-center justify-center mb-4">
              <HandHeart className="w-7 h-7 text-[#2d6b5e]" />
            </div>
            <DialogHeader className="sm:text-center">
              <DialogTitle className="text-center text-[#121212]">
                Thank you for helping keep our platform safe
              </DialogTitle>
              <DialogDescription className="text-center text-[#525252]">
                Someone from our team will review this case.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 sm:justify-center">
              <Button
                type="button"
                onClick={() => resetAndClose(false)}
                className="cursor-pointer bg-[#3d8d7a] hover:bg-[#3d8d7a]/90 text-white border-0"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
