import type { Id } from "@/convex/_generated/dataModel.d.ts";

export type PaymentMethodConfig = {
  card: boolean;
  applePay: boolean;
  googlePay: boolean;
  link: boolean;
  klarna: boolean;
  cashApp: boolean;
  amazonPay: boolean;
  paymentMethodConfigurationId: string | null;
};

export type CheckoutProcessorConfig = {
  processorId: Id<"paymentProcessors">;
  publicKey: string;
  paymentMethods: PaymentMethodConfig;
};

export type CheckoutFormProps = {
  amount: number;
  donationType: "onetime" | "monthly";
  campaignSlug?: string;
};
