import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Megaphone, BookOpen, DollarSign, Zap } from "lucide-react";

const STEPS = [
  {
    icon: Megaphone,
    title: "Create a Campaign",
    description: "Set up your cause in minutes. Add your story, set a goal, and launch.",
  },
  {
    icon: BookOpen,
    title: "Share Your Story",
    description: "Spread the word through social media, email, and our community of donors.",
  },
  {
    icon: DollarSign,
    title: "Receive Donations",
    description: "Accept secure payments. Donors see real-time progress and impact updates.",
  },
  {
    icon: Zap,
    title: "Make an Impact",
    description: "Funds go directly to your cause. Track outcomes and share results with donors.",
  },
] as const;

export default function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-[#F7F7F5]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-[#121212] tracking-tight">
            How Hope Built Works
          </h2>
        </motion.div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 28 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.1 * i }}
              className="flex flex-col items-center text-center bg-white rounded-2xl p-8 border border-[#EBEBEB] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-[#E8F5EC] flex items-center justify-center mb-5">
                <step.icon className="w-5 h-5 text-[#2d6b5e]" />
              </div>
              <h3 className="text-[15px] font-bold text-[#121212] mb-2 tracking-tight">
                {step.title}
              </h3>
              <p className="text-[13px] text-[#525252] leading-relaxed max-w-[220px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
