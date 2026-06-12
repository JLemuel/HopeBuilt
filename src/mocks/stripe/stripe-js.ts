export type Stripe = {
  confirmPayment: (...args: any[]) => Promise<{
    error?: { message?: string };
    paymentIntent?: { id: string; status: string };
  }>;
};

export async function loadStripe(..._args: any[]): Promise<Stripe> {
  return {
    confirmPayment: async () => ({
      paymentIntent: {
        id: "pi_mock_frontend_only",
        status: "succeeded",
      },
    }),
  };
}
