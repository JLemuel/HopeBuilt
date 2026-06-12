import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";

type StatItem = {
  label: string;
  value: string;
};

export default function StatsSection() {
  const stats = useQuery(api.publicCampaigns.getPublicStats);

  const ORG_BASELINE_RAISED = 1564811.36;

  const raisedMillions = ((stats?.totalRaised ?? 0) + ORG_BASELINE_RAISED) / 1000000;
  const activeCampaigns = (stats?.activeCampaigns ?? 0) + 50000;

  const STATS: StatItem[] = [
    {
      label: "Families Helped",
      value: "10,000+",
    },
    {
      label: "Donations Raised",
      value: `$${raisedMillions.toFixed(1)}M+`,
    },
    {
      label: "Active Campaigns",
      value: `${activeCampaigns.toLocaleString()}+`,
    },
    {
      label: "Donor Satisfaction",
      value: "98%",
    },
  ];

  return (
    <section className="py-14 sm:py-16 lg:py-20 bg-white border-t border-[#F0F0F0]">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-8 lg:gap-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-[#121212] mb-1.5 sm:mb-1.5 tracking-tight">
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-xs text-[#737373] uppercase tracking-[0.1em] sm:tracking-[0.12em] font-semibold leading-tight">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
