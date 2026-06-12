import { Elements } from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import { STRIPE_APPEARANCE, STRIPE_FONTS } from "../_lib/utils.ts";
import StripeFormInner from "./stripe-form-inner.tsx";
import type { CheckoutFormProps, CheckoutProcessorConfig } from "./types.ts";

export default function StripeForm({
  stripePromise,
  amount,
  donationType,
  campaignSlug,
  checkoutConfig,
}: CheckoutFormProps & {
  stripePromise: Promise<Stripe | null>;
  checkoutConfig: CheckoutProcessorConfig;
}) {
  const paymentMethods = checkoutConfig.paymentMethods;

  // Deferred intent flow: we initialize <Elements> with just mode/amount/currency
  // and only create the PaymentIntent at submit time (see StripeFormInner).
  // This avoids creating a PaymentIntent every time the user clicks an amount.
  //
  // We pass amount in cents to Elements for display/express-checkout purposes.
  // The actual charge amount comes from the PaymentIntent we create at submit.
  // Build the list of payment method types to allow, based on processor toggles.
  // In deferred-intent mode, Stripe requires paymentMethodTypes to determine
  // which methods appear in the PaymentElement — otherwise Stripe auto-enables
  // everything configured in the Dashboard (including Link).
  //
  // Note: "apple_pay" and "google_pay" are NOT valid values for
  // paymentMethodTypes — they surface through the Express Checkout Element
  // when `card` is included here. Including `card` is required for
  // Apple Pay / Google Pay buttons to appear.
  const allowedMethodTypes = [
    ...(paymentMethods.card ? ["card" as const] : []),
    ...(paymentMethods.link ? ["link" as const] : []),
    ...(paymentMethods.klarna ? ["klarna" as const] : []),
    ...(paymentMethods.cashApp ? ["cashapp" as const] : []),
    ...(paymentMethods.amazonPay ? ["amazon_pay" as const] : []),
  ];

  // Prefer the Stripe Payment Method Configuration (synced from toggles)
  // when available — this is the ONLY way to fully strip Link's autofill
  // banner ("Secure, fast checkout with Link"). Apple Pay + Google Pay are
  // enabled inside the config and still render via Express Checkout Element.
  //
  // Fall back to paymentMethodTypes if the sync hasn't run yet (new
  // processor, sync error, etc.).
  const elementsOptions = paymentMethods.paymentMethodConfigurationId
    ? ({
        mode: donationType === "monthly" ? "subscription" : "payment",
        amount: Math.round(amount * 100),
        currency: "usd",
        appearance: STRIPE_APPEARANCE,
        fonts: STRIPE_FONTS,
        paymentMethodConfiguration: paymentMethods.paymentMethodConfigurationId,
      } as const)
    : ({
        mode: donationType === "monthly" ? "subscription" : "payment",
        amount: Math.round(amount * 100),
        currency: "usd",
        appearance: STRIPE_APPEARANCE,
        fonts: STRIPE_FONTS,
        paymentMethodTypes:
          allowedMethodTypes.length > 0
            ? allowedMethodTypes
            : ["card" as const],
      } as const);

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <StripeFormInner
        amount={amount}
        donationType={donationType}
        campaignSlug={campaignSlug}
        checkoutConfig={checkoutConfig}
      />
    </Elements>
  );
}
