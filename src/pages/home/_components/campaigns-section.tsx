import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton.tsx";

export default function CampaignsSection() {
  const campaigns = useQuery(api.publicCampaigns.getTopCampaigns, { limit: 3 });

  return (
    <section id="campaigns" className="py-12 sm:py-20 lg:py-28 bg-[#F7F7F5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-14">
          <span className="inline-block text-[#2d6b5e] text-[10px] sm:text-xs font-bold tracking-[0.15em] uppercase mb-2 sm:mb-3">
            Active Campaigns
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#121212] tracking-tight mb-2 sm:mb-3">
            Make a Difference Today
          </h2>
          <p className="text-[#525252] text-xs sm:text-base max-w-md mx-auto">
            Support a campaign that speaks to your heart.
          </p>
        </div>

        {/* Cards */}
        {campaigns === undefined ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[380px] sm:h-[440px] rounded-2xl" />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <p className="text-center text-[#525252] text-sm py-12">
            No active campaigns right now. Check back soon!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-5">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign._id} campaign={campaign} />
            ))}
          </div>
        )}

        {/* View all */}
        <div className="text-center mt-7 sm:mt-10">
          <Link
            to="/campaigns"
            className="inline-flex items-center gap-1.5 text-sm text-[#2d6b5e] hover:text-[#2d6b5e] font-semibold transition-colors cursor-pointer"
          >
            View All Campaigns
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

type CampaignData = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  imageUrl: string | null;
  videoUrl: string | null;
  donorCount: number;
};

function CampaignCard({ campaign }: { campaign: CampaignData }) {
  const percent = Math.min(100, (campaign.currentAmount / campaign.goalAmount) * 100);
  const plainDesc = campaign.description.replace(/<[^>]+>/g, "").slice(0, 90);

  const raised = campaign.currentAmount >= 1000
    ? `$${(campaign.currentAmount / 1000).toFixed(1)}K`
    : `$${campaign.currentAmount.toLocaleString()}`;
  const goal = campaign.goalAmount >= 1000
    ? `$${(campaign.goalAmount / 1000).toFixed(0)}K`
    : `$${campaign.goalAmount.toLocaleString()}`;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#EBEBEB] group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      {/* Media: image, video, or fallback */}
      <div className="relative h-48 sm:h-44 overflow-hidden bg-[#3d8d7a]">
        {campaign.imageUrl ? (
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : campaign.videoUrl ? (
          <video
            src={campaign.videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#3d8d7a] to-[#fff597]/40" />
        )}
        <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#3d8d7a] text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full tracking-wide uppercase">
          Active
        </span>
        {/* Video badge */}
        {!campaign.imageUrl && campaign.videoUrl && (
          <span className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/60 text-white text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5">
              <path d="M6 4l6 4-6 4V4z" />
            </svg>
            Video
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 sm:p-5">
        <h3 className="text-[15px] sm:text-[15px] font-bold text-[#121212] mb-2 sm:mb-2 line-clamp-2 leading-snug tracking-tight">
          {campaign.title}
        </h3>
        <p className="text-[13px] sm:text-[13px] text-[#525252] leading-relaxed mb-4 sm:mb-4 line-clamp-2">
          {plainDesc}
        </p>

        {/* Progress */}
        <div className="mb-4 sm:mb-4">
          <div className="h-1.5 bg-[#EBEBEB] rounded-full overflow-hidden mb-2 sm:mb-2">
            <div
              className="h-full bg-[#3d8d7a] rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[12px] sm:text-[12px] text-[#525252]">
            <span>
              <span className="font-bold text-[#121212]">{raised}</span>
              {" "}of {goal}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {campaign.donorCount}
            </span>
          </div>
        </div>

        {/* CTA */}
        <Link
          to={`/campaign/${campaign.slug}`}
          className="w-full flex items-center justify-center gap-2 bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white text-sm font-semibold py-3 sm:py-3 rounded-xl transition-colors cursor-pointer"
        >
          Donate Now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
