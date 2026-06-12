import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
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
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { Settings2, Save, Loader2, DollarSign, Zap } from "lucide-react";

const OBJECTIVES = [
  { value: "OUTCOME_TRAFFIC", label: "Traffic" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engagement" },
  { value: "OUTCOME_LEADS", label: "Leads" },
  { value: "OUTCOME_SALES", label: "Sales / Conversions" },
  { value: "OUTCOME_AWARENESS", label: "Awareness" },
] as const;

const CTA_OPTIONS = [
  { value: "DONATE_NOW", label: "Donate Now" },
  { value: "LEARN_MORE", label: "Learn More" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "SHOP_NOW", label: "Shop Now" },
  { value: "CONTACT_US", label: "Contact Us" },
  { value: "GET_OFFER", label: "Get Offer" },
] as const;

const CONVERSION_EVENTS = [
  { value: "PURCHASE", label: "Purchase" },
  { value: "LEAD", label: "Lead" },
  { value: "COMPLETE_REGISTRATION", label: "Complete Registration" },
  { value: "ADD_TO_CART", label: "Add to Cart" },
  { value: "DONATE", label: "Donate" },
  { value: "OTHER", label: "Other" },
] as const;

const COMMON_COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
] as const;

export default function AdDefaultsConfig() {
  const defaults = useQuery(api.meta.adDefaults.get);
  const saveDefaults = useMutation(api.meta.adDefaults.save);

  const [dailyBudget, setDailyBudget] = useState("20");
  const [objective, setObjective] = useState("OUTCOME_TRAFFIC");
  const [conversionEvent, setConversionEvent] = useState("DONATE");
  const [cta, setCta] = useState("DONATE_NOW");
  const [countries, setCountries] = useState<string[]>(["US"]);
  const [ageMin, setAgeMin] = useState("18");
  const [ageMax, setAgeMax] = useState("65");
  const [isSaving, setIsSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize from saved defaults
  useEffect(() => {
    if (defaults && !initialized) {
      setDailyBudget(String(defaults.dailyBudgetCents / 100));
      setObjective(defaults.objective);
      setConversionEvent(defaults.conversionEvent ?? "DONATE");
      setCta(defaults.cta);
      setCountries(defaults.targetingCountries);
      setAgeMin(String(defaults.targetingAgeMin));
      setAgeMax(String(defaults.targetingAgeMax));
      setInitialized(true);
    }
  }, [defaults, initialized]);

  const handleSave = async () => {
    const budgetNum = Number(dailyBudget);
    if (isNaN(budgetNum) || budgetNum < 1) {
      toast.error("Minimum daily budget is $1.00");
      return;
    }
    if (countries.length === 0) {
      toast.error("Select at least one target country");
      return;
    }
    const ageMinNum = Number(ageMin);
    const ageMaxNum = Number(ageMax);
    if (ageMinNum < 13 || ageMaxNum > 65 || ageMinNum >= ageMaxNum) {
      toast.error("Invalid age range (13-65, min must be less than max)");
      return;
    }

    setIsSaving(true);
    try {
      await saveDefaults({
        dailyBudgetCents: Math.round(budgetNum * 100),
        objective,
        conversionEvent: conversionEvent || undefined,
        cta,
        targetingCountries: countries,
        targetingAgeMin: ageMinNum,
        targetingAgeMax: ageMaxNum,
      });
      toast.success("Ad defaults saved!");
    } catch (error) {
      if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
      } else {
        toast.error("Failed to save ad defaults");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCountry = (code: string) => {
    setCountries((prev) =>
      prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code],
    );
  };

  const isConfigured = defaults !== null && defaults !== undefined;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1877F2] to-[#0a5ec4] flex items-center justify-center">
          <Settings2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-semibold text-foreground">Auto-Launch Ad Defaults</h2>
          <p className="text-xs text-muted-foreground">
            {isConfigured
              ? "These settings are applied automatically when staff publish a campaign"
              : "Configure these settings to enable auto-launching Facebook Ads on campaign publish"}
          </p>
        </div>
        {isConfigured && (
          <div className="ml-auto flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
            <Zap className="w-3.5 h-3.5" />
            Active
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Daily Budget */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">
            Daily Budget
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              min="1"
              step="1"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              className="pl-8"
              placeholder="20"
            />
          </div>
          <p className="text-xs text-muted-foreground">Per ad set, per day</p>
        </div>

        {/* Objective */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">
            Campaign Objective
          </Label>
          <Select value={objective} onValueChange={setObjective}>
            <SelectTrigger className="cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OBJECTIVES.map((o) => (
                <SelectItem key={o.value} value={o.value} className="cursor-pointer">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* CTA */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">
            Call to Action
          </Label>
          <Select value={cta} onValueChange={setCta}>
            <SelectTrigger className="cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CTA_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value} className="cursor-pointer">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conversion Event */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">
            Conversion Event
          </Label>
          <Select value={conversionEvent} onValueChange={setConversionEvent}>
            <SelectTrigger className="cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONVERSION_EVENTS.map((e) => (
                <SelectItem key={e.value} value={e.value} className="cursor-pointer">
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Requires pixel assigned to staff</p>
        </div>

        {/* Age Range */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-foreground">
            Target Age Range
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="13"
              max="65"
              value={ageMin}
              onChange={(e) => setAgeMin(e.target.value)}
              className="w-20 text-center"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="number"
              min="13"
              max="65"
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value)}
              className="w-20 text-center"
            />
          </div>
        </div>
      </div>

      {/* Target Countries */}
      <div className="mt-5 space-y-2">
        <Label className="text-sm font-medium text-foreground">
          Target Countries
        </Label>
        <div className="flex flex-wrap gap-2">
          {COMMON_COUNTRIES.map((c) => {
            const isSelected = countries.includes(c.code);
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => toggleCountry(c.code)}
                className={`cursor-pointer px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  isSelected
                    ? "bg-[#1877F2] text-white border-[#1877F2]"
                    : "bg-card text-muted-foreground border-border hover:border-[#1877F2] hover:text-[#1877F2]"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white cursor-pointer"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isSaving ? "Saving..." : "Save Defaults"}
        </Button>
      </div>
    </div>
  );
}
