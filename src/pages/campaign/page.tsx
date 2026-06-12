import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Heart, TrendingUp, ChevronRight, X, Flag, Maximize, Volume2, VolumeX, Pause, Play, Mail, MessageCircle, Link2 } from "lucide-react";

function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.412c0-3.018 1.79-4.685 4.533-4.685 1.313 0 2.686.235 2.686.235v2.972h-1.513c-1.49 0-1.954.93-1.954 1.886v2.263h3.327l-.532 3.49h-2.795V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Button } from "@/components/ui/button.tsx";
import { toast } from "sonner";
import Footer from "@/components/footer.tsx";
import SeoHead from "@/components/seo-head.tsx";
import { campaignJsonLd } from "@/lib/seo-defaults.ts";
import { getDisplayedAmount, formatCompactAmount } from "./_lib/utils.ts";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
import { formatDistanceToNow } from "date-fns";
import { useTrackPageView } from "@/hooks/use-track-page-view.ts";
import { AnimatePresence, motion } from "motion/react";
import ReportFundraiserDialog from "./_components/report-fundraiser-dialog.tsx";
import GivingGuaranteeDialog from "./_components/giving-guarantee-dialog.tsx";

export default function CampaignPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const campaign = useQuery(
    api.campaigns.getBySlug,
    slug ? { slug } : "skip",
  );

  // Track campaign page visit for conversion rate
  useTrackPageView("campaign", slug);

  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);

  const [isPaused, setIsPaused] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [guaranteeOpen, setGuaranteeOpen] = useState(false);

  const heroVideoUrl =
    campaign?.mediaType === "video" ? campaign.videoUrl : null;

  // Request autoplay with sound when the campaign page opens.
  useEffect(() => {
    if (!heroVideoUrl) return;
    const video = heroVideoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;
    setIsMuted(false);

    void video.play().then(() => {
      setIsPaused(false);
    }).catch(() => {
      setIsPaused(true);
    });

    return () => {
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, [heroVideoUrl]);

  const handleToggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = heroVideoRef.current;
    if (!video) return;

    if (!video.muted) {
      video.muted = true;
      setIsMuted(true);
      return;
    }

    video.muted = false;
    video.volume = 1;
    setIsMuted(false);
    void video.play().then(() => {
      setIsPaused(false);
    }).catch(() => {
      video.muted = true;
      setIsMuted(true);
    });
  }, []);

  const handleHeroFullscreen = useCallback(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ("webkitEnterFullscreen" in video) {
      (video as HTMLVideoElement & { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
    }
  }, []);

  const handleVideoTap = useCallback(() => {
    const video = heroVideoRef.current;
    if (!video) return;

    if (video.paused) {
      void video.play().then(() => setIsPaused(false));
    } else {
      video.pause();
      setIsPaused(true);
    }

    // Show the pause/play icon briefly then fade it out
    setShowPauseIcon(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setShowPauseIcon(false);
    }, 800);
  }, []);

  const donors = useQuery(
    api.simulatedDonors.listByCampaign,
    campaign ? { campaignId: campaign._id } : "skip",
  );

  const displayedAmount = useMemo(() => {
    if (!campaign) return 0;
    return getDisplayedAmount(campaign);
  }, [campaign]);

  const progressPercent = useMemo(() => {
    if (!campaign || campaign.goalAmount === 0) return 0;
    return Math.min(100, (displayedAmount / campaign.goalAmount) * 100);
  }, [campaign, displayedAmount]);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: campaign?.title ?? "Support this campaign on HopeBuilt",
      text: campaign?.title ?? "Support this campaign on HopeBuilt",
      url,
    };
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User dismissed the share sheet — fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const handleDonate = () => {
    navigate(`/donate?campaign=${encodeURIComponent(slug ?? "")}`);
  };

  // Loading
  if (campaign === undefined) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "#ffffff", color: "#121212" }}
      >
        <header className="border-b border-[#cfcfcf] bg-white">
          <div className="px-4 py-4 flex justify-center">
            <Skeleton className="h-10 w-32" />
          </div>
        </header>
        <Skeleton className="w-full h-[50vh]" />
        <div className="px-5 py-8">
          <Skeleton className="h-8 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  // Not found
  if (!campaign) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: "#ffffff", color: "#121212" }}
      >
        <h1 className="text-2xl font-bold mb-2">Campaign Not Found</h1>
        <p className="text-sm text-[#525252]">
          This campaign may have been removed or the link is incorrect.
        </p>
        <a
          href="/"
          className="mt-4 text-sm text-[#2d6b5e] hover:underline cursor-pointer"
        >
          Go to homepage
        </a>
      </div>
    );
  }

  const seoDescription = stripHtml(campaign.description).slice(0, 200);
  const seoImage =
    campaign.mediaType === "image" && campaign.imageUrl
      ? campaign.imageUrl
      : null;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#ffffff", color: "#121212" }}
    >
      <SeoHead
        title={campaign.title}
        description={seoDescription}
        ogImage={seoImage}
        ogType="article"
        canonicalPath={`/campaign/${campaign.slug}`}
        jsonLd={campaignJsonLd({
          slug: campaign.slug,
          title: campaign.title,
          description: seoDescription,
          image: seoImage,
          goal: campaign.goalAmount,
          raised: displayedAmount,
        })}
      />
      {/* Header */}
      <header className="border-b border-[#cfcfcf] bg-white">
        <div className="px-4 py-4 flex justify-center">
          <a href="/">
            <img
              src="https://hercules-cdn.com/file_ebZdt9zWl6O1Ze49Imb2v3LO"
              alt="HopeBuilt"
              className="h-10"
            />
          </a>
        </div>
      </header>

      {/* Full-width hero media with curved bottom overlay */}
      {((campaign.mediaType === "video" && campaign.videoUrl) ||
        (campaign.mediaType === "image" && campaign.imageUrl)) && (
        <div className="relative bg-black">
          {campaign.mediaType === "video" && campaign.videoUrl && (
            <>
              {/* Tap overlay for play/pause */}
              <div
                className="absolute inset-0 z-20 cursor-pointer"
                onClick={handleVideoTap}
              />
              <video
                ref={heroVideoRef}
                src={campaign.videoUrl}
                autoPlay
                muted={isMuted}
                loop
                playsInline
                preload="auto"
                className="w-full block max-h-[85vh]"
                style={{ objectFit: "contain" }}
              />
              {/* Fading pause/play icon on tap */}
              <AnimatePresence>
                {showPauseIcon && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                  >
                    <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                      {isPaused ? (
                        <Play className="w-7 h-7 text-white ml-0.5" />
                      ) : (
                        <Pause className="w-7 h-7 text-white" />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                type="button"
                onClick={handleToggleMute}
                className="absolute top-4 left-4 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={handleHeroFullscreen}
                className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-sm"
                title="Fullscreen"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </>
          )}
          {campaign.mediaType === "image" && campaign.imageUrl && (
            <img
              src={campaign.imageUrl}
              alt={campaign.title}
              className="w-full object-cover min-h-[50vh] md:min-h-[60vh] max-h-[70vh]"
            />
          )}
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none" />
          {/* Title overlaid on media */}
          <div className="absolute bottom-0 left-0 right-0 z-20 px-5 md:px-8 pb-20 md:pb-32 pointer-events-none">
            <div className="max-w-[1000px] mx-auto">
              <h1 className="text-2xl md:text-4xl font-extrabold text-white text-balance drop-shadow-lg">
                {campaign.title}
              </h1>
            </div>
          </div>
          {/* Curved white overlay */}
          <div className="absolute -bottom-px left-0 right-0 z-10 pointer-events-none">
            <svg
              viewBox="0 0 1440 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full block"
              preserveAspectRatio="none"
            >
              <path
                d="M0 80V40C240 0 480 0 720 20C960 40 1200 60 1440 40V80H0Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1">
        <div className="max-w-[1000px] mx-auto w-full">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 px-5 md:px-8 py-4 md:py-6">
            {/* Left column */}
            <div className="flex-1 min-w-0">

              {/* Progress + buttons (mobile) */}
              <div className="lg:hidden mb-6">
                <CampaignProgress
                  displayedAmount={displayedAmount}
                  goalAmount={campaign.goalAmount}
                  progressPercent={progressPercent}
                  onShare={handleShare}
                  onDonate={handleDonate}
                  donors={donors ?? []}
                />
              </div>

              {/* Description */}
              <div
                className="prose prose-sm max-w-none text-[#333] mb-8 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: campaign.description }}
              />

              {/* Donations feed (mobile only) */}
              <div className="lg:hidden">
                {donors && donors.length > 0 && (
                  <DonationsFeed donors={donors} onDonate={handleDonate} />
                )}
              </div>

              {/* Guarantee */}
              <div className="pt-6 border-t border-[#cfcfcf]">
                <div className="flex items-start gap-3">
                  <img
                    src="https://hercules-cdn.com/file_ZA1HuVSWLcSxcWrLWWg9A1bU"
                    alt="HopeBuilt protection"
                    className="w-8 h-8 shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#121212]">
                      HopeBuilt protects your donation
                    </p>
                    <p className="text-xs text-[#525252] mt-0.5 leading-relaxed">
                      We guarantee a full refund for up to a year in the rare
                      case that fraud occurs.{" "}
                      <button
                        type="button"
                        onClick={() => setGuaranteeOpen(true)}
                        className="underline cursor-pointer hover:text-[#121212] transition-colors"
                      >
                        See our HopeBuilt Giving Guarantee.
                      </button>
                    </p>
                  </div>
                </div>
              </div>

              {/* Report fundraiser */}
              <div className="pt-4 border-t border-[#cfcfcf] mt-6">
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="flex items-center justify-center gap-2 w-full text-sm text-[#525252] hover:text-[#121212] transition-colors cursor-pointer"
                >
                  <Flag className="w-4 h-4" />
                  <span className="underline">Report fundraiser</span>
                </button>
              </div>
            </div>

            {/* Right column (desktop) */}
            <div className="hidden lg:block w-[380px] shrink-0">
              <CampaignProgress
                displayedAmount={displayedAmount}
                goalAmount={campaign.goalAmount}
                progressPercent={progressPercent}
                onShare={handleShare}
                onDonate={handleDonate}
                donors={donors ?? []}
              />
              {/* Donations feed (desktop) */}
              {donors && donors.length > 0 && (
                <div className="mt-6">
                  <DonationsFeed donors={donors} onDonate={handleDonate} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Report fundraiser dialog */}
      <ReportFundraiserDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        campaignId={campaign._id}
        campaignTitle={campaign.title}
      />

      {/* Giving Guarantee dialog */}
      <GivingGuaranteeDialog
        open={guaranteeOpen}
        onOpenChange={setGuaranteeOpen}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Progress + buttons                                                 */
/* ------------------------------------------------------------------ */

type DonorEntry = {
  _id: string;
  donorName: string;
  amount: number;
  createdAt: string;
};

function SocialShareRow() {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent("Support this campaign on HopeBuilt");

  const targets = [
    {
      label: "Share on X",
      icon: XLogo,
      href: `https://twitter.com/intent/tweet?url=${encoded}&text=${text}`,
    },
    {
      label: "Share on Facebook",
      icon: FacebookLogo,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    },
    {
      label: "Share on WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${text}%20${encoded}`,
    },
    {
      label: "Share by email",
      icon: Mail,
      href: `mailto:?subject=${text}&body=${encoded}`,
    },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 pt-1">
      {targets.map((t) => (
        <a
          key={t.label}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.label}
          className="w-9 h-9 rounded-full border border-[#e5e5e5] flex items-center justify-center text-[#525252] hover:bg-[#f5f5f5] hover:text-[#2d6b5e] transition-colors"
        >
          <t.icon className="w-4 h-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        className="w-9 h-9 rounded-full border border-[#e5e5e5] flex items-center justify-center text-[#525252] hover:bg-[#f5f5f5] hover:text-[#2d6b5e] transition-colors cursor-pointer"
      >
        <Link2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function CampaignProgress({
  displayedAmount,
  goalAmount,
  progressPercent,
  onShare,
  onDonate,
  donors,
}: {
  displayedAmount: number;
  goalAmount: number;
  progressPercent: number;
  onShare: () => void;
  onDonate: () => void;
  donors: DonorEntry[];
}) {
  const [showDonationsSheet, setShowDonationsSheet] = useState(false);
  const [currentDonorIndex, setCurrentDonorIndex] = useState(0);

  // Auto-cycle through donors every 3 seconds
  useEffect(() => {
    if (donors.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentDonorIndex((prev) => (prev + 1) % donors.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [donors.length]);

  const currentDonor = donors.length > 0 ? donors[currentDonorIndex] : null;

  return (
    <div>
      <div className="flex items-center gap-4 mb-1">
        {/* Circular progress ring */}
        <ProgressRing percent={progressPercent} size={72} strokeWidth={7} />

        {/* Amount + donor preview */}
        <div className="flex-1 min-w-0">
          <div className="text-lg">
            <span className="font-bold text-[#2d6b5e]">
              ${displayedAmount.toLocaleString()} raised
            </span>
            <span className="text-[#121212] ml-1 underline">
              of {formatCompactAmount(goalAmount)}
            </span>
          </div>

          {/* Recent donation preview — cycles through donors */}
          {currentDonor && (
            <button
              type="button"
              onClick={() => setShowDonationsSheet(true)}
              className="w-full flex items-center gap-3 py-1 rounded-xl hover:bg-[#f5f5f5] transition-colors cursor-pointer text-left overflow-hidden h-8"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentDonor._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <p className="text-sm text-[#525252] truncate">
                    {currentDonor.donorName}
                    {" donated "}
                    ${currentDonor.amount}
                  </p>
                </motion.div>
              </AnimatePresence>
              <ChevronRight className="w-4 h-4 text-[#999] shrink-0" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 mt-3">
        <Button
          onClick={onDonate}
          className="w-full h-12 rounded-lg text-base font-semibold bg-[#3d8d7a] hover:bg-[#3d8d7a]/90 text-white border-0 cursor-pointer"
        >
          Donate now
        </Button>
        <Button
          onClick={onShare}
          variant="ghost"
          className="w-full h-12 rounded-lg text-base font-normal border border-[#c4c4c4] bg-transparent hover:bg-[#f5f5f5] text-[#525252] cursor-pointer"
        >
          Share
        </Button>
        <SocialShareRow />
      </div>

      {/* Donations sheet overlay */}
      {showDonationsSheet && (
        <DonationsSheet
          donors={donors}
          onClose={() => setShowDonationsSheet(false)}
          onDonate={onDonate}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Donor avatar                                                       */
/* ------------------------------------------------------------------ */

function DonorAvatar({ donor, size = "md" }: { donor: DonorEntry; size?: "sm" | "md" }) {
  const isAnonymous = donor.donorName === "Anonymous";
  const initial = isAnonymous ? null : donor.donorName.charAt(0).toUpperCase();
  const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4.5 h-4.5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={`${sizeClasses} rounded-full bg-[#f0f0f0] flex items-center justify-center shrink-0`}>
      {isAnonymous ? (
        <Heart className={`${iconSize} text-[#525252]`} />
      ) : (
        <span className={`${textSize} font-semibold text-[#333]`}>{initial}</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Donations sheet (full overlay)                                     */
/* ------------------------------------------------------------------ */

function DonationsSheet({
  donors,
  onClose,
  onDonate,
}: {
  donors: DonorEntry[];
  onClose: () => void;
  onDonate: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative z-10 bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8]">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#121212]">Donations</h2>
            <span className="text-xs font-medium text-[#525252] bg-[#f0f0f0] rounded-full px-2.5 py-0.5">
              {donors.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f0f0f0] cursor-pointer"
          >
            <X className="w-5 h-5 text-[#525252]" />
          </button>
        </div>

        {/* Donors list */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {/* Recent count badge */}
          <RecentBadge donors={donors} />

          <div className="space-y-0.5">
            {donors.map((donor) => (
              <DonorRow key={donor._id} donor={donor} />
            ))}
          </div>

          {/* CTA banner */}
          <div className="mt-4 mb-2 bg-[#e8f5f1] rounded-xl p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#121212]">
                Each gift brings hope — together, we create change.
              </p>
            </div>
            <Button
              onClick={() => {
                onClose();
                onDonate();
              }}
              size="sm"
              className="bg-[#3d8d7a] hover:bg-[#3d8d7a]/90 text-white shrink-0 cursor-pointer"
            >
              Donate
            </Button>
          </div>
        </div>

        {/* Bottom donate button */}
        <div className="px-5 py-4 border-t border-[#e8e8e8]">
          <Button
            onClick={() => {
              onClose();
              onDonate();
            }}
            className="w-full h-12 rounded-lg text-base font-semibold bg-[#3d8d7a] hover:bg-[#3d8d7a]/90 text-white border-0 cursor-pointer"
          >
            Donate now
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Recent badge                                                       */
/* ------------------------------------------------------------------ */

function RecentBadge({ donors }: { donors: DonorEntry[] }) {
  const recentCount = donors.filter((d) => {
    const diff = Date.now() - new Date(d.createdAt).getTime();
    return diff < 24 * 60 * 60 * 1000;
  }).length;

  if (recentCount === 0) return null;

  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-9 h-9 rounded-full bg-[#ede9fe] flex items-center justify-center">
        <TrendingUp className="w-4 h-4 text-[#7c3aed]" />
      </div>
      <span className="text-sm font-semibold text-[#7c3aed]">
        {recentCount} recent donation{recentCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Donations feed component (in left column)                          */
/* ------------------------------------------------------------------ */

function DonationsFeed({ donors, onDonate }: { donors: DonorEntry[]; onDonate: () => void }) {
  const [showSheet, setShowSheet] = useState(false);
  const displayed = donors.slice(0, 5);

  return (
    <div className="mb-8 pt-6 border-t border-[#cfcfcf]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-[#121212]">Donations</h2>
        <span className="text-xs font-medium text-[#525252] bg-[#f0f0f0] rounded-full px-2.5 py-0.5">
          {donors.length}
        </span>
      </div>

      {/* Recent count badge */}
      <RecentBadge donors={donors} />

      {/* Donor list */}
      <div className="space-y-1">
        {displayed.map((donor) => (
          <DonorRow key={donor._id} donor={donor} />
        ))}
      </div>

      {/* See all button */}
      {donors.length > 5 && (
        <button
          type="button"
          onClick={() => setShowSheet(true)}
          className="mt-4 w-full py-2.5 rounded-full border border-[#c4c4c4] text-sm font-medium text-[#121212] hover:bg-[#f5f5f5] cursor-pointer"
        >
          See all
        </button>
      )}

      {/* Full donations sheet */}
      {showSheet && (
        <DonationsSheet
          donors={donors}
          onClose={() => setShowSheet(false)}
          onDonate={onDonate}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Donor row                                                          */
/* ------------------------------------------------------------------ */

function DonorRow({ donor }: { donor: DonorEntry }) {
  const timeAgo = formatDistanceToNow(new Date(donor.createdAt), { addSuffix: false });

  return (
    <div className="flex items-center gap-3 py-3">
      <DonorAvatar donor={donor} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#121212] truncate">
          {donor.donorName}
        </p>
        <p className="text-sm text-[#525252]">
          <span className="font-semibold text-[#121212]">${donor.amount}</span>
          {" · "}
          {timeAgo}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Circular progress ring                                             */
/* ------------------------------------------------------------------ */

function ProgressRing({
  percent,
  size,
  strokeWidth,
}: {
  percent: number;
  size: number;
  strokeWidth: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clamped / 100) * circumference;
  const strokeColor = getProgressColor(clamped);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
    >
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e8e8e8"
        strokeWidth={strokeWidth}
      />
      {/* Filled arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.6s ease" }}
      />
      {/* Percentage text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
        fill="#121212"
        fontSize={size * 0.22}
        fontWeight="bold"
      >
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}

// Interpolates the progress ring color from green to yellow based on percent.
// Low percentages stay solid green so they're clearly visible even as a sliver.
function getProgressColor(percent: number): string {
  const t = Math.min(1, Math.max(0, percent / 100));
  const start = { r: 0x3d, g: 0x8d, b: 0x7a }; // #3d8d7a green
  const end = { r: 0xff, g: 0xf5, b: 0x97 }; // #fff597 yellow
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}
