import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { toast } from "sonner";
import { ConvexError } from "convex/values";
import { useTrackPageView } from "@/hooks/use-track-page-view.ts";
import { getOrCreateTrackingId } from "@/lib/tracking.ts";
import SeoHead from "@/components/seo-head.tsx";

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const amount = searchParams.get("amount");
  const donationType = searchParams.get("type") ?? "onetime";
  const receiptId = searchParams.get("receiptId");
  const donationIdParam = searchParams.get("donationId");
  const paymentIntentId = searchParams.get("payment_intent");
  const campaignSlug = searchParams.get("campaign") ?? "";
  const donorName = searchParams.get("name") ?? "";
  const donorEmail = searchParams.get("email") ?? "";
  const [synced, setSynced] = useState(false);
  const [stripeCompleted, setStripeCompleted] = useState(false);

  // Track thank-you page visit for conversion rate
  useTrackPageView("thank_you", campaignSlug || undefined);

  // Load campaign details if a slug is provided
  const campaign = useQuery(
    api.campaigns.getBySlug,
    campaignSlug ? { slug: campaignSlug } : "skip",
  );

  const syncToShopify = useAction(api.shopify.actions.createOrder);
  const recordDonation = useMutation(api.donations.recordCompleted);
  const syncStripeDonationStatus = useAction(api.stripeCheckout.syncStripeDonationStatus);

  const parsedAmount = amount ? parseFloat(amount) : 0;

  // Stripe checkout success: verify the PaymentIntent server-side. The Stripe
  // webhook is authoritative; this is a fallback for local/dev webhook gaps.
  useEffect(() => {
    if (stripeCompleted || !donationIdParam || !paymentIntentId) return;
    syncStripeDonationStatus({
      donationId: donationIdParam as Id<"donations">,
      paymentIntentId,
    })
      .then(() => setStripeCompleted(true))
      .catch((err: unknown) => {
        setStripeCompleted(true); // Don't retry on error
        console.error("Failed to verify Stripe donation:", err);
      });
  }, [
    donationIdParam,
    paymentIntentId,
    syncStripeDonationStatus,
    stripeCompleted,
  ]);

  // Record donation + sync to Shopify once on mount (legacy/Whop flow)
  useEffect(() => {
    if (donationIdParam) return;
    if (!receiptId || synced || parsedAmount <= 0) return;

    // Record in donation tracking (separate from campaign bar)
    const trackingId = getOrCreateTrackingId();
    recordDonation({
      planId: receiptId,
      receiptId,
      amount: parsedAmount,
      donationType,
      campaignSlug: campaignSlug || undefined,
      donorName: donorName || undefined,
      donorEmail: donorEmail || undefined,
      trackingId,
    }).catch((err: unknown) => {
      console.error("Donation recording failed:", err);
    });

    // Shopify sync
    syncToShopify({ planId: receiptId, receiptId, amount: parsedAmount, donationType })
      .then(() => {
        setSynced(true);
      })
      .catch((error: unknown) => {
        setSynced(true); // Don't retry on error
        if (error instanceof ConvexError) {
          const { message } = error.data as { code: string; message: string };
          console.error("Shopify sync failed:", message);
        } else {
          console.error("Shopify sync failed:", error);
        }
        toast.error("Your donation was successful, but order sync encountered an issue.");
      });
  }, [
    donationIdParam,
    receiptId,
    synced,
    parsedAmount,
    donationType,
    syncToShopify,
    recordDonation,
    campaignSlug,
    donorName,
    donorEmail,
  ]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#ffffff", color: "#121212" }}
    >
      <SeoHead title="Thank you" noindex />
      {/* Header */}
      <header className="border-b border-[#cfcfcf] bg-white">
        <div className="max-w-[1000px] mx-auto px-4 md:px-8 lg:px-12 py-4 flex justify-center">
          <img
            src="https://hercules-cdn.com/file_ebZdt9zWl6O1Ze49Imb2v3LO"
            alt="HopeBuilt"
            className="h-10"
          />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#3d8d7a]/10 mb-6">
          <CheckCircle className="w-8 h-8 text-[#2d6b5e]" />
        </div>

        <h1 className="text-2xl font-bold text-[#121212] mb-2 text-center">
          {donorName
            ? `Thank you, ${donorName}!`
            : "Thank you for your donation!"}
        </h1>

        {campaign && (
          <p className="text-base text-[#333] text-center mb-1">
            Your support for{" "}
            <a
              href={`/campaign/${campaignSlug}`}
              className="font-semibold text-[#2d6b5e] hover:underline cursor-pointer"
            >
              {campaign.title}
            </a>{" "}
            means the world.
          </p>
        )}

        {parsedAmount > 0 && (
          <p className="text-lg font-semibold text-[#2d6b5e] mb-1">
            ${parsedAmount.toFixed(2)}
            {donationType === "monthly" && (
              <span className="text-sm font-normal text-[#525252] ml-1">
                /month
              </span>
            )}
          </p>
        )}

        <p className="text-sm text-[#525252] text-center max-w-sm mb-8">
          Your generosity makes a real difference. You will receive a
          confirmation email shortly.
        </p>

        {receiptId && (
          <div className="bg-[#fafafa] border border-[#cfcfcf] rounded-lg px-5 py-3 mb-8">
            <p className="text-xs text-[#525252]">
              Receipt ID:{" "}
              <span className="font-medium text-[#121212]">{receiptId}</span>
            </p>
          </div>
        )}

        <a
          href={campaignSlug ? `/donate?campaign=${encodeURIComponent(campaignSlug)}` : "/donate"}
          className="text-sm font-medium text-[#2d6b5e] hover:underline cursor-pointer"
        >
          Make another donation
        </a>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#cfcfcf] bg-white py-4">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-[#2d6b5e]">
          <Link to="/refund-policy" className="hover:underline cursor-pointer">
            Refund policy
          </Link>
          <Link to="/privacy" className="hover:underline cursor-pointer">
            Privacy policy
          </Link>
          <Link to="/terms" className="hover:underline cursor-pointer">
            Terms of service
          </Link>
        </div>
      </footer>
    </div>
  );
}
