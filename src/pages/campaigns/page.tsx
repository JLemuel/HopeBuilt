import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import {
  ArrowRight,
  Search,
  Users,
  BookOpen,
  HeartPulse,
  Flame,
  TreePine,
  Baby,
  Home,
  LayoutGrid,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useDebounce } from "@/hooks/use-debounce.ts";
import Footer from "@/components/footer.tsx";
import SiteHeader from "@/components/site-header.tsx";
import SeoHead from "@/components/seo-head.tsx";

// ─── Types ─────────────────────────────────────────────────────────────────

type CategoryId =
  | "education"
  | "healthcare"
  | "disaster_relief"
  | "community"
  | "children"
  | "environment";

type ActiveCategory = CategoryId | "all";

type CampaignItem = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  imageUrl: string | null;
  videoUrl: string | null;
  donorCount: number;
  category: string | null;
  featured: boolean;
};

// ─── Constants ─────────────────────────────────────────────────────────────

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1700936206521-791dcd35c745?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1920";

const CATEGORIES: { id: CategoryId; label: string; Icon: React.ElementType }[] = [
  { id: "education", label: "Education", Icon: BookOpen },
  { id: "healthcare", label: "Healthcare", Icon: HeartPulse },
  { id: "disaster_relief", label: "Disaster Relief", Icon: Flame },
  { id: "community", label: "Community", Icon: Home },
  { id: "children", label: "Children", Icon: Baby },
  { id: "environment", label: "Environment", Icon: TreePine },
];

// ─── Hero ──────────────────────────────────────────────────────────────────

