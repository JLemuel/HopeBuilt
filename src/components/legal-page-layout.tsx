import { useEffect } from "react";
import { type ReactNode } from "react";
import SiteHeader from "@/components/site-header.tsx";
import SeoHead from "@/components/seo-head.tsx";
import Footer from "@/components/footer.tsx";

type LegalPageLayoutProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  lastUpdated: string;
  canonicalPath: string;
  toc?: Array<{ id: string; label: string }>;
  children: ReactNode;
};

export default function LegalPageLayout({
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  canonicalPath,
  toc,
  children,
}: LegalPageLayoutProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SeoHead
        title={title}
        description={subtitle ?? `${title} — HopeBuilt.`}
        canonicalPath={canonicalPath}
        ogType="article"
      />
      <SiteHeader variant="solid-dark" />

      <section className="bg-[#3d8d7a] text-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 py-12 sm:py-16">
          <span className="inline-block text-[#fff597] text-[10px] font-bold tracking-[0.18em] uppercase mb-3">
            {eyebrow}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight mb-3">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-white/75 text-sm sm:text-base leading-relaxed max-w-2xl mb-4">
              {subtitle}
            </p>
          ) : null}
          <p className="text-[12px] text-white/55">Last updated: {lastUpdated}</p>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 py-12 sm:py-16 grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-10 lg:gap-16">
          {toc && toc.length > 0 ? (
            <aside className="lg:sticky lg:top-24 self-start order-first">
              <h2 className="text-[10px] font-bold text-black/30 uppercase tracking-[0.18em] mb-3">
                On this page
              </h2>
              <ul className="space-y-2">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-[13px] text-black/60 hover:text-[#2d6b5e] transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          ) : null}

          <article className="prose prose-sm sm:prose-base max-w-none prose-headings:font-bold prose-headings:text-[#121212] prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-3 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 prose-p:text-[15px] prose-p:text-[#4B5563] prose-p:leading-relaxed prose-li:text-[15px] prose-li:text-[#4B5563] prose-a:text-[#2d6b5e] prose-a:no-underline hover:prose-a:underline prose-strong:text-[#121212]">
            {children}
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
