import { Link } from "react-router-dom";
import { ArrowRight, Compass, HeartHandshake, BookOpen } from "lucide-react";
import SiteHeader from "@/components/site-header.tsx";
import Footer from "@/components/footer.tsx";
import SeoHead from "@/components/seo-head.tsx";

const SUGGESTIONS = [
  {
    icon: Compass,
    title: "Browse campaigns",
    description: "See fundraisers you can support today.",
    to: "/campaigns",
  },
  {
    icon: HeartHandshake,
    title: "Start a campaign",
    description: "Launch your own fundraiser in minutes.",
    to: "/start-campaign",
  },
  {
    icon: BookOpen,
    title: "Read the guide",
    description: "Tips for telling a story that moves people.",
    to: "/campaign-guide",
  },
];

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SeoHead title="Page not found" noindex />
      <SiteHeader variant="solid-dark" />

      <main className="flex-1 flex items-center">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-24 text-center w-full">
          <p className="text-[11px] font-bold text-[#2d6b5e] uppercase tracking-[0.18em] mb-3">
            404 — Page not found
          </p>
          <h1 className="text-3xl sm:text-5xl font-bold text-[#121212] leading-tight tracking-tight mb-4">
            This page wandered off.
          </h1>
          <p className="text-[15px] sm:text-base text-black/55 leading-relaxed max-w-xl mx-auto mb-10">
            The link may be broken, or the page may have been moved. Here are a
            few places that might help.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {SUGGESTIONS.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="group text-left border border-black/10 rounded-xl p-5 hover:border-[#2d6b5e]/40 hover:bg-[#3d8d7a]/[0.03] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#3d8d7a]/10 flex items-center justify-center text-[#2d6b5e] mb-3">
                  <s.icon className="w-5 h-5" />
                </div>
                <h2 className="text-base font-semibold text-[#121212] mb-1">
                  {s.title}
                </h2>
                <p className="text-[13px] text-black/55 leading-relaxed">
                  {s.description}
                </p>
              </Link>
            ))}
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-1.5 bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-colors"
          >
            Return to home
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
