import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Heart, ShieldCheck, ArrowLeft, Menu, X, ChevronRight, Users } from "lucide-react";
import CheckoutForm from "./_components/checkout-form.tsx";
import DonateVideoPreview from "./_components/donate-video-preview.tsx";
import { cn } from "@/lib/utils.ts";
import Footer from "@/components/footer.tsx";
import SeoHead from "@/components/seo-head.tsx";
import { getDisplayedAmount, formatCompactAmount } from "@/pages/campaign/_lib/utils.ts";
import GivingGuaranteeDialog from "@/pages/campaign/_components/giving-guarantee-dialog.tsx";

const NAV_LINKS = [
  { label: "Launch a Story", href: "/start-campaign" },
  { label: "Sign In", href: "/portal" },
  { label: "Pricing", href: "/#how-it-works" },
  { label: "About", href: "/#about" },
];

const MOBILE_NAV_LINKS = [
  { label: "Donate", description: "Discover fundraisers and nonprofits to support", href: "/donate" },
  { label: "Launch a Story", description: "Start fundraising, tips, and resources", href: "/start-campaign" },
  { label: "Pricing", description: "How it works, pricing, and more", href: "/#how-it-works" },
  { label: "About", description: "Our mission, story, and impact", href: "/#about" },
];

/* ------------------------------------------------------------------ */
/*  Amounts                                                            */
/* ------------------------------------------------------------------ */

type DonationType = "onetime" | "monthly";

