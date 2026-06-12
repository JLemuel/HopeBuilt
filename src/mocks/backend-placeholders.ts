type PlaceholderOptions<TArgs, TResult> = {
  name: string;
  description: string;
  mockResult: TResult | ((args: TArgs) => TResult | Promise<TResult>);
};

/**
 * Use this for backend/API behavior that does not exist in the sandbox.
 * The maintainer will replace these placeholders with real Convex/API calls
 * when integrating the frontend work back into the main app.
 */
export function createBackendPlaceholder<TArgs = void, TResult = void>({
  name,
  description,
  mockResult,
}: PlaceholderOptions<TArgs, TResult>) {
  return async (args: TArgs): Promise<TResult> => {
    console.info(`[backend-placeholder:${name}]`, {
      description,
      args,
    });

    if (typeof mockResult === "function") {
      return (mockResult as (args: TArgs) => TResult | Promise<TResult>)(args);
    }

    return mockResult;
  };
}

export const backendPlaceholderNotes = {
  rule: "Keep backend placeholders in src/mocks/ and document the expected request/response shape.",
  handoff:
    "Do not import Convex, Stripe, Shopify, Meta, Resend, or real API clients in frontend-only.",
};
