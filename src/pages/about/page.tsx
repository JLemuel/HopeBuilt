import AboutHero from "./_components/about-hero.tsx";
import OurStory from "./_components/our-story.tsx";
import QuoteBlock from "./_components/quote-block.tsx";
import ValuesSection from "./_components/values-section.tsx";
import HowItWorksSection from "./_components/how-it-works.tsx";
import AboutStats from "./_components/about-stats.tsx";
import AboutCta from "./_components/about-cta.tsx";
import Footer from "@/components/footer.tsx";
import SeoHead from "@/components/seo-head.tsx";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <SeoHead
        title="About HopeBuilt — Our story & mission"
        description="HopeBuilt started in 2023 to give grassroots fundraisers a transparent, low-fee platform. Learn about our values, team, and the campaigns we power."
        canonicalPath="/about"
      />
      <AboutHero />
      <OurStory />
      <QuoteBlock />
      <ValuesSection />
      <HowItWorksSection />
      <AboutStats />
      <AboutCta />
      <Footer />
    </div>
  );
}
