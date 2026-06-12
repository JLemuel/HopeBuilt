import { GraduationCap, Stethoscope, LifeBuoy, Users, Baby, Leaf } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import { cn } from "@/lib/utils.ts";
import StepProgress from "./step-progress.tsx";
import type { WizardData, CampaignCategory } from "./types.ts";

const CATEGORIES: { id: CampaignCategory; label: string; icon: typeof GraduationCap }[] = [
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "healthcare", label: "Healthcare", icon: Stethoscope },
  { id: "disaster_relief", label: "Disaster Relief", icon: LifeBuoy },
  { id: "community", label: "Community", icon: Users },
  { id: "children", label: "Children", icon: Baby },
  { id: "environment", label: "Environment", icon: Leaf },
];

type StepBasicsProps = {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  onNext: () => void;
  currentStep: number;
  totalSteps: number;
};

export default function StepBasics({ data, updateData, onNext, currentStep, totalSteps }: StepBasicsProps) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl font-bold text-[#121212] mb-1">Campaign Basics</h2>
      <p className="text-sm text-[#525252] mb-4">
        Step {currentStep + 1} of {totalSteps} — Tell us about your campaign
      </p>
      <StepProgress currentStep={currentStep} totalSteps={totalSteps} />

      <div className="mt-8 space-y-6">
        {/* Campaign Name */}
        <div>
          <label className="text-sm font-medium text-[#525252] mb-2 block">Campaign Name</label>
          <Input
            value={data.name}
            onChange={(e) => updateData({ name: e.target.value })}
            placeholder="e.g. Clean Water for Rural Schools"
            className="bg-white border-[#c4c4c4] text-[#374151] placeholder:text-[#737373] rounded-xl h-11"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-[#525252] mb-3 block">Campaign Category</label>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => {
              const isSelected = data.category === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => updateData({ category: cat.id })}
                  className={cn(
                    "flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all cursor-pointer",
                    isSelected
                      ? "border-[#3d8d7a] bg-[#3d8d7a]/10 text-[#121212]"
                      : "border-[#cfcfcf] bg-white text-[#525252] hover:border-[#737373]",
                  )}
                >
                  <Icon className={cn("w-5 h-5", isSelected ? "text-[#2d6b5e]" : "text-[#737373]")} />
                  <span className="text-xs font-medium text-center px-1">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fundraising Goal */}
        <div>
          <label className="text-sm font-medium text-[#525252] mb-2 block">Fundraising Goal ($)</label>
          <Input
            type="number"
            min="1"
            value={data.goalAmount}
            onChange={(e) => updateData({ goalAmount: e.target.value })}
            placeholder="e.g. 50,000"
            className="bg-white border-[#c4c4c4] text-[#374151] placeholder:text-[#737373] rounded-xl h-11"
          />
        </div>

        {/* Continue */}
        <button
          type="button"
          onClick={onNext}
          className="w-full bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white font-semibold py-3.5 rounded-full transition-colors cursor-pointer text-sm"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
