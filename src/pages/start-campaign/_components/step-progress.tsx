import { cn } from "@/lib/utils.ts";

type StepProgressProps = {
  currentStep: number;
  totalSteps: number;
};

export default function StepProgress({ currentStep, totalSteps }: StepProgressProps) {
  return (
    <div className="flex gap-2 w-full">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors duration-300",
            i <= currentStep ? "bg-[#3d8d7a]" : "bg-[#cfcfcf]",
          )}
        />
      ))}
    </div>
  );
}
