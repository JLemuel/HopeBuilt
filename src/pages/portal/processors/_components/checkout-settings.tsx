import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { ConvexError } from "convex/values";
import { Button } from "@/components/ui/button.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog.tsx";
import {
  Save,
  Loader2,
  FileText,
  AlignLeft,
  ImageIcon,
  Tag,
  CreditCard,
  Mail,
  UserPlus,
  MapPin,
  Phone,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";

type ProcessorSettings = {
  _id: Id<"paymentProcessors">;
  name: string;
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
};

type CheckoutToggles = {
  sendCampaignName: boolean;
  sendDescription: boolean;
  sendImage: boolean;
  sendMetadata: boolean;
  sendReceiptEmail: boolean;
  createCustomer: boolean;
  collectBillingAddress: boolean;
  collectPhone: boolean;
  allowPromoCodes: boolean;
};

type PaymentMethodToggles = {
  pmCard: boolean;
  pmApplePay: boolean;
  pmGooglePay: boolean;
  pmLink: boolean;
  pmKlarna: boolean;
  pmCashApp: boolean;
  pmAmazonPay: boolean;
};

const PAYMENT_METHOD_SETTINGS: {
  key: keyof PaymentMethodToggles;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "pmCard",
    label: "Credit / Debit Card",
    description: "Accept card payments via Stripe",
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    key: "pmApplePay",
    label: "Apple Pay",
    description: "Accept Apple Pay on Safari and iOS devices",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    ),
  },
  {
    key: "pmGooglePay",
    label: "Google Pay",
    description: "Accept Google Pay on Chrome and Android devices",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
  {
    key: "pmLink",
    label: "Link by Stripe",
    description: "One-click checkout with saved payment info",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#00D66F" />
        <path d="M7.5 12.5l3.5-4.5v3.5H17l-3.5 4.5V12.5H7.5z" fill="#1a1a1a" />
      </svg>
    ),
  },
  {
    key: "pmKlarna",
    label: "Klarna",
    description: "Buy now, pay later with Klarna installments",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#FFB3C7" />
        <text x="12" y="16.5" textAnchor="middle" fontWeight="900" fontSize="13" fontFamily="system-ui, sans-serif" fill="#0B051D">K</text>
      </svg>
    ),
  },
  {
    key: "pmCashApp",
    label: "Cash App Pay",
    description: "Accept payments via Cash App",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#00D632" />
        <text x="12" y="17" textAnchor="middle" fontWeight="800" fontSize="14" fontFamily="system-ui, sans-serif" fill="white">$</text>
      </svg>
    ),
  },
  {
    key: "pmAmazonPay",
    label: "Amazon Pay",
    description: "Accept payments with Amazon account credentials",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#FF9900" />
        <text x="12" y="16" textAnchor="middle" fontWeight="900" fontSize="11" fontFamily="system-ui, sans-serif" fill="#232F3E">a</text>
      </svg>
    ),
  },
];

const TOGGLE_SETTINGS: {
  key: keyof CheckoutToggles;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "sendCampaignName",
    label: "Send campaign name",
    description: "Send the campaign title to Stripe as the line-item product name",
    icon: <FileText className="w-4 h-4" />,
  },
  {
    key: "sendDescription",
    label: "Send campaign description",
    description: "Send the campaign description to Stripe in the checkout line item",
    icon: <AlignLeft className="w-4 h-4" />,
  },
  {
    key: "sendImage",
    label: "Send campaign image",
    description: "Send the campaign image URL to Stripe for display at checkout",
    icon: <ImageIcon className="w-4 h-4" />,
  },
  {
    key: "sendMetadata",
    label: "Send donor metadata",
    description: "Send campaign slug, donation type, and tracking ID to Stripe metadata",
    icon: <Tag className="w-4 h-4" />,
  },
  {
    key: "sendReceiptEmail",
    label: "Send receipt email",
    description: "Send Stripe's built-in payment receipt email to the donor",
    icon: <Mail className="w-4 h-4" />,
  },
  {
    key: "createCustomer",
    label: "Send donor as Stripe customer",
    description: "Create a Stripe Customer record storing donor info in Stripe",
    icon: <UserPlus className="w-4 h-4" />,
  },
  {
    key: "collectBillingAddress",
    label: "Send billing address request",
    description: "Require the donor to enter a billing address at checkout",
    icon: <MapPin className="w-4 h-4" />,
  },
  {
    key: "collectPhone",
    label: "Send phone number request",
    description: "Collect the donor's phone number at checkout",
    icon: <Phone className="w-4 h-4" />,
  },
  {
    key: "allowPromoCodes",
    label: "Send promo code field",
    description: "Allow donors to enter coupon or promo codes at checkout",
    icon: <Ticket className="w-4 h-4" />,
  },
];