const AMOUNTS = [5, 10, 25, 50, 100, 200, 300, 500] as const;
type Amount = (typeof AMOUNTS)[number];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DonatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campaignSlug = searchParams.get("campaign") ?? "";
  const [mobileOpen, setMobileOpen] = useState(false);

  // /donate is meaningless without a campaign — bounce to the browse page so
  // the visitor can pick one. Runs before the Convex query so we never
  // render a half-loaded checkout.
  useEffect(() => {
    if (!campaignSlug) {
      navigate("/campaigns", { replace: true });
    }
  }, [campaignSlug, navigate]);

  // Load campaign details if a slug is provided
  const campaign = useQuery(
    api.campaigns.getBySlug,
    campaignSlug ? { slug: campaignSlug } : "skip",
  );

  // Slug was provided but the campaign doesn't exist / was removed.
  useEffect(() => {
    if (campaignSlug && campaign === null) {
      navigate("/campaigns", { replace: true });
    }
  }, [campaignSlug, campaign, navigate]);

  // Fetch donors for the campaign
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

  const [donationType, setDonationType] = useState<DonationType>("onetime");
  const [selectedAmount, setSelectedAmount] = useState<Amount | null>(25);
  const [guaranteeOpen, setGuaranteeOpen] = useState(false);

  // Handle redirect after auth callback (e.g. portal sign-in)
  useEffect(() => {
    const returnPath = sessionStorage.getItem("auth_return_path");
    if (returnPath) {
      sessionStorage.removeItem("auth_return_path");
      navigate(returnPath, { replace: true });
    }
  }, [navigate]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#ffffff", color: "#121212" }}
    >
      <SeoHead title="Donate" noindex />
      {/* -------- Header (inverted: white bg, green text) -------- */}
      <header className="bg-white border-b border-[#cfcfcf]">
        <nav className="relative z-30 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10 py-3 sm:py-4 flex items-center justify-between">
            {/* Left spacer (desktop) */}
            <div className="hidden md:block flex-1" />
            {/* Left spacer (mobile) */}
            <div className="md:hidden flex-1" />

            <Link to="/" className="cursor-pointer shrink-0">
              <img
                src="https://hercules-cdn.com/file_csC9Rpxc7FkA4y5jvBL1n3gp"
                alt="HopeBuilt"
                className="h-14 sm:h-20"
              />
            </Link>

            {/* Right nav links (desktop) */}
            <div className="hidden md:flex items-center gap-5 lg:gap-7 flex-1 justify-end">
              {NAV_LINKS.map((link) =>
                link.href.startsWith("/#") ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-base font-medium text-[#2d6b5e]/80 hover:text-[#2d6b5e] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-base font-medium text-[#2d6b5e]/80 hover:text-[#2d6b5e] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden flex-1 flex justify-end">
              <button
                onClick={() => setMobileOpen(true)}
                className="flex items-center justify-center cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6 text-[#2d6b5e]" />
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile slide-in panel */}
        <div
          className={`md:hidden fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`md:hidden fixed top-0 right-0 z-50 h-full w-[85%] max-w-[400px] bg-white shadow-2xl transition-transform duration-300 ease-out ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex justify-end p-4">
            <button
              onClick={() => setMobileOpen(false)}
              className="w-10 h-10 flex items-center justify-center cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-gray-800" />
            </button>
          </div>
          <div className="flex flex-col px-6 pt-2">
            {MOBILE_NAV_LINKS.map((link) => {
              const inner = (
                <div className="flex items-center justify-between py-5 border-b border-gray-100">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">{link.label}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{link.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 ml-4" />
                </div>
              );
              return link.href.startsWith("/#") ? (
                <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)} className="cursor-pointer">
                  {inner}
                </a>
              ) : (
                <Link key={link.label} to={link.href} onClick={() => setMobileOpen(false)} className="cursor-pointer">
                  {inner}
                </Link>
              );
            })}
          </div>
          <div className="flex flex-col gap-3 px-6 mt-8">
            <Link
              to="/portal"
              onClick={() => setMobileOpen(false)}
              className="w-full py-3.5 bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white font-semibold text-center rounded-full transition-colors cursor-pointer"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* -------- Main body -------- */}
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-[580px] px-4 md:px-8 py-6 lg:py-10">
            {/* Campaign context banner */}
            {campaign && (
              <div className="mb-6">
                <a
                  href={`/campaign/${campaignSlug}`}
                  className="inline-flex items-center gap-1.5 text-sm text-[#525252] hover:text-[#2d6b5e] cursor-pointer mb-3"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to campaign
                </a>

                {/* Donor stats bar — above the title */}
                <div className="mb-4">
                  <div className="flex items-center gap-4">
                    <DonateProgressRing percent={progressPercent} size={56} strokeWidth={5} />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-[#2d6b5e]">
                        ${displayedAmount.toLocaleString()}{" "}
                        <span className="text-[#525252] font-normal text-sm">
                          raised of {formatCompactAmount(campaign.goalAmount)}
                        </span>
                      </p>
                      {donors && donors.length > 0 && (
                        <p className="text-xs text-[#525252] mt-0.5 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {donors.length} donor{donors.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <h2 className="text-xl font-bold text-[#121212]">
                  Donate to: {campaign.title}
                </h2>

                {/* Subtle campaign video preview to reinforce emotional context */}
                {campaign.mediaType === "video" && campaign.videoUrl && (
                  <div className="mt-5">
                    <DonateVideoPreview
                      videoUrl={campaign.videoUrl}
                      posterUrl={campaign.imageUrl ?? undefined}
                      title={campaign.title}
                    />
                  </div>
                )}

              </div>
            )}
            {/* --- Gift selector --- */}
            <section className="mb-8">
              <div
                className="rounded-xl p-4 sm:p-5 bg-white"
                style={{
                  // Silver/metallic glass border using a layered gradient.
                  // Outer metallic ring + subtle inner highlight + soft shadow
                  // for depth. Wraps the donation type + price points so they
                  // feel like a single, premium selector card.
                  backgroundImage:
                    "linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #c9ced6 0%, #f2f4f7 25%, #9ea6b2 50%, #f2f4f7 75%, #c9ced6 100%)",
                  backgroundOrigin: "border-box",
                  backgroundClip: "padding-box, border-box",
                  border: "1.5px solid transparent",
                  boxShadow:
                    "0 1px 0 rgba(255,255,255,0.9) inset, 0 0 0 1px rgba(190,198,210,0.25), 0 8px 24px -12px rgba(80,90,110,0.18)",
                }}
              >
                {/* Give once / Monthly toggle */}
                <div className="flex rounded-lg border border-[#c4c4c4] overflow-hidden mb-4">
                  {(["onetime", "monthly"] as const).map((type) => {
                    const isSelected = donationType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDonationType(type)}
                        style={
                          isSelected
                            ? {
                                boxShadow:
                                  "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.08)",
                              }
                            : undefined
                        }
                        className={cn(
                          "flex-1 py-3 text-sm font-medium transition-all cursor-pointer",
                          type === "monthly" && "border-l border-[#c4c4c4]",
                          isSelected
                            ? "bg-[#3d8d7a] text-white active:translate-y-px"
                            : "bg-white text-[#121212] hover:bg-[#f5f5f5]",
                        )}
                      >
                        {type === "onetime" ? "Give once" : "Monthly"}
                      </button>
                    );
                  })}
                </div>

                {/* Amount grid */}
                <div className="grid grid-cols-4 gap-2.5">
                  {AMOUNTS.map((amt) => {
                    const isSelected = selectedAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setSelectedAmount(amt)}
                        style={
                          isSelected
                            ? {
                                boxShadow:
                                  "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.08)",
                              }
                            : undefined
                        }
                        className={cn(
                          "py-3.5 rounded-lg text-sm font-semibold transition-all cursor-pointer border",
                          isSelected
                            ? "bg-[#3d8d7a] text-white border-[#3d8d7a] active:translate-y-px"
                            : "bg-white text-[#121212] border-[#c4c4c4] hover:border-[#3d8d7a] hover:text-[#2d6b5e]",
                        )}
                      >
                        ${amt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* --- Checkout form --- */}
            {selectedAmount ? (
              <section className="mb-6">
                <CheckoutForm
                  amount={selectedAmount}
                  donationType={donationType}
                  campaignSlug={campaignSlug || undefined}
                />
              </section>
            ) : (
              <div className="rounded-lg border border-dashed border-[#c4c4c4] py-16 flex flex-col items-center justify-center text-center mb-6">
                <Heart className="w-8 h-8 text-[#737373] mb-3" />
                <p className="text-sm text-[#525252]">
                  Select an amount above to continue
                </p>
              </div>
            )}

            {/* Donation guarantee */}
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
                    We guarantee a full refund for up to a year in the rare case
                    that fraud occurs.{" "}
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
        </div>
      </div>

      {/* -------- Footer (matches home page) -------- */}
      <Footer />

      {/* Giving Guarantee dialog */}
      <GivingGuaranteeDialog
        open={guaranteeOpen}
        onOpenChange={setGuaranteeOpen}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini progress ring for the donate page                             */
/* ------------------------------------------------------------------ */

function DonateProgressRing({
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
  const strokeColor = getDonateProgressColor(clamped);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e8e8e8"
        strokeWidth={strokeWidth}
      />
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
function getDonateProgressColor(percent: number): string {
  const t = Math.min(1, Math.max(0, percent / 100));
  const start = { r: 0x3d, g: 0x8d, b: 0x7a };
  const end = { r: 0xff, g: 0xf5, b: 0x97 };
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}
