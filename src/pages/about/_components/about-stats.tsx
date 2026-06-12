import { motion, useInView } from "motion/react";
import { useRef, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";

type StatItem = {
  label: string;
  numericValue: number;
  prefix: string;
  suffix: string;
  display: (n: number) => string;
};

function useCountUp(target: number, duration: number, shouldAnimate: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!shouldAnimate) return;
    let current = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        // Keep fractional precision so small targets like 2.5 (millions)
        // don't get floored to 0 for the whole animation. The display
        // formatter on the consumer side decides how many digits to show.
        setCount(current);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, shouldAnimate]);
  return count;
}

function StatItem({
  stat,
  index,
  isInView,
}: {
  stat: StatItem;
  index: number;
  isInView: boolean;
}) {
  const count = useCountUp(stat.numericValue, 2000, isInView);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      className="text-center"
    >
      <p className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-[#121212] mb-1.5 tracking-tight">
        {stat.prefix}
        {stat.display(count)}
        <span className="text-[#2d6b5e]">{stat.suffix}</span>
      </p>
      <p className="text-[11px] sm:text-xs text-[#737373] uppercase tracking-[0.12em] font-semibold">
        {stat.label}
      </p>
    </motion.div>
  );
}

export default function AboutStats() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const stats = useQuery(api.publicCampaigns.getPublicStats);

  const STATS: StatItem[] = [
    {
      label: "Families Helped",
      numericValue: 10000,
      prefix: "",
      suffix: "+",
      display: (n) => Math.round(n).toLocaleString(),
    },
    {
      label: "Donations Raised",
      numericValue: (stats?.totalRaised ?? 2500000) / 1000000,
      prefix: "$",
      suffix: "M+",
      display: (n) => n.toFixed(1),
    },
    {
      label: "Active Campaigns",
      numericValue: stats?.activeCampaigns ?? 150,
      prefix: "",
      suffix: "+",
      display: (n) => Math.round(n).toLocaleString(),
    },
    {
      label: "Donor Satisfaction",
      numericValue: 98,
      prefix: "",
      suffix: "%",
      display: (n) => Math.round(n).toString(),
    },
  ];

  return (
    <section ref={ref} className="py-16 sm:py-20 bg-white border-t border-[#F0F0F0]">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {STATS.map((stat, i) => (
            <StatItem key={stat.label} stat={stat} index={i} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
}
