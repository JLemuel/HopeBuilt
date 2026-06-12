import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useState, useEffect } from "react";
import {
  DollarSign,
  Eye,
  Globe,
  Layers,
  MousePointerClick,
  Target,
  Users,
  Zap,
  ChevronDown,
  ChevronUp,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { cn } from "@/lib/utils.ts";

// ── Meta API Option Constants ──────────────────────────────────

const OBJECTIVES = [
  { value: "OUTCOME_TRAFFIC", label: "Traffic" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engagement" },
  { value: "OUTCOME_LEADS", label: "Leads" },
  { value: "OUTCOME_SALES", label: "Sales" },
  { value: "OUTCOME_AWARENESS", label: "Awareness" },
] as const;

const OPTIMIZATION_GOALS = [
  { value: "LINK_CLICKS", label: "Link Clicks" },
  { value: "LANDING_PAGE_VIEWS", label: "Landing Page Views" },
  { value: "IMPRESSIONS", label: "Impressions" },
  { value: "REACH", label: "Reach" },
  { value: "OFFSITE_CONVERSIONS", label: "Conversions" },
  { value: "VALUE", label: "Value" },
] as const;

const BID_STRATEGIES = [
  { value: "LOWEST_COST_WITHOUT_CAP", label: "Highest Volume" },
  { value: "COST_CAP", label: "Cost Per Result Goal" },
  { value: "LOWEST_COST_WITH_BID_CAP", label: "Bid Cap" },
] as const;

const CONVERSION_EVENTS = [
  { value: "DONATE", label: "Donate" },
  { value: "PURCHASE", label: "Purchase" },
  { value: "LEAD", label: "Lead" },
  { value: "COMPLETE_REGISTRATION", label: "Complete Registration" },
  { value: "CONTACT", label: "Contact" },
  { value: "VIEW_CONTENT", label: "View Content" },
  { value: "ADD_TO_CART", label: "Add to Cart" },
  { value: "INITIATE_CHECKOUT", label: "Initiate Checkout" },
] as const;

const CTA_OPTIONS = [
  { value: "DONATE_NOW", label: "Donate Now" },
  { value: "LEARN_MORE", label: "Learn More" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "SHOP_NOW", label: "Shop Now" },
  { value: "GET_OFFER", label: "Get Offer" },
  { value: "CONTACT_US", label: "Contact Us" },
  { value: "APPLY_NOW", label: "Apply Now" },
  { value: "SUBSCRIBE", label: "Subscribe" },
] as const;

// Optimization goals that need a pixel + conversion event (and produce a
// conversion `promoted_object` server-side). Must mirror the backend's
// CONVERSION_OPTIMIZATION_GOALS in convex/meta/launchAd.ts.
const CONVERSION_OPTIMIZATION_GOALS = new Set(["OFFSITE_CONVERSIONS", "VALUE"]);

// Bid strategies that require a per-ad-set `bid_amount` (in cents). Must mirror
// the backend's BID_STRATEGIES_REQUIRING_AMOUNT in convex/meta/launchAd.ts.
const BID_STRATEGIES_REQUIRING_AMOUNT = new Set([
  "COST_CAP",
  "LOWEST_COST_WITH_BID_CAP",
]);

// Optimization goals Meta allows for each campaign objective. Prevents the
// two selects from forming a combination Meta rejects at launch.
const GOALS_BY_OBJECTIVE: Record<string, string[]> = {
  OUTCOME_TRAFFIC: ["LINK_CLICKS", "LANDING_PAGE_VIEWS", "IMPRESSIONS", "REACH"],
  OUTCOME_ENGAGEMENT: ["LINK_CLICKS", "LANDING_PAGE_VIEWS", "IMPRESSIONS", "REACH"],
  OUTCOME_LEADS: ["LINK_CLICKS", "LANDING_PAGE_VIEWS", "OFFSITE_CONVERSIONS"],
  OUTCOME_SALES: ["OFFSITE_CONVERSIONS", "VALUE", "LINK_CLICKS", "LANDING_PAGE_VIEWS", "IMPRESSIONS", "REACH"],
  OUTCOME_AWARENESS: ["IMPRESSIONS", "REACH"],
};

const COUNTRY_OPTIONS = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "NZ", label: "New Zealand" },
  { value: "IE", label: "Ireland" },
  { value: "MX", label: "Mexico" },
  { value: "BR", label: "Brazil" },
  { value: "IN", label: "India" },
  { value: "PH", label: "Philippines" },
  { value: "NG", label: "Nigeria" },
  { value: "KE", label: "Kenya" },
  { value: "ZA", label: "South Africa" },
] as const;

