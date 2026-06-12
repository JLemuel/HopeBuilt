import { useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Lightbulb,
  FileText,
  Image,
  Share2,
  Target,
  CheckCircle2,
  ChevronDown,
  BookOpen,
  Heart,
  TrendingUp,
  Users,
} from "lucide-react";
import Footer from "@/components/footer.tsx";
import SiteHeader from "@/components/site-header.tsx";
import SeoHead from "@/components/seo-head.tsx";

// ─── Hero ──────────────────────────────────────────────────────────────────

const HERO_BG =
  "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1920";

function GuideHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.7], [0.6, 0.85]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[420px] sm:h-[500px] overflow-hidden bg-[#3d8d7a]"
    >
      <motion.div
        style={{ y: imageY }}
        className="absolute inset-0 w-full h-[120%] top-[-10%]"
      >
        <img
          src={HERO_BG}
          alt="People collaborating around a table"
          className="w-full h-full object-cover"
        />
      </motion.div>

      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/75 pointer-events-none"
      />

      <div className="relative z-20 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 w-full pb-10">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <span className="inline-block text-[#2d6b5e] text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
              Campaign Guide
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight text-balance mb-4">
              Everything You Need to
              <br />
              Run a Successful Campaign
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.2, ease: "easeOut" }}
              className="text-white/60 text-sm sm:text-base leading-relaxed max-w-lg mb-6"
            >
              From crafting your story to reaching your goal — follow these
              steps to create a campaign that moves people to action.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <Link
                to="/campaigns"
                className="inline-flex items-center gap-2 bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white font-semibold text-sm px-6 py-3 rounded-full transition-colors cursor-pointer"
              >
                Browse Campaigns
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Steps ─────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    icon: Lightbulb,
    title: "Define Your Cause",
    description:
      "A clear, focused cause resonates far more than a vague one. Think about the specific problem you're solving, who benefits, and why it matters right now.",
    tips: [
      "Choose one specific, tangible problem to solve",
      "Explain why you — and your community — are best placed to fix it",
      "Make the impact measurable: e.g. 'build 2 classrooms for 80 children'",
      "Connect emotionally: share a personal story or a real person affected",
    ],
    color: "#3d8d7a",
  },
  {
    number: "02",
    icon: Target,
    title: "Set a Realistic Goal",
    description:
      "Your fundraising goal should be specific, achievable, and clearly justified. Donors are more likely to contribute when they understand exactly how their money is used.",
    tips: [
      "Break down exactly how the funds will be spent",
      "Include a small buffer (10–15%) for unexpected costs",
      "Start with a modest goal — you can always extend it",
      "Research similar campaigns to benchmark your target",
    ],
    color: "#3d8d7a",
  },
  {
    number: "03",
    icon: FileText,
    title: "Write a Compelling Story",
    description:
      "Your campaign description is your pitch. Use clear, heartfelt language. Structure it with a hook, the problem, your solution, and a call to action.",
    tips: [
      "Open with a powerful one-sentence hook",
      "Describe the problem vividly — make donors feel it",
      "Present your plan step by step with clarity",
      "Close with a specific ask: 'Donate $25 to feed a family for a week'",
    ],
    color: "#3d8d7a",
  },
  {
    number: "04",
    icon: Image,
    title: "Add Powerful Visuals",
    description:
      "Campaigns with strong images or videos raise significantly more. Show the people, places, or projects you're helping — authenticity beats polish every time.",
    tips: [
      "Use real photos whenever possible — avoid generic stock images",
      "A short video (60–90 sec) explaining your cause dramatically boosts trust",
      "Show before/after or current state of the problem",
      "Ensure images are high-resolution and well-lit",
    ],
    color: "#3d8d7a",
  },
  {
    number: "05",
    icon: Share2,
    title: "Share & Spread the Word",
    description:
      "Even the best campaign needs promotion. Share through every channel available — your personal network is the fastest way to get initial momentum.",
    tips: [
      "Share personally with a heartfelt message — not just a link",
      "Post updates regularly to keep donors engaged",
      "Ask your first donors to share with their networks",
      "Use social media, WhatsApp, email, and community groups",
    ],
    color: "#3d8d7a",
  },
  {
    number: "06",
    icon: TrendingUp,
    title: "Track Progress & Update Donors",
    description:
      "Transparency builds trust. Keep your donors informed with regular updates on how funds are being used and the impact they're creating.",
    tips: [
      "Post a milestone update for every 25% of your goal reached",
      "Share photos or proof of impact as it happens",
      "Thank your donors publicly and personally",
      "Be honest if challenges arise — donors respect authenticity",
    ],
    color: "#3d8d7a",
  },
];

