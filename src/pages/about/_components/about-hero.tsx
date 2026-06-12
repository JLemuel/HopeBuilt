import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import SiteHeader from "@/components/site-header.tsx";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1758390285798-59b0d7d46371?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NzIwMTN8MHwxfHNlYXJjaHw1fHxjb21tdW5pdHklMjBnYXJkZW4lMjB2b2x1bnRlZXJzJTIwd29ya2luZyUyMHRvZ2V0aGVyJTIwb3V0ZG9vcnxlbnwwfHx8fDE3NzYwMzYzNjh8MA&ixlib=rb-4.1.0&q=80&w=1920";

export default function AboutHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.7], [0.55, 0.82]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[480px] sm:h-[540px] lg:h-[600px] overflow-hidden bg-[#3d8d7a]"
    >
      {/* Parallax image */}
      <motion.div
        style={{ y: imageY }}
        className="absolute inset-0 w-full h-[120%] top-[-10%]"
      >
        <img
          src={HERO_IMAGE}
          alt="Community volunteers working together"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Gradient overlay */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 pointer-events-none"
      />

      <SiteHeader variant="transparent" />

      {/* Hero content */}
      <div className="relative z-20 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 w-full pb-12">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight text-balance mb-4">
              We Don{"'"}t Just Build Campaigns.
              <br />
              We Build Hope.
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2, ease: "easeOut" }}
              className="text-white/65 text-sm sm:text-base leading-relaxed max-w-lg"
            >
              In 2023, Hope Built has helped 10,000+ families across the support
              they need — transparency, dignity, and with dignity.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
