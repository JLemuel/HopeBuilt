import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function AboutCta() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 sm:py-28 bg-[#3d8d7a] relative overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#3d8d7a]/6 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 lg:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight text-balance leading-tight">
            Ready to Be Part
            <br />
            of Something Bigger?
          </h2>
          <p className="text-white/50 text-sm sm:text-base max-w-md mx-auto mb-9">
            Whether you{"'"}re starting a campaign or making your first donation,
            every action on Hope Built creates ripples of change.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <a
            href="/start-campaign"
            className="inline-flex items-center gap-2 bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white font-semibold px-8 py-3.5 rounded-full transition-colors cursor-pointer text-sm"
          >
            Start a Campaign
            <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            to="/donate"
            className="inline-flex items-center gap-2 bg-transparent border border-white/20 hover:border-white/50 text-white font-semibold px-8 py-3.5 rounded-full transition-colors cursor-pointer text-sm"
          >
            Donate Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
