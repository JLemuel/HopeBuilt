import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import StripeLogo from "@/components/stripe-logo.tsx";
import { ConvexError } from "convex/values";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty.tsx";
import {
  CreditCard,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Loader2,
  Copy,
  CheckCircle2,
  Settings2,
  Pencil,
  Key,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { format, formatDistanceToNow } from "date-fns";
import ProcessorBalance from "./_components/processor-balance.tsx";
import ProcessorBubbleMap from "./_components/processor-bubble-map.tsx";
import CheckoutSettingsDialog from "./_components/checkout-settings.tsx";

export default function ProcessorsPage() {
  const processors = useQuery(api.processors.list);
  const navigate = useNavigate();
  const resyncAll = useAction(api.processorsActions.resyncAllPaymentMethodConfigurations);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    try {
      const result = await resyncAll();
      if (result.failed === 0) {
        toast.success(`Synced ${result.synced} processor${result.synced === 1 ? "" : "s"} with Stripe`);
      } else {
        toast.warning(
          `Synced ${result.synced}, ${result.failed} failed${result.errors[0] ? `: ${result.errors[0]}` : ""}`,
        );
      }
    } catch (err) {
      const msg =
        err instanceof ConvexError
          ? (err.data as { message: string }).message
          : "Failed to sync processors";
      toast.error(msg);
    } finally {
      setIsSyncingAll(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Processors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your connected payment processors
          </p>
        </div>
        <div className="flex items-center gap-2">
          {processors && processors.length > 0 && (
            <Button
              variant="secondary"
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              className="cursor-pointer"
              title="Re-sync all payment method configurations with Stripe"
            >
              {isSyncingAll ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sync all with Stripe
            </Button>
          )}
          <Button
            onClick={() => navigate("/portal/processors/new")}
            className="bg-[#1B4332] hover:bg-[#143728] text-white cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Processor
          </Button>
        </div>
      </div>

      {/* Processors list */}
      {processors === undefined ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : processors.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CreditCard />
                </EmptyMedia>
                <EmptyTitle>No processors connected</EmptyTitle>
                <EmptyDescription>
                  Connect a processor to start accepting payments
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  size="sm"
                  onClick={() => navigate("/portal/processors/new")}
                  className="bg-[#1B4332] hover:bg-[#143728] text-white cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Processor
                </Button>
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {processors.map((p) => (
            <ProcessorCard key={p._id} processor={p} />
          ))}
        </div>
      )}

      {/* Load Balancing section — only show when processors exist */}
      {processors && processors.length > 0 && (
        <div className="pt-4 border-t border-border">
          <ProcessorBalance processors={processors} />
        </div>
      )}

      {/* Processor Bubble Map — replaces old volume cards */}
      {processors && processors.length > 0 && (
        <div className="pt-4 border-t border-border">
          <ProcessorBubbleMap />
        </div>
      )}
    </div>
  );
}

type ProcessorItem = {
  _id: Id<"paymentProcessors">;
  name: string;
  provider: "stripe";
  mode: "live" | "sandbox";
  status: "active" | "inactive";
  processorId: string;
  publicKey?: string;
  stripeWebhookSecret?: string;
  addedAt: string;
  _creationTime: number;
  sendCampaignName: boolean;
  sendDescription: boolean;
  sendImage: boolean;
  sendMetadata: boolean;
  statementDescriptor?: string;
  sendReceiptEmail: boolean;
  createCustomer: boolean;
  collectBillingAddress: boolean;
  collectPhone: boolean;
  allowPromoCodes: boolean;
  pmCard: boolean;
  pmApplePay: boolean;
  pmGooglePay: boolean;
  pmLink: boolean;
  pmKlarna: boolean;
  pmCashApp: boolean;
  pmAmazonPay: boolean;
  paymentMethodConfigurationId: string | null;
  paymentMethodConfigSyncedAt: string | null;
  paymentMethodConfigSyncError: string | null;
};

function ProcessorCard({ processor }: { processor: ProcessorItem }) {
  const toggleStatus = useMutation(api.processors.toggleStatus);
  const removeProcessor = useMutation(api.processors.remove);
  const updatePublicKey = useMutation(api.processors.updatePublicKey);
  const updateWebhookSecret = useMutation(api.processors.updateWebhookSecret);
  const resyncProcessor = useAction(api.processorsActions.resyncPaymentMethodConfiguration);
  const [isToggling, setIsToggling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCheckoutSettings, setShowCheckoutSettings] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPublicKeyEdit, setShowPublicKeyEdit] = useState(false);
  const [showWebhookSecretEdit, setShowWebhookSecretEdit] = useState(false);
  const [publicKeyInput, setPublicKeyInput] = useState(processor.publicKey ?? "");
  const [webhookSecretInput, setWebhookSecretInput] = useState("");
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isSavingWebhookSecret, setIsSavingWebhookSecret] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const result = await toggleStatus({ processorId: processor._id });
      toast.success(`Processor ${result.status === "active" ? "activated" : "deactivated"}`);
    } catch (err) {
      const msg = err instanceof ConvexError
        ? (err.data as { message: string }).message
        : "Failed to toggle status";
      toast.error(msg);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeProcessor({ processorId: processor._id });
      toast.success("Processor removed");
      setShowDeleteConfirm(false);
    } catch (err) {
      const msg = err instanceof ConvexError
        ? (err.data as { message: string }).message
        : "Failed to remove processor";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const isActive = processor.status === "active";

  const handleSavePublicKey = async () => {
    setIsSavingKey(true);
    try {
      await updatePublicKey({
        processorId: processor._id,
        publicKey: publicKeyInput.trim(),
      });
      toast.success("Publishable key updated");
      setShowPublicKeyEdit(false);
    } catch (err) {
      const msg = err instanceof ConvexError
        ? (err.data as { message: string }).message
        : "Failed to update publishable key";
      toast.error(msg);
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleSaveWebhookSecret = async () => {
    setIsSavingWebhookSecret(true);
    try {
      await updateWebhookSecret({
        processorId: processor._id,
        webhookSecret: webhookSecretInput.trim(),
      });
      toast.success("Webhook signing secret updated");
      setShowWebhookSecretEdit(false);
      setWebhookSecretInput("");
    } catch (err) {
      const msg = err instanceof ConvexError
        ? (err.data as { message: string }).message
        : "Failed to update webhook secret";
      toast.error(msg);
    } finally {
      setIsSavingWebhookSecret(false);
    }
  };

  const handleResync = async () => {
    setIsResyncing(true);
    try {
      await resyncProcessor({ processorId: processor._id });
      toast.success(`${processor.name} synced with Stripe`);
    } catch (err) {
      const msg = err instanceof ConvexError
        ? (err.data as { message: string }).message
        : "Failed to sync with Stripe";
      toast.error(msg);
    } finally {
      setIsResyncing(false);
    }
  };

  // Sync status derived values
  const hasSyncError = !!processor.paymentMethodConfigSyncError;
  const isSynced = !!processor.paymentMethodConfigurationId && !hasSyncError;
  const syncedAgo = processor.paymentMethodConfigSyncedAt
    ? formatDistanceToNow(new Date(processor.paymentMethodConfigSyncedAt), { addSuffix: true })
    : null;

  return (
    <>
      <Card className="overflow-hidden py-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
          {/* Logo + info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
              <StripeLogo className="w-10 h-10" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">{processor.name}</h3>
                {isActive ? (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      processor.mode === "live"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700",
                    )}
                  >
                    {processor.mode === "live" ? "Live" : "Sandbox"}
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-gray-100 text-gray-500"
                  >
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Added {format(new Date(processor.addedAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          {/* Keys */}
          <div className="flex flex-col gap-1.5 sm:ml-auto">
            {/* Secret key */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-medium w-6 shrink-0">SK</span>
              <code className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg font-mono truncate max-w-[180px]">
                {processor.processorId}
              </code>
              <button
                onClick={() => copyToClipboard(processor.processorId, "sk")}
                className="p-1.5 hover:bg-accent rounded-lg transition-colors cursor-pointer"
                title="Copy secret key"
              >
                {copiedField === "sk" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            </div>
            {/* Publishable key */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-medium w-6 shrink-0">PK</span>
              {processor.publicKey ? (
                <>
                  <code className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg font-mono truncate max-w-[180px]">
                    {processor.publicKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(processor.publicKey!, "pk")}
                    className="p-1.5 hover:bg-accent rounded-lg transition-colors cursor-pointer"
                    title="Copy publishable key"
                  >
                    {copiedField === "pk" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setPublicKeyInput("");
                    setShowPublicKeyEdit(true);
                  }}
                  className="text-xs text-[#635BFF] hover:text-[#4a42cc] font-medium cursor-pointer"
                >
                  + Add publishable key
                </button>
              )}
              {processor.publicKey && (
                <button
                  onClick={() => {
                    setPublicKeyInput(processor.publicKey ?? "");
                    setShowPublicKeyEdit(true);
                  }}
                  className="p-1.5 hover:bg-accent rounded-lg transition-colors cursor-pointer"
                  title="Edit publishable key"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            {/* Webhook secret */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-medium w-6 shrink-0">WH</span>
              {processor.stripeWebhookSecret ? (
                <code className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg font-mono truncate max-w-[180px]">
                  {processor.stripeWebhookSecret}
                </code>
              ) : (
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-lg">
                  Not set
                </span>
              )}
              <button
                onClick={() => {
                  setWebhookSecretInput("");
                  setShowWebhookSecretEdit(true);
                }}
                className="p-1.5 hover:bg-accent rounded-lg transition-colors cursor-pointer"
                title="Set webhook signing secret"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResync}
              disabled={isResyncing}
              className="cursor-pointer"
              title="Re-sync payment methods with Stripe"
            >
              {isResyncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCheckoutSettings(true)}
              className="cursor-pointer"
              title="Checkout settings"
            >
              <Settings2 className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              disabled={isToggling}
              className="cursor-pointer"
              title={isActive ? "Deactivate" : "Activate"}
            >
              {isToggling ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isActive ? (
                <PowerOff className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Power className="w-4 h-4 text-emerald-600" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50"
              title="Remove processor"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stripe sync status footer */}
        <div
          className={cn(
            "flex items-center justify-between gap-3 px-5 py-2.5 border-t border-border text-xs",
            hasSyncError
              ? "bg-red-50 dark:bg-red-950/20"
              : isSynced
                ? "bg-emerald-50/50 dark:bg-emerald-950/10"
                : "bg-amber-50/50 dark:bg-amber-950/10",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {hasSyncError ? (
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
            ) : isSynced ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            )}
            <span
              className={cn(
                "font-medium truncate",
                hasSyncError
                  ? "text-red-700 dark:text-red-400"
                  : isSynced
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-amber-700 dark:text-amber-400",
              )}
            >
              {hasSyncError
                ? `Sync failed: ${processor.paymentMethodConfigSyncError}`
                : isSynced
                  ? `Payment methods synced with Stripe${syncedAgo ? ` ${syncedAgo}` : ""}`
                  : "Payment methods not yet synced with Stripe"}
            </span>
          </div>
          {(hasSyncError || !isSynced) && (
            <button
              onClick={handleResync}
              disabled={isResyncing}
              className="text-xs font-medium text-foreground hover:underline cursor-pointer shrink-0 disabled:opacity-50"
            >
              {isResyncing ? "Syncing…" : "Sync now"}
            </button>
          )}
        </div>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Processor</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{processor.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout settings dialog */}
      <CheckoutSettingsDialog
        processor={processor}
        open={showCheckoutSettings}
        onOpenChange={setShowCheckoutSettings}
      />

      {/* Publishable key edit dialog */}
      <Dialog open={showPublicKeyEdit} onOpenChange={setShowPublicKeyEdit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-[#635BFF]" />
              Publishable Key
            </DialogTitle>
            <DialogDescription>
              Your Stripe publishable key is required for the checkout form to accept payments directly on your site. Find it in your{" "}
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#635BFF] underline"
              >
                Stripe Dashboard
              </a>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="pk_live_... or pk_test_..."
              value={publicKeyInput}
              onChange={(e) => setPublicKeyInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowPublicKeyEdit(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePublicKey}
              disabled={isSavingKey}
              className="bg-[#1B4332] hover:bg-[#143728] text-white cursor-pointer"
            >
              {isSavingKey && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Webhook secret edit dialog */}
      <Dialog open={showWebhookSecretEdit} onOpenChange={setShowWebhookSecretEdit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-[#635BFF]" />
              Webhook Signing Secret
            </DialogTitle>
            <DialogDescription>
              Paste the Stripe endpoint signing secret for this processor. It
              starts with <code>whsec_</code> and lets Convex verify webhook
              events even when multiple Stripe processors are configured.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="whsec_..."
              value={webhookSecretInput}
              onChange={(e) => setWebhookSecretInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Leave this empty and save to clear the processor-specific secret.
              The deployment-wide STRIPE_WEBHOOK_SECRET fallback will still work
              if configured.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowWebhookSecretEdit(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveWebhookSecret}
              disabled={isSavingWebhookSecret}
              className="bg-[#1B4332] hover:bg-[#143728] text-white cursor-pointer"
            >
              {isSavingWebhookSecret && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
