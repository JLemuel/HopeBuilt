import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Mail, ArrowRight, BookOpen, Heart, ShieldCheck } from "lucide-react";
import SiteHeader from "@/components/site-header.tsx";
import SeoHead from "@/components/seo-head.tsx";
import Footer from "@/components/footer.tsx";

const TOPICS = [
  {
    icon: Heart,
    title: "Donating",
    description: "How donations work, receipts, recurring giving.",
    anchor: "#faqs-donating",
  },
  {
    icon: BookOpen,
    title: "Fundraising",
    description: "Starting a campaign, payouts, content guidelines.",
    anchor: "#faqs-fundraising",
  },
  {
    icon: ShieldCheck,
    title: "Trust & safety",
    description: "Reporting issues, verification, refunds.",
    anchor: "#faqs-trust",
  },
];

const FAQ_GROUPS: Array<{
  id: string;
  title: string;
  items: Array<{ q: string; a: React.ReactNode }>;
}> = [
  {
    id: "faqs-donating",
    title: "Donating",
    items: [
      {
        q: "How do I get a donation receipt?",
        a: (
          <>
            A receipt is emailed automatically as soon as your payment clears.
            You can also download a PDF copy from your{" "}
            <Link to="/dashboard">donor dashboard</Link>.
          </>
        ),
      },
      {
        q: "Can I make a recurring donation?",
        a: "Yes — most campaigns offer monthly recurring giving on the donate page. You can cancel anytime from your dashboard.",
      },
      {
        q: "What payment methods do you accept?",
        a: "Credit and debit cards via Stripe (Visa, Mastercard, Amex, Discover), plus Apple Pay and Google Pay on supported devices.",
      },
      {
        q: "Is my donation tax-deductible?",
        a: "Tax-deductibility depends on the fundraiser. Campaigns run by registered charities will be marked as such; personal campaigns are not deductible. Check with your tax advisor.",
      },
    ],
  },
  {
    id: "faqs-fundraising",
    title: "Fundraising",
    items: [
      {
        q: "How do I start a campaign?",
        a: (
          <>
            Open the <Link to="/start-campaign">start-a-campaign wizard</Link>{" "}
            and follow the three steps. Most campaigns are reviewed and live
            within 24 hours.
          </>
        ),
      },
      {
        q: "How and when do payouts happen?",
        a: "Funds are released to the connected Stripe account on a rolling schedule once your account is verified. New accounts typically have a 7-day hold on the first payout.",
      },
      {
        q: "What fees does HopeBuilt charge?",
        a: "We charge a platform fee plus standard Stripe processing fees, disclosed before each donation is completed.",
      },
      {
        q: "Where can I learn fundraising best practices?",
        a: (
          <>
            Our <Link to="/campaign-guide">Campaign Guide</Link> walks through
            storytelling, media, sharing, and reaching your goal.
          </>
        ),
      },
    ],
  },
  {
    id: "faqs-trust",
    title: "Trust & safety",
    items: [
      {
        q: "How do I report a fraudulent campaign?",
        a: (
          <>
            Use the <Link to="/report-issue">report an issue</Link> page or the
            &quot;Report&quot; button on the campaign itself. Our trust team
            reviews every report within 48 hours.
          </>
        ),
      },
      {
        q: "How do you verify fundraisers?",
        a: "All payout accounts are verified by Stripe (identity + bank). Larger campaigns receive additional manual review by our team.",
      },
      {
        q: "Can I get a refund?",
        a: (
          <>
            Yes, in many cases. See our{" "}
            <Link to="/refund-policy">refund policy</Link> for eligibility and
            how to request.
          </>
        ),
      },
    ],
  },
];

export default function HelpPage() {
  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SeoHead
        title="Help Center — FAQs and support"
        description="Answers to common questions about donating, fundraising, and using HopeBuilt."
        canonicalPath="/help"
      />
      <SiteHeader variant="solid-dark" />

      <section className="bg-[#3d8d7a] text-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 py-12 sm:py-16">
          <span className="inline-block text-[#fff597] text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
            Help Center
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-3">
            How can we help?
          </h1>
          <p className="text-white/75 text-sm sm:text-base leading-relaxed max-w-2xl">
            Answers to the most common questions about donating, fundraising,
            and using HopeBuilt. Can&apos;t find what you need?{" "}
            <Link to="/contact" className="underline hover:text-white">
              Contact us
            </Link>
            .
          </p>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 sm:mb-16">
            {TOPICS.map((t) => (
              <a
                key={t.title}
                href={t.anchor}
                className="group border border-black/10 rounded-xl p-5 hover:border-[#2d6b5e]/40 hover:bg-[#3d8d7a]/[0.03] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#3d8d7a]/10 flex items-center justify-center text-[#2d6b5e] mb-3">
                  <t.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-[#121212] mb-1">
                  {t.title}
                </h3>
                <p className="text-[13px] text-black/55 leading-relaxed">
                  {t.description}
                </p>
              </a>
            ))}
          </div>

          <div id="faqs" className="space-y-12">
            {FAQ_GROUPS.map((group) => (
              <div key={group.id} id={group.id}>
                <h2 className="text-xl sm:text-2xl font-bold text-[#121212] mb-4">
                  {group.title}
                </h2>
                <div className="border border-black/10 rounded-xl divide-y divide-black/10">
                  {group.items.map((item, i) => (
                    <details key={i} className="group">
                      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
                        <span className="text-[15px] font-medium text-[#121212] pr-4">
                          {item.q}
                        </span>
                        <ChevronDown className="w-4 h-4 text-black/40 shrink-0 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="px-5 pb-5 text-[14px] text-[#4B5563] leading-relaxed">
                        {item.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 border border-black/10 rounded-xl p-6 sm:p-8 bg-[#3d8d7a]/[0.04] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#3d8d7a] text-white flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#121212] mb-1">
                  Still need a human?
                </h3>
                <p className="text-[13px] text-black/55 leading-relaxed">
                  Our team responds to most messages within one business day.
                </p>
              </div>
            </div>
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors whitespace-nowrap"
            >
              Contact support
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
