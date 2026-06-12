import HeroSection from "./_components/hero-section.tsx";
import HowItWorksSection from "./_components/how-it-works-section.tsx";
import CtaSection from "./_components/cta-section.tsx";
import Footer from "@/components/footer.tsx";
import SeoHead from "@/components/seo-head.tsx";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo-defaults.ts";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <SeoHead
        title="HopeBuilt — Donate to causes that matter"
        description="A transparent crowdfunding platform where every donation is trackable and every campaign has a voice. Browse fundraisers or start your own."
        canonicalPath="/"
        jsonLd={[
          organizationJsonLd() as Record<string, unknown>,
          websiteJsonLd() as Record<string, unknown>,
        ]}
      />
      <HeroSection />
      <HowItWorksSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
