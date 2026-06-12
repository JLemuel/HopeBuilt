import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, AlertTriangle, MessageSquare, ArrowRight } from "lucide-react";
import SiteHeader from "@/components/site-header.tsx";
import SeoHead from "@/components/seo-head.tsx";
import Footer from "@/components/footer.tsx";

const REPORT_EMAIL = "trust@hopebuilt.org";

const CATEGORIES = [
  {
    icon: ShieldAlert,
    title: "Fraudulent campaign",
    description:
      "The fundraiser appears to be misrepresenting itself, the recipient, or how funds will be used.",
    subject: "Report: suspected fraudulent campaign",
  },
  {
    icon: AlertTriangle,
    title: "Policy violation",
    description:
      "Hate speech, harassment, illegal activity, or other prohibited content.",
    subject: "Report: policy violation",
  },
  {
    icon: MessageSquare,
    title: "Inappropriate behavior",
    description:
      "Harassment or unwanted contact from a fundraiser or another donor.",
    subject: "Report: inappropriate behavior",
  },
];

export default function ReportIssuePage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SeoHead
        title="Report an issue"
        description="Report a fraudulent campaign, policy violation, or inappropriate behavior. Our trust team reviews every report within 48 hours."
        canonicalPath="/report-issue"
      />
      <SiteHeader variant="solid-dark" />

      <section className="bg-[#3d8d7a] text-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 py-12 sm:py-16">
          <span className="inline-block text-[#fff597] text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
            Trust & Safety
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-3">
            Report an issue
          </h1>
          <p className="text-white/75 text-sm sm:text-base leading-relaxed max-w-2xl">
            See something off? Tell us. Every report is reviewed by our trust
            team within 48 hours. If a campaign is removed, eligible donations
            are refunded.
          </p>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 py-12 sm:py-16">
          <h2 className="text-xl sm:text-2xl font-bold text-[#121212] mb-2">
            What are you reporting?
          </h2>
          <p className="text-[14px] text-black/55 mb-8">
            Pick the category that fits best — it routes your report to the
            right reviewer.
          </p>

          <div className="space-y-4">
            {CATEGORIES.map((c) => {
              const mailto = `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(
                c.subject,
              )}&body=${encodeURIComponent(
                [
                  "Please include:",
                  "• Campaign URL (e.g., hopebuilt.org/campaign/...):",
                  "• What you observed:",
                  "• Any supporting screenshots or links:",
                  "",
                  "",
                ].join("\n"),
              )}`;
              return (
                <a
                  key={c.title}
                  href={mailto}
                  className="group flex items-start gap-4 border border-black/10 rounded-xl p-5 sm:p-6 hover:border-[#2d6b5e]/40 hover:bg-[#3d8d7a]/[0.03] transition-colors"
                >
                  <div className="w-11 h-11 rounded-lg bg-[#3d8d7a]/10 text-[#2d6b5e] flex items-center justify-center shrink-0">
                    <c.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-[#121212] mb-1">
                      {c.title}
                    </h3>
                    <p className="text-[13px] text-black/55 leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-black/30 group-hover:text-[#2d6b5e] shrink-0 mt-1" />
                </a>
              );
            })}
          </div>

          <div className="mt-12 border border-black/10 rounded-xl p-6 bg-[#3d8d7a]/[0.04]">
            <h3 className="text-base font-semibold text-[#121212] mb-2">
              Already donated to a campaign that looks wrong?
            </h3>
            <p className="text-[13px] text-black/55 leading-relaxed mb-3">
              You may be eligible for a full refund. See our{" "}
              <Link to="/refund-policy" className="text-[#2d6b5e] hover:underline">
                refund policy
              </Link>{" "}
              for next steps.
            </p>
            <p className="text-[13px] text-black/55 leading-relaxed">
              In an emergency or if someone is in immediate danger, contact your
              local authorities first.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
