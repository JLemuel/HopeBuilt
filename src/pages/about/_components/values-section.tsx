import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Eye, Heart, Shield, TrendingUp } from "lucide-react";

const VALUES = [
  {
    icon: Eye,
    title: "Transparency",
    description:
      "Every dollar is tracked and reported. Donors see exactly where their contributions go, building trust through radical openness.",
  },
  {
    icon: Heart,
    title: "Compassion",
    description:
      "We lead with empathy in everything we build. Our platform is designed to amplify human kindness and make giving feel personal.",
  },
  {
    icon: Shield,
    title: "Reliability",
    description:
      "Our infrastructure ensures 99.9% uptime and secure transactions. Campaigns never miss a donation, and funds are always protected.",
  },
  {
    icon: TrendingUp,
    title: "Impact",
    description:
      "We measure success by lives changed, not just dollars raised. Every feature we build is designed to maximize real-world outcomes.",
  },
] as const;

export default function ValuesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#121212] tracking-tight">
            The Values That Drive Us
          </h2>
        </motion.div>

        {/* Values grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {VALUES.map((value, i) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 28 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.1 * i }}
              className="group bg-[#3d8d7a] hover:bg-[#2d6b5e] rounded-2xl p-7 transition-colors duration-300"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-[#3d8d7a]/15 flex items-center justify-center mb-5 group-hover:bg-[#3d8d7a]/25 transition-colors">
                <value.icon className="w-5 h-5 text-[#2d6b5e]" />
              </div>
              <h3 className="text-base font-bold text-white mb-2 tracking-tight">
                {value.title}
              </h3>
              <p className="text-[13px] text-white/50 leading-relaxed">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