function StepCard({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const Icon = step.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: (index % 2) * 0.1 }}
      className="bg-white border border-[#EBEBEB] rounded-2xl p-6 sm:p-8 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#3d8d7a]/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[#2d6b5e]" />
        </div>
        <div>
          <span className="text-[10px] font-bold tracking-[0.18em] text-[#2d6b5e] uppercase">
            Step {step.number}
          </span>
          <h3 className="text-[17px] sm:text-lg font-bold text-[#121212] tracking-tight mt-0.5">
            {step.title}
          </h3>
        </div>
      </div>

      <p className="text-[13px] sm:text-sm text-[#525252] leading-relaxed mb-5">
        {step.description}
      </p>

      <ul className="space-y-2.5">
        {step.tips.map((tip) => (
          <li key={tip} className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#2d6b5e] mt-0.5 shrink-0" />
            <span className="text-[12px] sm:text-[13px] text-[#525252] leading-relaxed">
              {tip}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function StepsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-14 sm:py-20 bg-[#F7F7F5]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <span className="inline-block text-[#2d6b5e] text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
            Step by Step
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#121212] tracking-tight mb-3">
            Your Campaign Roadmap
          </h2>
          <p className="text-[#525252] text-sm sm:text-base max-w-lg mx-auto">
            Six proven steps to take your campaign from idea to funded reality.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {STEPS.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ───────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "How long does it take to get approved?",
    a: "After submitting your campaign, our team reviews it within 1–3 business days. We check for clarity, authenticity, and community guidelines compliance. You'll receive an email when it's approved or if we need more information.",
  },
  {
    q: "Is there a minimum or maximum fundraising goal?",
    a: "There is no minimum goal. We recommend keeping your goal realistic and justified. For very large goals (over $100,000), we may request additional documentation to verify the scope of your campaign.",
  },
  {
    q: "What percentage of donations reaches my cause?",
    a: "HopeBuilt operates with full transparency. A small platform fee covers operational costs, and the remainder goes directly to your cause. Exact breakdowns are shown on every campaign page.",
  },
  {
    q: "Can I edit my campaign after it goes live?",
    a: "Yes — you can update your story, images, and goal (within reason) while your campaign is live. Major changes may trigger a brief re-review. Donors are notified of significant updates.",
  },
  {
    q: "What happens if I don't reach my goal?",
    a: "HopeBuilt uses a flexible funding model by default — you keep whatever is raised. If you prefer all-or-nothing funding (where donors are only charged if the goal is met), contact our support team before launching.",
  },
  {
    q: "How do I withdraw funds?",
    a: "Once your campaign is active, you can request a withdrawal at any time through your Campaign Portal. Funds are typically transferred within 3–5 business days via bank transfer or your preferred method.",
  },
];

function FaqItem({ faq, index }: { faq: (typeof FAQS)[number]; index: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      className="border border-[#EBEBEB] rounded-xl overflow-hidden bg-white"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 text-left cursor-pointer group"
      >
        <span className="text-sm sm:text-[15px] font-semibold text-[#121212] group-hover:text-[#2d6b5e] transition-colors pr-4">
          {faq.q}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-[#525252] shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-5">
          <p className="text-[13px] sm:text-sm text-[#525252] leading-relaxed">
            {faq.a}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function FaqSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-14 sm:py-20 bg-white">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 lg:px-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <span className="inline-block text-[#2d6b5e] text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
            FAQ
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#121212] tracking-tight mb-3">
            Common Questions
          </h2>
          <p className="text-[#525252] text-sm sm:text-base">
            Everything you need to know before launching your campaign.
          </p>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <FaqItem key={faq.q} faq={faq} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats bar ─────────────────────────────────────────────────────────────

const STATS = [
  { icon: Heart, value: "10,000+", label: "Families helped" },
  { icon: BookOpen, value: "500+", label: "Campaigns funded" },
  { icon: Users, value: "50,000+", label: "Donors worldwide" },
  { icon: TrendingUp, value: "$2M+", label: "Total raised" },
];

function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="bg-[#3d8d7a] py-10 sm:py-14">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-9 h-9 rounded-xl bg-[#3d8d7a]/15 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-4.5 h-4.5 text-[#2d6b5e]" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-1">
                  {stat.value}
                </p>
                <p className="text-[11px] sm:text-xs text-white/45 uppercase tracking-[0.12em] font-medium">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── CTA ───────────────────────────────────────────────────────────────────

function GuideCta() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-16 sm:py-20 bg-[#F7F7F5]">
      <div className="max-w-2xl mx-auto px-5 text-center">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-[#2d6b5e] text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
            Ready?
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#121212] tracking-tight text-balance mb-4">
            Start Your Campaign Today
          </h2>
          <p className="text-[#525252] text-sm sm:text-base max-w-md mx-auto mb-8">
            Thousands of people are waiting to support a cause like yours. Your
            campaign could be the one that changes everything.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            <Link
              to="/campaigns"
              className="flex items-center justify-center gap-2 bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white font-semibold px-8 py-3.5 rounded-full transition-colors cursor-pointer text-sm"
            >
              Browse Campaigns
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/about"
              className="flex items-center justify-center gap-2 bg-white border border-[#c4c4c4] hover:border-[#3d8d7a] hover:text-[#2d6b5e] text-[#525252] font-semibold px-8 py-3.5 rounded-full transition-colors cursor-pointer text-sm"
            >
              Learn About Us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function CampaignGuidePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SeoHead
        title="Campaign Guide — Run a successful fundraiser"
        description="From writing your story to reaching your goal: everything you need to run a fundraiser that moves people to action."
        canonicalPath="/campaign-guide"
      />
      <SiteHeader variant="solid-dark" />
      <GuideHero />
      <StatsBar />
      <StepsSection />
      <FaqSection />
      <GuideCta />
      <Footer />
    </div>
  );
}
