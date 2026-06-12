# HopeBuilt Frontend-Only Sandbox

This folder is a standalone Vite + React sandbox for frontend-only work. Its `src/` tree mirrors the main app's frontend files, while backend/API integrations are intercepted by local mocks under `src/mocks/`.

Frontend developers should work in the same page, component, hook, and style files that exist in the main app. The lead developer will connect any new backend/API placeholders to the real backend after handoff.

## What This Sandbox Is For

- Building and previewing new frontend pages locally.
- Redesigning existing React components using mock data.
- Adding backend/API placeholders that describe what data a page needs.
- Working on Tailwind classes, responsive layout, animations, and UI polish.
- Sharing frontend changes that can later be integrated into the main HopeBuilt app.

## Install First

Install these before running the sandbox:

1. Node.js 22 or newer.
2. pnpm 11.

If pnpm is not installed, run:

```bash
corepack enable
corepack prepare pnpm@11.1.3 --activate
```

## Run Locally

From this folder:

```bash
cd frontend-only
pnpm install
pnpm dev
```

Open the Vite URL printed in the terminal. This sandbox defaults to port `5174`, usually:

```text
http://localhost:5174
```

If that port is busy, Vite may choose another port and print the correct URL.

## Useful Commands

```bash
pnpm dev
```

Starts the local frontend preview.

```bash
pnpm build
```

Type-checks and builds the sandbox.

```bash
pnpm typecheck
```

Runs TypeScript checks without producing a build.

## Important Folder Rules

`frontend-only/src/` is a mirror of the main frontend. Work in the normal files:

```text
src/App.tsx
src/components/
src/hooks/
src/lib/
src/pages/
src/index.css
```

Sandbox-only files live here:

```text
src/mocks/
```

Do not add backend SDK calls, secrets, or environment-specific values to this sandbox. Do not copy `.env.local`, `convex/`, or generated backend files into this folder.

## Backend/API Placeholder Rule

If a page needs backend behavior that is not already mocked, add a placeholder or resolver under `src/mocks/` instead of importing a real backend client.

Allowed:

```text
src/mocks/convex/
src/mocks/stripe/
src/mocks/backend-placeholders.ts
src/mocks/use-mock-api.ts
src/mocks/data.ts
```

Not allowed:

```text
convex/react
@/convex/*
../convex/*
real Stripe clients
Shopify API clients
Meta API clients
Resend clients
private REST endpoints
real API keys or tokens
```

Every placeholder should include:

1. A clear name matching the intended backend action, such as `campaigns.create` or `donations.createCheckout`.
2. A short description of what the real integration should do later.
3. TypeScript types for the expected input and output shape.
4. Mock data that lets the UI continue working locally.

Example:

```tsx
import { createBackendPlaceholder } from "./backend-placeholders.ts";

type CreateCampaignArgs = {
  title: string;
  category: string;
  goalAmount: number;
};

export const createCampaignPlaceholder = createBackendPlaceholder<
  CreateCampaignArgs,
  { ok: true; temporaryId: string }
>({
  name: "campaigns.create",
  description:
    "Placeholder for campaign creation. Main app integration should replace this with the real backend mutation.",
  mockResult: (args) => ({
    ok: true,
    temporaryId: `mock-campaign-${args.title}`,
  }),
});
```

Using the placeholder in UI:

```tsx
const { createCampaign } = useMockCampaigns();

await createCampaign({
  title: "New campaign",
  category: "Community",
  goalAmount: 10000,
});
```

This makes it clear what needs to be integrated later without exposing backend files or secrets.

## How Mock Data Works

Production imports are redirected by `vite.config.ts` and `tsconfig.app.json`:

```text
convex/react             -> src/mocks/convex/react.tsx
convex/values            -> src/mocks/convex/values.ts
@convex-dev/auth/react   -> src/mocks/convex/auth-react.tsx
@/convex/*               -> src/mocks/convex/*
@stripe/react-stripe-js  -> src/mocks/stripe/react-stripe-js.tsx
@stripe/stripe-js        -> src/mocks/stripe/stripe-js.ts
```

Mock data and placeholders live in:

```text
src/mocks/data.ts
src/mocks/backend-placeholders.ts
src/mocks/use-mock-api.ts
src/mocks/convex/
src/mocks/stripe/
```

Keep mirrored page imports intact. For example, this production pattern should stay as-is in page files:

```tsx
const campaigns = useQuery(api.campaigns.list);
```

If that call needs better mock behavior, update `src/mocks/convex/react.tsx`, `src/mocks/data.ts`, or a typed placeholder in `src/mocks/backend-placeholders.ts`.

## Notes For Frontend Developers

- Match the existing design language in the main app: React, Vite, Tailwind CSS 4, Radix/shadcn-style UI primitives, and `lucide-react` icons.
- Keep components presentational when possible. Pass data through props or existing hooks.
- Avoid changing business logic, auth behavior, production backend contracts, or data models.
- If a page needs backend behavior, add a typed placeholder or mock resolver in `src/mocks/` instead of importing real services.
- Leave clear names and types for placeholders so the main project owner can integrate them after handoff.
- Do not commit secrets, `.env.local`, API keys, webhook secrets, OAuth secrets, or private deployment URLs.

## Routes

The sandbox uses the same route tree as the main app through `src/App.tsx`. Public pages, dashboard pages, and portal pages are available locally, backed by mock auth and mock API data.