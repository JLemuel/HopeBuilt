import { useEffect, useMemo } from "react";
import { useAction, useQuery } from "convex/react";
import { loadStripe } from "@stripe/stripe-js";
import { api } from "@/convex/_generated/api.js";
import CheckoutFormShell from "./checkout-form-shell.tsx";
import SimulatedForm from "./simulated-form.tsx";
import StripeForm from "./stripe-form.tsx";
import type { CheckoutFormProps } from "./types.ts";

export default function CheckoutForm(props: CheckoutFormProps) {
  const checkoutConfig = useQuery(api.processors.getCheckoutConfig);
  const registerApplePayDomain = useAction(
    api.processorsActions.registerApplePayDomain,
  );

  const stripePromise = useMemo(() => {
    if (!checkoutConfig?.publicKey) return null;
    return loadStripe(checkoutConfig.publicKey);
  }, [checkoutConfig?.publicKey]);

  // Auto-register the current hostname with Stripe for Apple Pay the first
  // time someone visits the donate page on a new domain. This makes Apple Pay
  // "just work" without any Stripe Dashboard steps.
  useEffect(() => {
    if (!checkoutConfig?.publicKey) return;
    const host = window.location.hostname;
    if (!host || host === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return;
    }
    registerApplePayDomain({ domain: host }).catch(() => {
      // Swallow — Apple Pay is non-critical. Other methods still work.
    });
  }, [checkoutConfig?.publicKey, registerApplePayDomain]);

  if (checkoutConfig === undefined) {
    return <CheckoutFormShell />;
  }

  if (!checkoutConfig) {
    return <SimulatedForm {...props} />;
  }

  return (
    <StripeForm
      {...props}
      stripePromise={stripePromise!}
      checkoutConfig={checkoutConfig}
    />
  );
}