// ── Types ──────────────────────────────────────────────────────

export type AdLaunchConfig = {
  adAccountMetaId: string;
  pixelMetaId: string | undefined;
  pageMetaId: string | undefined;
  instagramAccountMetaId: string | undefined;
  objective: string;
  cboEnabled: boolean;
  cboBudgetCents: number | undefined;
  optimizationGoal: string;
  bidStrategy: string;
  bidAmountCents: number | undefined;
  conversionEvent: string | undefined;
  targetingCountries: string[];
  targetingAgeMin: number;
  targetingAgeMax: number;
  cta: string;
  // ISO 8601 UTC string — if set, ad set will start delivering at this time
  scheduledStartTime: string | undefined;
};

type CampaignForLaunch = {
  _id: Id<"campaigns">;
  title: string;
  creatorName: string | null;
  status: string;
  adBudgetCents?: number;
  previousAdBudgetCents?: number;
};

type LaunchDialogStep = "config" | "budgets";

// ── Component ──────────────────────────────────────────────────

export type SavedLaunchConfig = {
  adAccountMetaId: string;
  pixelMetaId?: string;
  pageMetaId?: string;
  instagramAccountMetaId?: string;
  objective: string;
  cboEnabled: boolean;
  cboBudgetCents?: number;
  optimizationGoal: string;
  bidStrategy: string;
  bidAmountCents?: number;
  conversionEvent?: string;
  targetingCountries: string[];
  targetingAgeMin: number;
  targetingAgeMax: number;
  cta: string;
  adBudgetCents?: number;
};

