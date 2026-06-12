import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import SiteHeader from "@/components/site-header.tsx";


const COLLAGE_IMAGES = [
  {
    src: "https://hercules-cdn.com/file_fE2s5YqmDSM04DjdmPbwGVby",
    alt: "Volunteers helping in the community",
    className: "left-[2%] sm:left-[4%] top-[5%] w-[55%] sm:w-[48%] h-[60%] sm:h-[65%]",
    z: 10,
  },
  {
    src: "https://hercules-cdn.com/file_LJRAKh8BSJM4O7RSqde4FVUM",
    alt: "Smiling children",
    className: "right-[2%] sm:right-[4%] top-[2%] w-[42%] sm:w-[38%] h-[42%] sm:h-[45%]",
    z: 20,
  },
  {
    src: "https://hercules-cdn.com/file_upLMALsPlKSSioXlnUkHrdhn",
    alt: "Volunteers loading supplies",
    className: "right-[5%] sm:right-[8%] bottom-[16%] w-[44%] sm:w-[40%] h-[40%] sm:h-[42%]",
    z: 15,
  },
  {
    src: "https://hercules-cdn.com/file_bJRZtp23Nion7AKoWEzXsnPu",
    alt: "Community members embracing",
    className: "left-[8%] sm:left-[12%] bottom-[2%] w-[36%] sm:w-[30%] h-[38%] sm:h-[40%]",
    z: 25,
  },
  {
    src: "https://hercules-cdn.com/file_MGw2pM5H2rMDwqq3U0teZnj0",
    alt: "Community gathering",
    className: "left-[38%] sm:left-[40%] top-[2%] w-[28%] sm:w-[24%] h-[34%] sm:h-[36%]",
    z: 30,
  },
  {
    src: "https://hercules-cdn.com/file_mG4l6tFiHftvYIe2wOq1Th0c",
    alt: "Woman and child with Mexican flag at community gathering",
    className: "left-[34%] sm:left-[38%] bottom-[2%] w-[42%] sm:w-[36%] h-[46%] sm:h-[48%]",
    z: 35,
  },
];

export default function HeroSection() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#3d8d7a] pb-24 sm:pb-32 lg:pb-44">
        <SiteHeader variant="hero-green" />

        {/* Hero text */}
        <div className="relative z-20 max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pt-8 sm:pt-10 lg:pt-12">
          <div className="flex flex-col items-center text-center gap-8 sm:gap-10 lg:gap-12 pb-10 sm:pb-12 lg:pb-14">
            <div>
              <h1 className="text-[2.4rem] sm:text-5xl lg:text-[3.75rem] font-extrabold text-white leading-[1.08] tracking-tight text-balance">
                Fundraising that
                <br />
                actually works.
              </h1>
            </div>

            <div>
              <Link
                to="/start-campaign"
                className="inline-flex items-center gap-2 bg-[#fff597] hover:bg-[#ddd47d] text-[#2d6b5e] font-semibold text-sm px-6 py-3 rounded-full transition-colors cursor-pointer"
              >
                Launch your story
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Floating collage */}
      <div className="relative z-10 -mt-20 sm:-mt-28 lg:-mt-40 px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14 lg:pb-16">
        <div className="relative max-w-7xl mx-auto h-[340px] sm:h-[440px] lg:h-[560px]">
          {COLLAGE_IMAGES.map((img, i) => (
            <div
              key={i}
              style={{ zIndex: img.z }}
              className={`absolute overflow-hidden rounded-2xl sm:rounded-3xl border border-white/20 shadow-[0_8px_40px_rgba(0,0,0,0.25)] ${img.className}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover"
              />
            </div>
          ))}

          {/* Stats card */}
          <div className="absolute z-40 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <LiveStats />
          </div>

        </div>
      </div>
    </>
  );
}

function LiveStats() {
  const stats = useQuery(api.publicCampaigns.getPublicStats);

  const ORG_BASELINE_RAISED = 1564811.36;
  const ORG_BASELINE_DONORS = 61879;

  // Snapshot the first resolved totals so visible reactive ticks (the
  // every-5-min simulated-donor cron causes Convex to repush `totalRaised`,
  // which would otherwise increment the headline while the visitor watches
  // — that reads as fake / kills trust).
  const [snapshot, setSnapshot] = useState<
    { raised: number; donors: number } | null
  >(null);

  useEffect(() => {
    if (snapshot !== null || stats === undefined) return;
    setSnapshot({
      raised: (stats.totalRaised ?? 0) + ORG_BASELINE_RAISED,
      donors: (stats.totalDonors ?? 0) + ORG_BASELINE_DONORS,
    });
  }, [snapshot, stats]);

  const raisedTotal =
    snapshot?.raised ?? ORG_BASELINE_RAISED;
  const donorTotal =
    snapshot?.donors ?? ORG_BASELINE_DONORS;

  // Whole dollars only — decimals on a headline raised figure look fake.
  const totalRaised = `$${Math.floor(raisedTotal).toLocaleString()}`;
  const donorCount = donorTotal;

  return (
    <div className="bg-[#3d8d7a]/35 backdrop-blur-2xl rounded-xl sm:rounded-2xl p-5 sm:p-7 max-w-[280px] sm:max-w-sm border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]">
      <p className="text-[10px] sm:text-xs text-white/60 uppercase tracking-widest mb-1 sm:mb-2 font-medium">
        Total Funds Raised
      </p>
      <p className="text-2xl sm:text-4xl font-bold text-[#fff597] mb-2 sm:mb-3 tracking-tight">
        {totalRaised}
      </p>
      <div className="flex items-center gap-2.5 sm:gap-3 text-white/50 text-[11px] sm:text-sm">
        <span className="font-medium text-white/80">
          {donorCount.toLocaleString()} Donors from{" "}
          <span className="font-bold bg-gradient-to-r from-white via-white/60 to-white bg-clip-text text-transparent drop-shadow-[0_1px_2px_rgba(255,255,255,0.3)]">
            around the world
          </span>
        </span>
      </div>
    </div>
  );
}
