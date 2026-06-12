import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { ConvexError } from "convex/values";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  FileText,
  AlignLeft,
  ImageIcon,
  Tag,
  Mail,
  UserPlus,
  MapPin,
  Phone,
  Ticket,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";

const PROVIDERS = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept payments via Stripe's global payment platform",
    icon: CreditCard,
    color: "bg-[#635BFF]/10 text-[#635BFF]",
  },
] as const;

type Step = "select" | "configure";

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

const DEFAULT_TOGGLES: CheckoutToggles = {
  sendCampaignName: true,
  sendDescription: true,
  sendImage: true,
  sendMetadata: true,
  sendReceiptEmail: true,
  createCustomer: false,
  collectBillingAddress: false,
  collectPhone: false,
  allowPromoCodes: false,
};

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

export default function NewProcessorPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("select");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  if (step === "configure" && selectedProvider === "stripe") {
    return (
      <StripeConfigStep
        onBack={() => setStep("select")}
        onComplete={() => navigate("/portal/processors")}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/portal/processors")}
            className="p-1.5 hover:bg-accent rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Create New Processor</h1>
            <p className="text-xs text-muted-foreground">Select a payment provider to get started</p>
          </div>
        </div>
      </div>

      {/* Provider grid */}
      <div className="flex-1 overflow-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
          {PROVIDERS.map((provider) => {
            const isSelected = selectedProvider === provider.id;
            return (
              <button
                key={provider.id}
                onClick={() => setSelectedProvider(provider.id)}
                className={cn(
                  "relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-[#1B4332] bg-[#1B4332]/5"
                    : "border-border hover:border-border/70 bg-card",
                )}
              >
                {/* Icon */}
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", provider.color)}>
                  <provider.icon className="w-5 h-5" />
                </div>
                {/* Text */}
                <div>
                  <span className="font-semibold text-sm text-foreground">{provider.name}</span>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {provider.description}
                  </p>
                </div>
                {/* Selected check */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-5 h-5 text-[#1B4332] dark:text-emerald-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-4 md:px-6 lg:px-8 py-4 border-t border-border">
        <Button
          variant="ghost"
          onClick={() => navigate("/portal/processors")}
          className="cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (!selectedProvider) {
              toast.error("Please select a payment provider");
              return;
            }
            setStep("configure");
          }}
          disabled={!selectedProvider}
          className="bg-[#1B4332] hover:bg-[#143728] text-white cursor-pointer"
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function StripeConfigStep({
  onBack,
  onComplete,
}: {
  onBack: () => void;
  onComplete: () => void;
}) {
  const addStripe = useMutation(api.processors.addStripe);
  const validateKey = useAction(api.processorsActions.validateStripeKey);

  const [name, setName] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    accountName: string | null;
    mode: string;
  } | null>(null);

  // Checkout data toggles
  const [toggles, setToggles] = useState<CheckoutToggles>(DEFAULT_TOGGLES);
  const [statementDescriptor, setStatementDescriptor] = useState("");

  const handleToggle = (key: keyof CheckoutToggles, checked: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: checked }));
  };

  const handleDescriptorChange = (value: string) => {
    if (value.length > 22) return;
    setStatementDescriptor(value);
  };

  const descriptorLen = statementDescriptor.length;
  const descriptorError =
    descriptorLen > 0 && descriptorLen < 5
      ? "Minimum 5 characters"
      : descriptorLen > 22
        ? "Maximum 22 characters"
        : null;

  const handleValidate = async () => {
    if (!secretKey.trim()) {
      toast.error("Please enter a Stripe secret key");
      return;
    }
    setIsValidating(true);
    setValidationResult(null);
    try {
      const result = await validateKey({ secretKey: secretKey.trim() });
      setValidationResult(result);
      if (!name.trim() && result.accountName) {
        setName(result.accountName);
      }
      toast.success("Stripe key validated successfully");
    } catch (err) {
      const msg = err instanceof ConvexError
        ? (err.data as { message: string }).message
        : "Failed to validate key";
      toast.error(msg);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (!secretKey.trim()) {
      toast.error("Please enter a Stripe secret key");
      return;
    }
    if (descriptorError) {
      toast.error(descriptorError);
      return;
    }
    setIsSaving(true);
    try {
      const result = await addStripe({
        name: name.trim() || "Stripe",
        secretKey: secretKey.trim(),
        publicKey: publicKey.trim() || undefined,
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
      });
      toast.success(`Stripe processor added in ${result.mode} mode`);
      onComplete();
    } catch (err) {
      const msg = err instanceof ConvexError
        ? (err.data as { message: string }).message
        : "Failed to add processor";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 md:px-6 lg:px-8 py-4 border-b border-border">
        <button
          onClick={onBack}
          className="p-1.5 hover:bg-accent rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#635BFF]/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#635BFF]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Configure Stripe</h1>
            <p className="text-xs text-muted-foreground">Enter your API keys and checkout preferences</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto px-4 md:px-6 lg:px-8 py-6">
        <div className="max-w-lg space-y-6">
          {/* ---- API Keys section ---- */}
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              API Keys
            </h2>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="proc-name">Processor Name</Label>
              <Input
                id="proc-name"
                placeholder="e.g. Stripe Production"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Secret key */}
            <div className="space-y-1.5">
              <Label htmlFor="proc-secret">
                Secret Key <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="proc-secret"
                  type="password"
                  placeholder="sk_test_... or sk_live_..."
                  value={secretKey}
                  onChange={(e) => {
                    setSecretKey(e.target.value);
                    setValidationResult(null);
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleValidate}
                  disabled={isValidating || !secretKey.trim()}
                  className="cursor-pointer shrink-0"
                >
                  {isValidating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  <span className="ml-1.5 hidden sm:inline">Validate</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Find your keys in the{" "}
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#635BFF] underline"
                >
                  Stripe Dashboard
                </a>
              </p>
            </div>

            {/* Validation result */}
            {validationResult && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-emerald-800">Key is valid</p>
                  {validationResult.accountName && (
                    <p className="text-emerald-600">Account: {validationResult.accountName}</p>
                  )}
                  <p className="text-emerald-600 capitalize">Mode: {validationResult.mode}</p>
                </div>
              </div>
            )}

            {/* Public key */}
            <div className="space-y-1.5">
              <Label htmlFor="proc-public">
                Publishable Key <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="proc-public"
                placeholder="pk_test_... or pk_live_..."
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
              />
            </div>

            {/* Live key warning */}
            {secretKey.startsWith("sk_live_") && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">
                  You are adding a <strong>live</strong> Stripe key. Real transactions will be processed.
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* ---- Checkout Data Settings section ---- */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Checkout Data Settings
            </h2>
            <p className="text-xs text-muted-foreground">
              Control what data is sent to Stripe during checkout for this processor
            </p>

            {/* Toggle rows */}
            <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
              {TOGGLE_SETTINGS.map((setting) => (
                <div
                  key={setting.key}
                  className="flex items-center gap-4 px-4 py-3.5 bg-card"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                    {setting.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {setting.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
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

            {/* Statement descriptor */}
            <div className="rounded-xl border border-border p-4 bg-card space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Statement descriptor
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Customize what appears on the donor's bank statement. Overrides the Stripe default.
                  </p>
                </div>
              </div>

              <div className="pl-11">
                <div className="relative max-w-sm">
                  <Input
                    value={statementDescriptor}
                    onChange={(e) => handleDescriptorChange(e.target.value)}
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
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Leave blank to use your Stripe account default. Letters, numbers, spaces, and . & - / only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-4 md:px-6 lg:px-8 py-4 border-t border-border">
        <Button variant="ghost" onClick={onBack} className="cursor-pointer">
          Back
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !secretKey.trim() || !!descriptorError}
          className="bg-[#1B4332] hover:bg-[#143728] text-white cursor-pointer"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Add Processor
        </Button>
      </div>
    </div>
  );
}
