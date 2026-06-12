import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";

export type SubscriptionAction = "cancel" | "pause" | "resume";

const COPY: Record<
  SubscriptionAction,
  { title: string; description: string; confirmLabel: string; tone: "destructive" | "default" }
> = {
  cancel: {
    title: "Cancel monthly donation?",
    description:
      "You won't be charged again, and this campaign will lose your monthly support. You can always start a new donation later.",
    confirmLabel: "Cancel subscription",
    tone: "destructive",
  },
  pause: {
    title: "Pause monthly donation?",
    description:
      "Upcoming invoices are voided until you resume. You won't be charged while paused, and you can resume anytime.",
    confirmLabel: "Pause subscription",
    tone: "default",
  },
  resume: {
    title: "Resume monthly donation?",
    description:
      "Your next charge will happen on the normal schedule. The campaign will start receiving your monthly support again.",
    confirmLabel: "Resume subscription",
    tone: "default",
  },
};

interface SubscriptionActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: SubscriptionAction | null;
  campaignTitle: string;
  amount: number;
  busy: boolean;
  onConfirm: () => void;
}

export default function SubscriptionActionDialog({
  open,
  onOpenChange,
  action,
  campaignTitle,
  amount,
  busy,
  onConfirm,
}: SubscriptionActionDialogProps) {
  if (!action) return null;
  const copy = COPY[action];

  return (
    <Dialog open={open} onOpenChange={(v) => !busy && onOpenChange(v)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
          <p className="font-medium text-gray-900 truncate">{campaignTitle}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / month
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Keep as-is
          </Button>
          <Button
            onClick={onConfirm}
            disabled={busy}
            variant={copy.tone === "destructive" ? "destructive" : "default"}
            className={
              copy.tone === "destructive"
                ? ""
                : "bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white"
            }
          >
            {busy ? <Spinner /> : copy.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