export default function CheckoutSettingsDialog({
  processor,
  open,
  onOpenChange,
}: {
  processor: ProcessorSettings;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const saveSettings = useMutation(api.processors.saveCheckoutSettings);

  const [toggles, setToggles] = useState<CheckoutToggles>({
    sendCampaignName: processor.sendCampaignName,
    sendDescription: processor.sendDescription,
    sendImage: processor.sendImage,
    sendMetadata: processor.sendMetadata,
    sendReceiptEmail: processor.sendReceiptEmail,
    createCustomer: processor.createCustomer,
    collectBillingAddress: processor.collectBillingAddress,
    collectPhone: processor.collectPhone,
    allowPromoCodes: processor.allowPromoCodes,
  });

  const [pmToggles, setPmToggles] = useState<PaymentMethodToggles>({
    pmCard: processor.pmCard,
    pmApplePay: processor.pmApplePay,
    pmGooglePay: processor.pmGooglePay,
    pmLink: processor.pmLink,
    pmKlarna: processor.pmKlarna,
    pmCashApp: processor.pmCashApp,
    pmAmazonPay: processor.pmAmazonPay,
  });

  const [statementDescriptor, setStatementDescriptor] = useState(
    processor.statementDescriptor ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);

  // Reset when processor changes
  useEffect(() => {
    setToggles({
      sendCampaignName: processor.sendCampaignName,
      sendDescription: processor.sendDescription,
      sendImage: processor.sendImage,
      sendMetadata: processor.sendMetadata,
      sendReceiptEmail: processor.sendReceiptEmail,
      createCustomer: processor.createCustomer,
      collectBillingAddress: processor.collectBillingAddress,
      collectPhone: processor.collectPhone,
      allowPromoCodes: processor.allowPromoCodes,
    });
    setPmToggles({
      pmCard: processor.pmCard,
      pmApplePay: processor.pmApplePay,
      pmGooglePay: processor.pmGooglePay,
      pmLink: processor.pmLink,
      pmKlarna: processor.pmKlarna,
      pmCashApp: processor.pmCashApp,
      pmAmazonPay: processor.pmAmazonPay,
    });
    setStatementDescriptor(processor.statementDescriptor ?? "");
  }, [processor]);

  const handleToggle = (key: keyof CheckoutToggles, checked: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: checked }));
  };

  const handlePmToggle = (key: keyof PaymentMethodToggles, checked: boolean) => {
    // Ensure at least one payment method stays enabled
    const next = { ...pmToggles, [key]: checked };
    const anyEnabled = Object.values(next).some((v) => v);
    if (!anyEnabled) {
      toast.error("At least one payment method must be enabled");
      return;
    }
    setPmToggles(next);
  };

  const descriptorLen = statementDescriptor.length;
  const descriptorError =
    descriptorLen > 0 && descriptorLen < 5
      ? "Minimum 5 characters"
      : descriptorLen > 22
        ? "Maximum 22 characters"
        : null;

  const handleSave = async () => {
    if (descriptorError) {
      toast.error(descriptorError);
      return;
    }
    setIsSaving(true);
    try {
      await saveSettings({
        processorId: processor._id,
        sendCampaignName: toggles.sendCampaignName,
        sendDescription: toggles.sendDescription,
        sendImage: toggles.sendImage,
        sendMetadata: toggles.sendMetadata,
        statementDescriptor: statementDescriptor.trim() || undefined,
        sendReceiptEmail: toggles.sendReceiptEmail,
        createCustomer: toggles.createCustomer,
        collectBillingAddress: toggles.collectBillingAddress,
        collectPhone: toggles.collectPhone,
        allowPromoCodes: toggles.allowPromoCodes,
        pmCard: pmToggles.pmCard,
        pmApplePay: pmToggles.pmApplePay,
        pmGooglePay: pmToggles.pmGooglePay,
        pmLink: pmToggles.pmLink,
        pmKlarna: pmToggles.pmKlarna,
        pmCashApp: pmToggles.pmCashApp,
        pmAmazonPay: pmToggles.pmAmazonPay,
      });
      toast.success(`Checkout settings saved for ${processor.name}`);
      onOpenChange(false);
    } catch (err) {
      const msg =
        err instanceof ConvexError
          ? (err.data as { message: string }).message
          : "Failed to save settings";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checkout Settings — {processor.name}</DialogTitle>
          <DialogDescription>
            Control what data is sent to Stripe during checkout for this processor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Payment Methods section */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Payment Methods
            </p>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {PAYMENT_METHOD_SETTINGS.map((setting) => (
                <div
                  key={setting.key}
                  className="flex items-center gap-3 px-3 py-3"
                >
                  <div className="w-7 h-7 rounded-md bg-[#f0f7f4] flex items-center justify-center shrink-0 text-[#3d8d7a]">
                    {setting.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {setting.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {setting.description}
                    </p>
                  </div>
                  <Switch
                    checked={pmToggles[setting.key]}
                    onCheckedChange={(checked) =>
                      handlePmToggle(setting.key, checked)
                    }
                    className="cursor-pointer shrink-0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Checkout data section */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Checkout Data
            </p>
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {TOGGLE_SETTINGS.map((setting) => (
                <div
                  key={setting.key}
                  className="flex items-center gap-3 px-3 py-3"
                >
                  <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                    {setting.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {setting.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      {setting.description}
                    </p>
                  </div>
                  <Switch
                    checked={toggles[setting.key]}
                    onCheckedChange={(checked) =>
                      handleToggle(setting.key, checked)
                    }
                    className="cursor-pointer shrink-0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Statement descriptor */}
          <div className="rounded-xl border border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                <CreditCard className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium text-foreground">
                Statement descriptor
              </p>
            </div>
            <div className="pl-9">
              <div className="relative">
                <Input
                  value={statementDescriptor}
                  onChange={(e) => {
                    if (e.target.value.length <= 22) {
                      setStatementDescriptor(e.target.value);
                    }
                  }}
                  placeholder="e.g. HOPEBUILT DONATE"
                  className="pr-14"
                  maxLength={22}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {descriptorLen}/22
                </span>
              </div>
              {descriptorError && (
                <p className="text-xs text-red-500 mt-1">{descriptorError}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">
                Leave blank to use Stripe default. Letters, numbers, spaces, and . & - / only.
              </p>
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving || !!descriptorError}
              className="bg-[#1B4332] hover:bg-[#143728] text-white cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
