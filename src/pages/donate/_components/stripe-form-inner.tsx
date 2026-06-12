import { useState } from "react";
import { cn } from "@/lib/utils.ts";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import {
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import type { CheckoutFormProps, CheckoutProcessorConfig } from "./types.ts";

export default function StripeFormInner({
  amount,
  donationType,
  campaignSlug,
  checkoutConfig,
}: CheckoutFormProps & { checkoutConfig: CheckoutProcessorConfig }) {
  const stripe = useStripe();
  const elements = useElements();
  const createPayment = useAction(api.stripeCheckout.createPaymentIntent);
  const paymentMethods = checkoutConfig.paymentMethods;

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [useAsBillingName, setUseAsBillingName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [anonymousDonation, setAnonymousDonation] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showExpressCheckout, setShowExpressCheckout] = useState(false);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Valid email is required";
    }
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function buildReturnUrl(
    donationId: string,
    resolvedEmail?: string,
    resolvedName?: string,
    paymentIntentId?: string,
  ): string {
    const params = new URLSearchParams({
      amount: amount.toString(),
      type: donationType,
      name:
        resolvedName ??
        (anonymousDonation ? "" : `${firstName} ${lastName}`.trim()),
      email: resolvedEmail ?? email.trim(),
      donationId,
    });
    if (paymentIntentId) params.set("payment_intent", paymentIntentId);
    if (campaignSlug) params.set("campaign", campaignSlug);
    return `${window.location.origin}/thank-you?${params.toString()}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setPaymentError(null);

    // Deferred intent flow:
    // 1. Trigger form validation + collection inside the PaymentElement.
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setPaymentError(submitError.message ?? "Please check your card details.");
      setIsSubmitting(false);
      return;
    }

    // 2. Create the PaymentIntent on the server with the CURRENT amount.
    //    This is the only point where a PaymentIntent is ever created, so
    //    there's no risk of charging a stale amount.
    let clientSecret: string;
    let donationId: string;
    try {
      const result = await createPayment({
        amount,
        donationType,
        donorName: `${firstName} ${lastName}`.trim() || "Donor",
        donorEmail: email.trim(),
        campaignSlug,
        anonymous: anonymousDonation,
        processorId: checkoutConfig.processorId,
      });
      clientSecret = result.clientSecret;
      donationId = result.donationId;
    } catch (err) {
      console.error("Failed to create payment:", err);
      setPaymentError("Could not initialize payment. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // 3. Confirm the payment using the client secret we just created.
    //    We use `redirect: "if_required"` so Stripe only redirects if the
    //    payment method actually requires it (e.g. 3DS). Most card and
    //    wallet payments succeed inline, in which case we navigate to the
    //    thank-you page ourselves with the donationId so the donation can
    //    be marked completed.
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: buildReturnUrl(donationId),
        payment_method_data: {
          billing_details: {
            name: `${firstName} ${lastName}`.trim(),
            email: email.trim(),
          },
        },
      },
      redirect: "if_required",
    });

    if (error) {
      setPaymentError(error.message ?? "Payment failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Inline success (no redirect needed) — forward to thank-you ourselves.
    if (paymentIntent && paymentIntent.status === "succeeded") {
      window.location.href = buildReturnUrl(
        donationId,
        undefined,
        undefined,
        paymentIntent.id,
      );
      return;
    }

    // Other statuses (processing, requires_action after redirect, etc.)
    // Stripe will handle them via the return_url.
  }

  const inputBase =
    "w-full rounded-lg border bg-white px-4 py-3.5 text-[15px] text-[#121212] placeholder:text-[#9e9e9e] outline-none transition-colors";
  const inputNormal =
    "border-[#c4c4c4] focus:border-[#3d8d7a] focus:ring-1 focus:ring-[#3d8d7a]/30";
  const inputError =
    "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400/30";

  // Whether express checkout wallets are enabled in settings
  const expressEnabled = paymentMethods.applePay || paymentMethods.googlePay;

  return (
    <div className="space-y-0">
      {/* ---- Express Checkout (Apple Pay / Google Pay) ---- */}
      {expressEnabled && (
        <div className={showExpressCheckout ? "mb-5" : "h-0 overflow-hidden"}>
          <p
            className={cn(
              "text-[13px] text-[#525252] text-center mb-3 font-medium",
              !showExpressCheckout && "hidden",
            )}
          >
            Express checkout
          </p>
          <ExpressCheckoutElement
            options={{
              wallets: {
                applePay: paymentMethods.applePay ? "always" : "never",
                googlePay: paymentMethods.googlePay ? "always" : "never",
              },
              buttonType: { applePay: "donate", googlePay: "donate" },
              buttonHeight: 48,
              // Ask the wallet (Apple Pay / Google Pay) to provide the payer's
              // email and name so we don't rely on whatever is typed in the
              // form fields (which may be empty or invalid for express checkout).
              emailRequired: true,
              billingAddressRequired: true,
            }}
            onConfirm={async (event) => {
              if (!stripe || !elements) return;

              // Prefer email/name from the wallet (Apple ID / Google account).
              // Fall back to the typed email only if the wallet didn't supply one.
              const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              const walletEmail =
                typeof event.billingDetails?.email === "string"
                  ? event.billingDetails.email.trim()
                  : "";
              const typedEmail = email.trim();
              const resolvedEmail =
                walletEmail && EMAIL_REGEX.test(walletEmail)
                  ? walletEmail
                  : typedEmail && EMAIL_REGEX.test(typedEmail)
                    ? typedEmail
                    : "";

              if (!resolvedEmail) {
                toast.error(
                  "A valid email is required. Please enter your email above before using Apple Pay or Google Pay.",
                );
                setErrors((prev) => ({
                  ...prev,
                  email: "Valid email is required",
                }));
                return;
              }

              const walletName =
                typeof event.billingDetails?.name === "string"
                  ? event.billingDetails.name.trim()
                  : "";
              const typedName = `${firstName} ${lastName}`.trim();
              const resolvedName = walletName || typedName || "Donor";

              const { error: submitError } = await elements.submit();
              if (submitError) {
                toast.error(submitError.message ?? "Payment failed.");
                return;
              }
              let clientSecret: string;
              let donationId: string;
              try {
                const result = await createPayment({
                  amount,
                  donationType,
                  donorName: resolvedName,
                  donorEmail: resolvedEmail,
                  campaignSlug,
                  anonymous: anonymousDonation,
                  processorId: checkoutConfig.processorId,
                });
                clientSecret = result.clientSecret;
                donationId = result.donationId;
              } catch {
                toast.error("Could not initialize payment.");
                return;
              }
              const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                  return_url: buildReturnUrl(
                    donationId,
                    resolvedEmail,
                    resolvedName,
                  ),
                },
                redirect: "if_required",
              });
              if (error) {
                toast.error(error.message ?? "Payment failed.");
                return;
              }
              if (paymentIntent && paymentIntent.status === "succeeded") {
                window.location.href = buildReturnUrl(
                  donationId,
                  resolvedEmail,
                  resolvedName,
                  paymentIntent.id,
                );
              }
            }}
            onReady={({ availablePaymentMethods }) => {
              if (
                availablePaymentMethods &&
                ((paymentMethods.applePay &&
                  availablePaymentMethods.applePay) ||
                  (paymentMethods.googlePay &&
                    availablePaymentMethods.googlePay))
              ) {
                setShowExpressCheckout(true);
              }
            }}
          />

          {/* Divider */}
          {showExpressCheckout && (
            <div className="flex items-center gap-3 mt-5">
              <div className="flex-1 h-px bg-[#e0e0e0]" />
              <span className="text-[12px] text-[#9e9e9e] font-medium uppercase tracking-wide">
                or pay with card
              </span>
              <div className="flex-1 h-px bg-[#e0e0e0]" />
            </div>
          )}
        </div>
      )}

      {/* ---- Card form ---- */}
      <form onSubmit={handleSubmit} className="space-y-0">
        {/* ---- Contact section ---- */}
        <p className="text-[14px] font-semibold text-[#121212] mb-3">Contact</p>

        {/* Email */}
        <div className="mb-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn(inputBase, errors.email ? inputError : inputNormal)}
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1 ml-1">{errors.email}</p>
          )}
        </div>

        {/* First name */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={cn(
              inputBase,
              errors.firstName ? inputError : inputNormal,
            )}
          />
          {errors.firstName && (
            <p className="text-xs text-red-500 mt-1 ml-1">{errors.firstName}</p>
          )}
        </div>

        {/* Last name */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={cn(
              inputBase,
              errors.lastName ? inputError : inputNormal,
            )}
          />
          {errors.lastName && (
            <p className="text-xs text-red-500 mt-1 ml-1">{errors.lastName}</p>
          )}
        </div>

        {/* Use as billing name */}
        <label className="flex items-center gap-2.5 mb-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useAsBillingName}
            onChange={(e) => setUseAsBillingName(e.target.checked)}
            className={cn(
              "appearance-none w-4.5 h-4.5 rounded-md border border-[#c4c4c4] bg-white cursor-pointer shrink-0",
              "checked:bg-[#3d8d7a] checked:border-[#3d8d7a] relative",
              "checked:after:content-[''] checked:after:absolute checked:after:left-[5px] checked:after:top-[1px] checked:after:w-[5px] checked:after:h-[10px] checked:after:border-white checked:after:border-r-2 checked:after:border-b-2 checked:after:rotate-45",
            )}
          />
          <span className="text-[14px] text-[#505050]">
            Use as billing name
          </span>
        </label>

        {/* Stripe Payment Element with custom Card overlay */}
        <div className="mb-4 relative">
          {/* Custom overlay for the Card accordion header */}
          <div
            className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 sm:gap-3 bg-white rounded-t-lg border border-[#c4c4c4] border-b-0 px-3.5 py-3 pointer-events-none"
            style={{ height: "48px" }}
          >
            <div className="w-4 h-4 rounded-full border-[5px] border-[#3d8d7a] shrink-0" />
            <span className="text-[14px] sm:text-[15px] font-semibold text-[#121212] whitespace-nowrap">
              Credit card
            </span>
          </div>
          {/* Stripe element — first accordion header hidden behind overlay */}
          <div style={{ paddingTop: "0px" }}>
            <PaymentElement
              options={{
                layout: {
                  type: "accordion",
                  defaultCollapsed: false,
                  radios: "never",
                  spacedAccordionItems: true,
                  visibleAccordionItemsCount: 10,
                },
                wallets: { applePay: "never", googlePay: "never" },
                fields: {
                  billingDetails: {
                    name: "auto",
                    email: "auto",
                  },
                },
                paymentMethodOrder: [
                  ...(paymentMethods.card ? ["card" as const] : []),
                  ...(paymentMethods.klarna ? ["klarna" as const] : []),
                  ...(paymentMethods.cashApp ? ["cashapp" as const] : []),
                  ...(paymentMethods.amazonPay ? ["amazon_pay" as const] : []),
                ],
              }}
            />
          </div>
        </div>

        {paymentError && (
          <p className="text-sm text-red-500 mb-3">{paymentError}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !stripe || !elements}
          style={{
            // Solid green base with an extremely faint metallic sheen, plus a metallic border
            backgroundImage:
              "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 35%, rgba(0,0,0,0.05) 100%), linear-gradient(#3d8d7a, #3d8d7a), linear-gradient(135deg, #b4bac4 0%, #f0f2f5 25%, #8d94a1 50%, #f0f2f5 75%, #b4bac4 100%)",
            backgroundOrigin: "padding-box, border-box, border-box",
            backgroundClip: "padding-box, padding-box, border-box",
            border: "1.5px solid transparent",
          }}
          className={cn(
            "w-full py-4 rounded-lg text-base font-semibold transition-all cursor-pointer",
            "text-white hover:brightness-[1.04] active:translate-y-px",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            "Donate now"
          )}
        </button>

        {/* Don't display name checkbox */}
        <label className="flex items-center gap-2.5 mt-5 cursor-pointer select-none justify-center sm:justify-start">
          <input
            type="checkbox"
            checked={anonymousDonation}
            onChange={(e) => setAnonymousDonation(e.target.checked)}
            className={cn(
              "appearance-none w-4.5 h-4.5 rounded-md border border-[#c4c4c4] bg-white cursor-pointer shrink-0",
              "checked:bg-[#3d8d7a] checked:border-[#3d8d7a] relative",
              "checked:after:content-[''] checked:after:absolute checked:after:left-[5px] checked:after:top-[1px] checked:after:w-[5px] checked:after:h-[10px] checked:after:border-white checked:after:border-r-2 checked:after:border-b-2 checked:after:rotate-45",
            )}
          />
          <span className="text-[14px] text-[#505050]">
            {"Don’t display my name publicly."}
          </span>
        </label>
      </form>
    </div>
  );
}