export default function LaunchDialog({
  open,
  onOpenChange,
  selectedCampaigns,
  isRelaunch,
  onLaunch,
  savedConfig,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCampaigns: CampaignForLaunch[];
  isRelaunch?: boolean;
  onLaunch: (config: AdLaunchConfig, budgets: Record<string, number>) => Promise<void>;
  savedConfig?: SavedLaunchConfig | null;
}) {
  const adDefaults = useQuery(api.meta.adDefaults.get, open ? {} : "skip");
  const adAccounts = useQuery(api.metaAssets.listHealthyAdAccounts, open ? {} : "skip");
  const pixels = useQuery(api.metaAssets.listHealthyPixels, open ? {} : "skip");
  const pages = useQuery(api.metaAssets.listHealthyPages, open ? {} : "skip");
  const instagramAccounts = useQuery(api.metaAssets.listHealthyInstagramAccounts, open ? {} : "skip");

  const [step, setStep] = useState<LaunchDialogStep>("config");
  const [isLaunching, setIsLaunching] = useState(false);

  // Ad config state
  const [adAccountMetaId, setAdAccountMetaId] = useState("");
  const [pixelMetaId, setPixelMetaId] = useState("");
  const [pageMetaId, setPageMetaId] = useState("");
  const [instagramAccountMetaId, setInstagramAccountMetaId] = useState("");
  const [objective, setObjective] = useState("OUTCOME_TRAFFIC");
  const [cboEnabled, setCboEnabled] = useState(false);
  const [cboBudget, setCboBudget] = useState("");
  const [optimizationGoal, setOptimizationGoal] = useState("LINK_CLICKS");
  const [bidStrategy, setBidStrategy] = useState("LOWEST_COST_WITHOUT_CAP");
  const [bidAmount, setBidAmount] = useState("");
  const [conversionEvent, setConversionEvent] = useState("DONATE");
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["US"]);
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("65");
  const [cta, setCta] = useState("DONATE_NOW");

  // Budget state
  const [presetBudget, setPresetBudget] = useState("");
  const [launchBudgets, setLaunchBudgets] = useState<Record<string, string>>({});

  // Schedule state — datetime-local string, empty means "start now"
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({
    assets: true,
    campaign: true,
    adSet: true,
    schedule: false,
    targeting: false,
    creative: false,
  });

  // Pre-fill from saved launch config when relaunching (takes priority over defaults)
  useEffect(() => {
    if (!savedConfig) return;
    setAdAccountMetaId(savedConfig.adAccountMetaId);
    if (savedConfig.pixelMetaId) setPixelMetaId(savedConfig.pixelMetaId);
    if (savedConfig.pageMetaId) setPageMetaId(savedConfig.pageMetaId);
    if (savedConfig.instagramAccountMetaId) setInstagramAccountMetaId(savedConfig.instagramAccountMetaId);
    setObjective(savedConfig.objective);
    setCboEnabled(savedConfig.cboEnabled);
    if (savedConfig.cboBudgetCents) setCboBudget(String(savedConfig.cboBudgetCents / 100));
    setOptimizationGoal(savedConfig.optimizationGoal);
    setBidStrategy(savedConfig.bidStrategy);
    if (savedConfig.bidAmountCents) setBidAmount(String(savedConfig.bidAmountCents / 100));
    if (savedConfig.conversionEvent) setConversionEvent(savedConfig.conversionEvent);
    setSelectedCountries(savedConfig.targetingCountries);
    setAgeMin(String(savedConfig.targetingAgeMin));
    setAgeMax(String(savedConfig.targetingAgeMax));
    setCta(savedConfig.cta);
  }, [savedConfig]);

  // Pre-fill from ad defaults when they load (only if no saved config).
  // The `if (!adDefaults || savedConfig) return` early-return makes re-firing
  // when savedConfig changes idempotent — the second-firing always exits.
  useEffect(() => {
    if (!adDefaults || savedConfig) return;
    setObjective(adDefaults.objective ?? "OUTCOME_TRAFFIC");
    setOptimizationGoal("LINK_CLICKS");
    setBidStrategy("LOWEST_COST_WITHOUT_CAP");
    setConversionEvent(adDefaults.conversionEvent ?? "DONATE");
    setSelectedCountries(adDefaults.targetingCountries ?? ["US"]);
    setAgeMin(String(adDefaults.targetingAgeMin ?? 18));
    setAgeMax(String(adDefaults.targetingAgeMax ?? 65));
    setCta(adDefaults.cta ?? "DONATE_NOW");
  }, [adDefaults, savedConfig]);

  // Keep the optimization goal compatible with the selected objective.
  // Meta rejects invalid objective/goal pairs at launch, so if the current
  // goal isn't allowed for the objective, snap to the first valid one.
  useEffect(() => {
    const allowed = GOALS_BY_OBJECTIVE[objective] ?? OPTIMIZATION_GOALS.map((g) => g.value);
    if (!allowed.includes(optimizationGoal)) {
      setOptimizationGoal(allowed[0]);
    }
  }, [objective, optimizationGoal]);

  // Auto-select first healthy ad account, pixel, page (only if no saved config)
  useEffect(() => {
    if (adAccounts && adAccounts.length > 0 && !adAccountMetaId && !savedConfig) {
      const healthy = adAccounts.find((a) => a.healthy);
      if (healthy) setAdAccountMetaId(healthy.metaId);
    }
  }, [adAccounts, adAccountMetaId, savedConfig]);

  useEffect(() => {
    if (pixels && pixels.length > 0 && !pixelMetaId && !savedConfig) {
      const healthy = pixels.find((p) => p.healthy);
      if (healthy) setPixelMetaId(healthy.metaId);
    }
  }, [pixels, pixelMetaId, savedConfig]);

  useEffect(() => {
    if (pages && pages.length > 0 && !pageMetaId && !savedConfig) {
      const healthy = pages.find((p) => p.healthy);
      if (healthy) setPageMetaId(healthy.metaId);
    }
  }, [pages, pageMetaId, savedConfig]);

  useEffect(() => {
    if (instagramAccounts && instagramAccounts.length > 0 && !instagramAccountMetaId && !savedConfig) {
      const healthy = instagramAccounts.find((ig) => ig.healthy);
      if (healthy) setInstagramAccountMetaId(healthy.metaId);
    }
  }, [instagramAccounts, instagramAccountMetaId, savedConfig]);

  function resetAndClose() {
    setStep("config");
    setIsLaunching(false);
    setPresetBudget("");
    setLaunchBudgets({});
    setAdAccountMetaId("");
    setPixelMetaId("");
    setPageMetaId("");
    setInstagramAccountMetaId("");
    setScheduleEnabled(false);
    setScheduledAt("");
    setBidAmount("");
    onOpenChange(false);
  }

  function toggleSection(key: keyof typeof expandedSections) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleCountry(code: string) {
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function applyPresetBudget() {
    if (!presetBudget || Number(presetBudget) <= 0) return;
    const updated: Record<string, string> = {};
    for (const c of selectedCampaigns) {
      updated[c._id as string] = presetBudget;
    }
    setLaunchBudgets(updated);
  }

  const scheduledStartIso =
    scheduleEnabled && scheduledAt ? new Date(scheduledAt).toISOString() : undefined;
  const scheduleIsFuture =
    !scheduleEnabled || (!!scheduledStartIso && new Date(scheduledStartIso).getTime() > Date.now());

  // Conversion goals need a pixel (the server attaches a conversion
  // promoted_object); capped/ROAS bid strategies need a bid amount. Mirror the
  // backend rules so we never assemble an ad set Meta will reject.
  const isConversionGoal = CONVERSION_OPTIMIZATION_GOALS.has(optimizationGoal);
  const requiresBidAmount = BID_STRATEGIES_REQUIRING_AMOUNT.has(bidStrategy);
  const availableGoals = OPTIMIZATION_GOALS.filter((g) =>
    (GOALS_BY_OBJECTIVE[objective] ?? OPTIMIZATION_GOALS.map((x) => x.value)).includes(g.value),
  );
  const cboBudgetValid = !cboEnabled || (!!cboBudget && Number(cboBudget) > 0);
  const bidAmountValid = !requiresBidAmount || (!!bidAmount && Number(bidAmount) > 0);
  const conversionPixelValid = !isConversionGoal || !!pixelMetaId;

  const canProceedToNext =
    adAccountMetaId !== "" &&
    selectedCountries.length > 0 &&
    scheduleIsFuture &&
    cboBudgetValid &&
    bidAmountValid &&
    conversionPixelValid;

  async function handleLaunch() {
    setIsLaunching(true);
    try {
      const budgets: Record<string, number> = {};
      for (const c of selectedCampaigns) {
        const val = launchBudgets[c._id as string];
        if (val && Number(val) > 0) {
          budgets[c._id as string] = Math.round(Number(val) * 100);
        }
      }

      await onLaunch(
        {
          adAccountMetaId,
          pixelMetaId: pixelMetaId || undefined,
          pageMetaId: pageMetaId || undefined,
          instagramAccountMetaId: instagramAccountMetaId || "none",
          objective,
          cboEnabled,
          cboBudgetCents: cboEnabled && cboBudget ? Math.round(Number(cboBudget) * 100) : undefined,
          optimizationGoal,
          bidStrategy,
          bidAmountCents:
            requiresBidAmount && bidAmount ? Math.round(Number(bidAmount) * 100) : undefined,
          conversionEvent: isConversionGoal && pixelMetaId ? conversionEvent : undefined,
          targetingCountries: selectedCountries,
          targetingAgeMin: Number(ageMin),
          targetingAgeMax: Number(ageMax),
          cta,
          scheduledStartTime: scheduledStartIso,
        },
        budgets,
      );
      resetAndClose();
    } catch {
      // Error handled by parent
    } finally {
      setIsLaunching(false);
    }
  }

  const isLoading = !adAccounts || !pixels || !pages || !instagramAccounts;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        {step === "config" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                {isRelaunch ? "Relaunch" : "Launch"} {selectedCampaigns.length} Campaign
                {selectedCampaigns.length !== 1 ? "s" : ""} on Meta
              </DialogTitle>
              <DialogDescription>
                Configure your ad settings below. These settings will apply to all selected campaigns.
              </DialogDescription>
            </DialogHeader>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
                {/* ── Assets Section ── */}
                <ConfigSection
                  title="Assets"
                  icon={<Layers className="w-4 h-4" />}
                  expanded={expandedSections.assets}
                  onToggle={() => toggleSection("assets")}
                >
                  <div className="grid grid-cols-1 gap-3">
                    {/* Ad Account */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Ad Account <span className="text-red-500">*</span>
                      </Label>
                      <Select value={adAccountMetaId} onValueChange={setAdAccountMetaId}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select ad account" />
                        </SelectTrigger>
                        <SelectContent>
                          {(adAccounts ?? []).map((a) => (
                            <SelectItem key={a.metaId} value={a.metaId}>
                              <span className="flex items-center gap-2">
                                {a.name}
                                <Badge className={cn(
                                  "text-[9px] px-1 py-0",
                                  a.healthy
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800",
                                )}>
                                  {a.healthStatus}
                                </Badge>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Pixel */}
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Pixel
                        </Label>
                        <Select value={pixelMetaId || "none"} onValueChange={(v) => setPixelMetaId(v === "none" ? "" : v)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="No pixel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No pixel</SelectItem>
                            {(pixels ?? []).map((p) => (
                              <SelectItem key={p.metaId} value={p.metaId}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Page */}
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Facebook Page
                        </Label>
                        <Select value={pageMetaId || "none"} onValueChange={(v) => setPageMetaId(v === "none" ? "" : v)}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="No page" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No page</SelectItem>
                            {(pages ?? []).map((p) => (
                              <SelectItem key={p.metaId} value={p.metaId}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Instagram Account */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Instagram Account
                      </Label>
                      <Select value={instagramAccountMetaId || "none"} onValueChange={(v) => setInstagramAccountMetaId(v === "none" ? "" : v)}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="No Instagram account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Instagram account</SelectItem>
                          {(instagramAccounts ?? []).map((ig) => (
                            <SelectItem key={ig.metaId} value={ig.metaId}>
                              {ig.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </ConfigSection>

                {/* ── Campaign Settings ── */}
                <ConfigSection
                  title="Campaign Settings"
                  icon={<Target className="w-4 h-4" />}
                  expanded={expandedSections.campaign}
                  onToggle={() => toggleSection("campaign")}
                >
                  <div className="space-y-3">
                    {/* Objective */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Objective
                      </Label>
                      <Select value={objective} onValueChange={setObjective}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OBJECTIVES.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* CBO Toggle */}
                    <div className="rounded-lg border border-border p-3">
                      <button
                        type="button"
                        onClick={() => setCboEnabled((prev) => !prev)}
                        className="flex items-center gap-3 w-full text-left cursor-pointer"
                      >
                        <div
                          className={cn(
                            "w-10 h-5 rounded-full relative transition-colors",
                            cboEnabled ? "bg-blue-600" : "bg-muted-foreground/30",
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                              cboEnabled ? "translate-x-5" : "translate-x-0.5",
                            )}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Campaign Budget Optimization (CBO)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {cboEnabled
                              ? "Budget set at campaign level, Meta distributes across ad sets"
                              : "Ad Set Budget (ABO) — budget set per ad set"}
                          </p>
                        </div>
                      </button>

                      {cboEnabled && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Campaign Daily Budget
                          </Label>
                          <div className="relative w-40">
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                              type="number"
                              min="1"
                              step="0.01"
                              value={cboBudget}
                              onChange={(e) => setCboBudget(e.target.value)}
                              placeholder="e.g. 50.00"
                              className="pl-7 h-9 text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bid Strategy */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Bid Strategy
                      </Label>
                      <Select value={bidStrategy} onValueChange={setBidStrategy}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BID_STRATEGIES.map((b) => (
                            <SelectItem key={b.value} value={b.value}>
                              {b.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {requiresBidAmount && (
                        <div className="mt-2">
                          <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                            {bidStrategy === "COST_CAP" ? "Cost per result goal" : "Bid cap"}{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative w-40">
                            <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              placeholder="e.g. 5.00"
                              className="pl-7 h-9 text-sm"
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {bidStrategy === "COST_CAP"
                              ? "Average cost per result Meta will aim for."
                              : "Maximum Meta will bid in any single auction."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </ConfigSection>

                {/* ── Ad Set Settings ── */}
                <ConfigSection
                  title="Ad Set Settings"
                  icon={<MousePointerClick className="w-4 h-4" />}
                  expanded={expandedSections.adSet}
                  onToggle={() => toggleSection("adSet")}
                >
                  <div className="space-y-3">
                    {/* Optimization Goal */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Optimization Goal
                      </Label>
                      <Select value={optimizationGoal} onValueChange={setOptimizationGoal}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableGoals.map((g) => (
                            <SelectItem key={g.value} value={g.value}>
                              {g.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Conversion Event — only relevant for conversion optimization
                        goals (Conversions / Value), which require a pixel server-side. */}
                    {isConversionGoal && (
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Conversion Event (Pixel) <span className="text-red-500">*</span>
                        </Label>
                        {pixelMetaId ? (
                          <Select value={conversionEvent} onValueChange={setConversionEvent}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CONVERSION_EVENTS.map((e) => (
                                <SelectItem key={e.value} value={e.value}>
                                  {e.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-[11px] text-red-600">
                            This optimization goal requires a pixel. Select one under Assets, or
                            pick a non-conversion goal.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </ConfigSection>

                {/* ── Schedule ── */}
                <ConfigSection
                  title="Schedule"
                  icon={<CalendarClock className="w-4 h-4" />}
                  expanded={expandedSections.schedule}
                  onToggle={() => toggleSection("schedule")}
                  summary={
                    !expandedSections.schedule
                      ? scheduleEnabled && scheduledAt
                        ? `Starts ${new Date(scheduledAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}`
                        : "Start immediately"
                      : undefined
                  }
                >
                  <div className="space-y-3">
                    <div className="rounded-lg border border-border p-3">
                      <button
                        type="button"
                        onClick={() => setScheduleEnabled((prev) => !prev)}
                        className="flex items-center gap-3 w-full text-left cursor-pointer"
                      >
                        <div
                          className={cn(
                            "w-10 h-5 rounded-full relative transition-colors shrink-0",
                            scheduleEnabled ? "bg-blue-600" : "bg-muted-foreground/30",
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                              scheduleEnabled ? "translate-x-5" : "translate-x-0.5",
                            )}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Schedule for later
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {scheduleEnabled
                              ? "Ad will be created now but Meta will hold delivery until the chosen time"
                              : "Start delivering immediately after launch"}
                          </p>
                        </div>
                      </button>

                      {scheduleEnabled && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Start date &amp; time (your local time zone)
                          </Label>
                          <Input
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            min={new Date(Date.now() + 5 * 60_000)
                              .toISOString()
                              .slice(0, 16)}
                            className="h-9 text-sm"
                          />
                          {scheduledAt && !scheduleIsFuture && (
                            <p className="text-[11px] text-red-600 mt-1">
                              Start time must be in the future.
                            </p>
                          )}
                          {scheduledAt && scheduleIsFuture && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Will start delivering at{" "}
                              {new Date(scheduledAt).toLocaleString([], {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </ConfigSection>

                {/* ── Targeting ── */}
                <ConfigSection
                  title="Targeting"
                  icon={<Users className="w-4 h-4" />}
                  expanded={expandedSections.targeting}
                  onToggle={() => toggleSection("targeting")}
                  summary={!expandedSections.targeting ? `${selectedCountries.join(", ")} | ${ageMin}-${ageMax}` : undefined}
                >
                  <div className="space-y-3">
                    {/* Countries */}
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        <Globe className="w-3 h-3 inline mr-1" />
                        Countries <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {COUNTRY_OPTIONS.map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => toggleCountry(c.value)}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border",
                              selectedCountries.includes(c.value)
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-muted text-muted-foreground border-border hover:bg-accent",
                            )}
                          >
                            {c.value}
                          </button>
                        ))}
                      </div>
                      {selectedCountries.length > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {selectedCountries.map((code) => COUNTRY_OPTIONS.find((c) => c.value === code)?.label ?? code).join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Age Range */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Age Min
                        </Label>
                        <Input
                          type="number"
                          min="13"
                          max="65"
                          value={ageMin}
                          onChange={(e) => setAgeMin(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Age Max
                        </Label>
                        <Input
                          type="number"
                          min="13"
                          max="65"
                          value={ageMax}
                          onChange={(e) => setAgeMax(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </ConfigSection>

                {/* ── Creative ── */}
                <ConfigSection
                  title="Creative"
                  icon={<Eye className="w-4 h-4" />}
                  expanded={expandedSections.creative}
                  onToggle={() => toggleSection("creative")}
                  summary={!expandedSections.creative ? CTA_OPTIONS.find((c) => c.value === cta)?.label : undefined}
                >
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                      Call to Action
                    </Label>
                    <Select value={cta} onValueChange={setCta}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CTA_OPTIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      UTM tracking is automatically appended to all campaign URLs.
                    </p>
                  </div>
                </ConfigSection>
              </div>
            )}

            <DialogFooter className="flex items-center gap-2 pt-2 border-t border-border">
              <Button variant="ghost" onClick={resetAndClose} className="cursor-pointer">
                Cancel
              </Button>
              <Button
                onClick={() => setStep("budgets")}
                disabled={!canProceedToNext || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                Next: Set Budgets
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {isRelaunch ? "Relaunch" : "Launch"} — Set Budgets
              </DialogTitle>
              <DialogDescription>
                {cboEnabled
                  ? "CBO is on — Meta manages budget distribution. You can still set per-campaign ad set budgets as a reference."
                  : "Set a daily ad budget for each campaign (ABO mode — budget per ad set)."}
              </DialogDescription>
            </DialogHeader>

            {/* Config summary */}
            <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 space-y-1">
              <div className="flex items-center gap-4 flex-wrap text-xs">
                <span className="text-muted-foreground">
                  Account: <span className="font-medium text-foreground">
                    {adAccounts?.find((a) => a.metaId === adAccountMetaId)?.name ?? adAccountMetaId}
                  </span>
                </span>
                {pixelMetaId && (
                  <span className="text-muted-foreground">
                    Pixel: <span className="font-medium text-foreground">
                      {pixels?.find((p) => p.metaId === pixelMetaId)?.name ?? pixelMetaId}
                    </span>
                  </span>
                )}
                <span className="text-muted-foreground">
                  Mode: <span className="font-medium text-foreground">{cboEnabled ? "CBO" : "ABO"}</span>
                </span>
              </div>
              <button
                onClick={() => setStep("config")}
                className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Edit config
              </button>
            </div>

            {/* Preset budget */}
            {!cboEnabled && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-3">
                <Label className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-1.5 block">
                  Preset budget (applies to all)
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-600" />
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      value={presetBudget}
                      onChange={(e) => setPresetBudget(e.target.value)}
                      placeholder="e.g. 20.00"
                      className="pl-7 h-9 text-sm bg-background border-blue-200 text-foreground"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={applyPresetBudget}
                    disabled={!presetBudget || Number(presetBudget) <= 0}
                    className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer h-9 px-4"
                  >
                    Apply to All
                  </Button>
                </div>
              </div>
            )}

            {/* Per-campaign budgets */}
            <div className="flex-1 overflow-y-auto space-y-2 py-1 max-h-64">
              {selectedCampaigns.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted px-3 py-2.5"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      By {c.creatorName ?? "Unknown"}
                      {(c.status === "draft" || c.status === "pending_launch") && (
                        <span className="ml-1.5 text-amber-700">(will be published)</span>
                      )}
                    </p>
                  </div>
                  {!cboEnabled && (
                    <div className="shrink-0">
                      <Label className="text-[10px] text-muted-foreground mb-0.5 block">
                        Daily budget
                      </Label>
                      <div className="relative w-28">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <Input
                          type="number"
                          min="1"
                          step="0.01"
                          value={launchBudgets[c._id as string] ?? ""}
                          onChange={(e) =>
                            setLaunchBudgets((prev) => ({
                              ...prev,
                              [c._id as string]: e.target.value,
                            }))
                          }
                          placeholder="default"
                          className="pl-6 h-8 text-xs bg-background border-border text-foreground"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter className="flex items-center gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setStep("config")}
                disabled={isLaunching}
                className="cursor-pointer"
              >
                Back
              </Button>
              <Button
                variant="ghost"
                onClick={resetAndClose}
                disabled={isLaunching}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLaunch}
                disabled={isLaunching}
                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {isLaunching ? (
                  <>
                    <Spinner className="mr-2" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    {isRelaunch ? "Relaunch" : "Launch"} on Meta
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Config Section Accordion ───────────────────────────────────

function ConfigSection({
  title,
  icon,
  expanded,
  onToggle,
  summary,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  summary?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left cursor-pointer hover:bg-accent/50 transition-colors rounded-lg"
      >
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-semibold text-foreground flex-1">{title}</span>
        {summary && !expanded && (
          <span className="text-xs text-muted-foreground mr-2 truncate max-w-[200px]">{summary}</span>
        )}
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {expanded && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
