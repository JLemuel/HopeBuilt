import { motion, useInView } from "motion/react";
import { useRef } from "react";

export default function QuoteBlock() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-16 sm:py-20 bg-[#F7F7F5] border-y border-[#EBEBEB]">
      <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          {/* Accent */}
          <div className="w-10 h-0.5 bg-[#3d8d7a] rounded-full mx-auto mb-8" />

          <blockquote className="text-xl sm:text-2xl lg:text-[1.6rem] font-semibold text-[#121212] leading-snug tracking-tight text-balance mb-6">
            {'"'}We believe the best way to change the world is to make
            generosity effortless — and trust, unbreakable.{'"'}
          </blockquote>

          <p className="text-sm text-[#737373] font-medium">
            — Sarah Chen, Co-Founder
          </p>
        </motion.div>
      </div>
    </section>
  );
}
