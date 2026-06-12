import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "convex/react";
import { Authenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import SeoHead from "@/components/seo-head.tsx";

function SuccessContent() {
  const claimDraft = useMutation(api.campaignDrafts.claimDraft);
  const claimedRef = useRef(false);

  useEffect(() => {
    if (claimedRef.current) return;
    const draftId = sessionStorage.getItem("pending_campaign_draft_id");
    if (!draftId) return;

    claimedRef.current = true;
    sessionStorage.removeItem("pending_campaign_draft_id");

    claimDraft({ draftId: draftId as Id<"campaignDrafts"> }).catch(() => {
      // Silently fail — draft may already be claimed or deleted
    });
  }, [claimDraft]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-5">
      <SeoHead title="Campaign submitted" noindex />
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-[#3d8d7a]/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-[#3d8d7a]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#121212] mb-3">
          Campaign Submitted!
        </h1>
        <p className="text-sm text-[#525252] leading-relaxed mb-8">
          Your campaign is now pending approval. Our team typically reviews submissions within 1–2 business days and you{"'"}ll be notified once it{"'"}s live.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center bg-[#3d8d7a] hover:bg-[#2d6b5e] text-white font-semibold py-3.5 rounded-full transition-colors cursor-pointer text-sm"
          >
            Back to Home
          </Link>
          <Link
            to="/donate"
            className="inline-flex items-center justify-center border border-[#c4c4c4] text-[#121212] font-semibold py-3.5 rounded-full transition-colors cursor-pointer text-sm hover:bg-[#f5f5f5]"
          >
            Make a Donation
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <>
      <AuthLoading>
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa] px-5">
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </AuthLoading>
      <Authenticated>
        <SuccessContent />
      </Authenticated>
    </>
  );
}