function CampaignsHero({
  searchInput,
  setSearchInput,
}: {
  searchInput: string;
  setSearchInput: (v: string) => void;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.6], [0.62, 0.84]);

  return (
    <section
      ref={sectionRef}
      className="relative h-[420px] sm:h-[480px] lg:h-[520px] overflow-hidden bg-[#3d8d7a]"
    >
      {/* Parallax bg */}
      <motion.div
        style={{ y: imageY }}
        className="absolute inset-0 w-full h-[125%] top-[-12.5%]"
      >
        <img
          src={HERO_IMAGE}
          alt="People making an impact"
          className="w-full h-full object-cover"
        />
      </motion.div>

      {/* Overlay */}
      <motion.div
        style={{ opacity: overlayOpacity }}
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/80 pointer-events-none"
      />

      <SiteHeader variant="transparent" />

      {/* Hero text */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center pb-6 px-5">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center mb-7 sm:mb-8"
        >
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="inline-block text-[#2d6b5e] text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase mb-3"
          >
            Active Campaigns
          </motion.span>
          <h1 className="text-3xl sm:text-5xl lg:text-[3.4rem] font-bold text-white tracking-tight text-balance leading-[1.08] mb-3 sm:mb-4">
            Explore Campaigns
          </h1>
          <p className="text-white/60 text-sm sm:text-base max-w-sm mx-auto">
            Find a cause that moves you and make your impact today.
          </p>
        </motion.div>

        {/* Floating search bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="w-full max-w-xl relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] z-10" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search campaigns, causes, or organisations..."
            className="w-full pl-11 pr-12 py-3.5 sm:py-4 rounded-2xl bg-white/95 backdrop-blur-sm text-[#121212] placeholder-[#737373] text-sm font-medium shadow-2xl border border-white/20 outline-none focus:ring-2 focus:ring-[#3d8d7a]/40"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#525252] cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Filter bar ────────────────────────────────────────────────────────────

function FilterBar({
  activeCategory,
  setActiveCategory,
  resultCount,
  isLoading,
}: {
  activeCategory: ActiveCategory;
  setActiveCategory: (c: ActiveCategory) => void;
  resultCount: number;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white border-b border-[#EBEBEB] sticky top-0 z-20 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-10">
        <div className="flex items-center gap-3 py-3 overflow-x-auto scrollbar-hide">
          {/* "All" pill */}
          <button
            onClick={() => setActiveCategory("all")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeCategory === "all"
                ? "bg-[#3d8d7a] border-[#3d8d7a] text-white shadow-sm"
                : "bg-white border-[#c4c4c4] text-[#525252] hover:border-[#3d8d7a] hover:text-[#121212]"
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            All
          </button>

          {CATEGORIES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === id
                  ? "bg-[#3d8d7a] border-[#3d8d7a] text-white shadow-sm"
                  : "bg-white border-[#c4c4c4] text-[#525252] hover:border-[#3d8d7a] hover:text-[#2d6b5e]"
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}

          {/* Result count */}
          {!isLoading && (
            <span className="ml-auto pl-4 text-[11px] text-[#737373] font-medium shrink-0 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3" />
              {resultCount} campaign{resultCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Campaign Card ─────────────────────────────────────────────────────────

function CampaignCard({ campaign, index }: { campaign: CampaignItem; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });

  const percent = Math.min(100, (campaign.currentAmount / campaign.goalAmount) * 100);
  const plainDesc = campaign.description.replace(/<[^>]+>/g, "").slice(0, 110);

  const formatAmount = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1000
      ? `$${(n / 1000).toFixed(1)}K`
      : `$${n.toLocaleString()}`;

  const categoryMeta = CATEGORIES.find((c) => c.id === campaign.category);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: Math.min(index % 3, 2) * 0.08 }}
      className="bg-white rounded-2xl overflow-hidden border border-[#EBEBEB] group hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
    >
      {/* Image */}
      <Link
        to={`/campaign/${campaign.slug}`}
        aria-label={`View campaign: ${campaign.title}`}
        className="relative h-52 overflow-hidden bg-[#3d8d7a] shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3d8d7a] focus-visible:ring-offset-2"
      >
        {campaign.imageUrl ? (
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : campaign.videoUrl ? (
          <video
            src={`${campaign.videoUrl}#t=0.1`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            preload="metadata"
            muted
            playsInline
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#3d8d7a] via-[#2d6b5e] to-[#3d8d7a]/60" />
        )}

        {/* Dark gradient bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {campaign.featured && (
            <span className="bg-[#3d8d7a] text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
              Featured
            </span>
          )}
          {categoryMeta && (
            <span className="bg-black/50 backdrop-blur-sm text-white text-[9px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <categoryMeta.Icon className="w-2.5 h-2.5" />
              {categoryMeta.label}
            </span>
          )}
        </div>

        {/* Percent raised bottom-right */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            {Math.round(percent)}% funded
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <h3 className="text-[15px] sm:text-base font-bold text-[#121212] mb-2 line-clamp-2 leading-snug tracking-tight">
          {campaign.title}
        </h3>
        <p className="text-[12px] sm:text-[13px] text-[#525252] leading-relaxed mb-5 line-clamp-2 flex-1">
          {plainDesc}
        </p>

        {/* Progress */}
        <div className="mb-5">
          <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden mb-2.5">
            <motion.div
              className="h-full bg-gradient-to-r from-[#3d8d7a] to-[#2d6b5e] rounded-full"
              initial={{ width: "0%" }}
              animate={isInView ? { width: `${percent}%` } : {}}
              transition={{ duration: 1, delay: 0.3 + (index % 3) * 0.1, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] sm:text-[12px]">
            <span className="text-[#525252]">
              <span className="font-bold text-[#121212] text-[13px]">
                {formatAmount(campaign.currentAmount)}
              </span>{" "}
              raised of {formatAmount(campaign.goalAmount)}
            </span>
            <span className="flex items-center gap-1 text-[#525252]">
              <Users className="w-3 h-3" />
              <span className="font-semibold text-[#525252]">{campaign.donorCount.toLocaleString()}</span>
            </span>
          </div>
        </div>

        {/* CTA */}
        <Link
          to={`/campaign/${campaign.slug}`}
          className="w-full flex items-center justify-center gap-2 bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white text-sm font-semibold py-3 rounded-xl transition-all duration-200 cursor-pointer group/btn"
        >
          Donate Now
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Skeleton Card ─────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#EBEBEB]">
      <Skeleton className="h-52 w-full rounded-none" />
      <div className="p-5 sm:p-6 space-y-3">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-5/6 rounded-lg" />
        <div className="pt-2 space-y-2">
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-28 rounded-lg" />
            <Skeleton className="h-3 w-16 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-11 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#F3F4F6] flex items-center justify-center mb-5">
        <Search className="w-7 h-7 text-[#c4c4c4]" />
      </div>
      <h3 className="text-base font-bold text-[#121212] mb-2">No campaigns found</h3>
      <p className="text-sm text-[#525252] mb-6 max-w-xs">
        Try adjusting your search or browse a different category.
      </p>
      <button
        onClick={onClear}
        className="inline-flex items-center gap-2 bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white text-sm font-semibold px-6 py-2.5 rounded-full transition-colors cursor-pointer"
      >
        Clear filters
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ─── CTA Section ───────────────────────────────────────────────────────────

function CtaSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="py-16 sm:py-24 bg-[#3d8d7a] relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#3d8d7a]/6 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#3d8d7a]/4 blur-3xl" />
      </div>

      <div ref={ref} className="relative z-10 max-w-2xl mx-auto px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block text-[#2d6b5e] text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
            Make a Difference
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight text-balance">
            Ready to Build Hope?
          </h2>
          <p className="text-white/50 text-sm sm:text-base max-w-md mx-auto mb-9">
            Join thousands of donors creating lasting change around the world.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3"
        >
          <Link
            to="/donate"
            className="flex items-center justify-center gap-2 bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white font-semibold px-8 py-3.5 rounded-full transition-colors cursor-pointer text-sm"
          >
            Donate Now
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/campaign-guide"
            className="flex items-center justify-center gap-2 bg-transparent border border-white/20 hover:border-white/50 text-white font-semibold px-8 py-3.5 rounded-full transition-colors cursor-pointer text-sm"
          >
            Campaign Guide
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CampaignsBrowsePage() {
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch] = useDebounce(searchInput, 350);

  const { results, status, loadMore } = usePaginatedQuery(
    api.publicCampaigns.listPublished,
    {
      category: activeCategory === "all" ? undefined : activeCategory,
      search: debouncedSearch || undefined,
    },
    { initialNumItems: 6 },
  );

  const isLoading = status === "LoadingFirstPage";

  const handleClear = () => {
    setActiveCategory("all");
    setSearchInput("");
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col">
      <SeoHead
        title="Browse active fundraisers"
        description="Discover fundraisers to support across education, healthcare, disaster relief, and more. Every donation is trackable and transparent."
        canonicalPath="/campaigns"
      />
      <CampaignsHero searchInput={searchInput} setSearchInput={setSearchInput} />

      <FilterBar
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        resultCount={results.length}
        isLoading={isLoading}
      />

      {/* Grid */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 lg:px-10 py-10 sm:py-14">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState onClear={handleClear} />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((campaign, i) => (
                <CampaignCard key={campaign._id} campaign={campaign} index={i} />
              ))}
            </div>

            {/* Load more */}
            {status === "CanLoadMore" && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => loadMore(6)}
                  className="inline-flex items-center gap-2 bg-white border border-[#c4c4c4] hover:border-[#3d8d7a] hover:text-[#2d6b5e] text-[#525252] text-sm font-semibold px-8 py-3.5 rounded-full transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  Load More Campaigns
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {status === "LoadingMore" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {status === "Exhausted" && results.length > 6 && (
              <p className="text-center text-[#737373] text-xs mt-10">
                You{"'"}ve seen all {results.length} campaigns
              </p>
            )}
          </>
        )}
      </main>

      <CtaSection />
      <Footer />
    </div>
  );
}
