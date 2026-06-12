import type { ReactNode } from "react";

type ConfirmPaymentResult = {
  error?: { message?: string };
  paymentIntent?: { id: string; status: string };
};

const mockStripe = {
  confirmPayment: async (..._args: any[]): Promise<ConfirmPaymentResult> => ({
    paymentIntent: {
      id: "pi_mock_frontend_only",
      status: "succeeded",
    },
  }),
};

const mockElements = {
  submit: async () => ({ error: undefined }),
};

export function Elements({ children }: { children: ReactNode; [key: string]: any }) {
  return <>{children}</>;
}

export function PaymentElement(_props: Record<string, any>) {
  return (
    <div className="rounded-lg border border-dashed border-[#c4c4c4] bg-white p-4 text-sm text-[#525252]">
      Mock Stripe PaymentElement. No real card data is collected.
    </div>
  );
}

export function ExpressCheckoutElement({
  onConfirm,
  onReady,
}: {
  onConfirm?: (event?: any) => void | Promise<void>;
  onReady?: (event?: any) => void;
  [key: string]: any;
}) {
  return (
    <button
      type="button"
      onClick={() => void onConfirm?.({})}
      onMouseEnter={() => onReady?.({ availablePaymentMethods: {} })}
      className="w-full rounded-lg border border-dashed border-[#c4c4c4] bg-white px-4 py-3 text-sm font-medium text-[#525252]"
    >
      Mock express checkout
    </button>
  );
}

export function useStripe() {
  return mockStripe;
}

export function useElements() {
  return mockElements;
}
