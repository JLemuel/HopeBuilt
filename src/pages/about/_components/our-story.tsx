import { motion, useInView } from "motion/react";
import { useRef } from "react";

export default function OurStory() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 sm:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-12 lg:gap-20 items-start">
          {/* Left: label */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-[#121212] tracking-tight">
              Our Story
            </h2>
          </motion.div>

          {/* Right: text */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="space-y-4"
          >
            <p className="text-[15px] text-[#4B5563] leading-relaxed">
              Hope Built started with a question: Why is it so hard for small organizations
              to fundraise effectively? In 2023, our founders watched grassroots nonprofits
              struggle with outdated tools, opaque platforms, and high fees — while the
              communities they served waited.
            </p>
            <p className="text-[15px] text-[#4B5563] leading-relaxed">
              So we built something different. A platform where every dollar is trackable,
              every campaign has a voice, and every donor can see exactly how their
              generosity translates into real-world change. Today, Hope Built powers 150+
              active campaigns across three continents.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
