/**
 * Turns the raw Error.message coming out of Convex Auth (or our own server
 * code) into something a human can act on. Convex wraps server-side throws
 * with a stack trace and request-id prefix that's useless to a visitor and
 * actively scary in a UI alert — we strip that, match a handful of known
 * patterns, and fall back to a flow-appropriate generic message.
 */

export type AuthFlow =
  | "signIn"
  | "signUp"
  | "resetRequest"
  | "resetVerify"
  | "oauth";

const FLOW_FALLBACK: Record<AuthFlow, string> = {
  signIn: "Sign-in failed. Please try again.",
  signUp: "Could not create your account. Please try again.",
  resetRequest:
    "We couldn't send the reset code. Double-check your email and try again.",
  resetVerify:
    "We couldn't reset your password. The code may have expired — request a new one.",
  oauth: "Sign-in with that provider failed. Please try again.",
};

function stripConvexNoise(raw: string): string {
  if (!raw) return "";
  return raw
    // [CONVEX A(auth:signIn)] [Request ID: abc123]
    .replace(/\[CONVEX[^\]]*\]\s*/gi, "")
    .replace(/\[Request ID:[^\]]*\]\s*/gi, "")
    // Server Error / Uncaught Error: / Uncaught ConvexError:
    .replace(/^(Server Error|Uncaught (?:Convex)?Error:?)\s*/gim, "")
    // "Called by client" trailing noise
    .replace(/\bCalled by client\b.*$/is, "")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}

export function humanizeAuthError(err: unknown, flow: AuthFlow): string {
  const raw = err instanceof Error ? err.message : "";
  const cleaned = stripConvexNoise(raw);
  const haystack = cleaned.toLowerCase();

  // --- Sign-in ----------------------------------------------------------

  // Convex Auth uses "InvalidSecret" for both wrong-password AND for an
  // email that has no password credential (e.g. signed up via Google only).
  // We don't tell the user which case it is — that's a credential-stuffing
  // vector — but we hint at the social option.
  if (
    haystack.includes("invalidsecret") ||
    haystack.includes("invalid secret") ||
    haystack.includes("invalidaccountid") ||
    haystack.includes("invalid account id") ||
    haystack.includes("account not found") ||
    haystack.includes("user not found")
  ) {
    return flow === "signIn"
      ? "Incorrect email or password. If you signed up with Google, use the Google button instead."
      : flow === "resetRequest"
      ? "We couldn't find an account with that email."
      : FLOW_FALLBACK[flow];
  }

  // --- Sign-up: email already in use ------------------------------------
  if (
    haystack.includes("already exists") ||
    haystack.includes("already in use") ||
    haystack.includes("duplicate") ||
    haystack.includes("email already") ||
    haystack.includes("unique constraint")
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }

  // --- Reset-verify: bad / expired code ---------------------------------
  if (
    haystack.includes("invalidverifier") ||
    haystack.includes("invalid verifier") ||
    haystack.includes("could not verify code") ||
    haystack.includes("verification") ||
    haystack.includes("expired") ||
    haystack.includes("code is invalid") ||
    haystack.includes("invalid code")
  ) {
    return flow === "resetVerify"
      ? "That code is invalid or has expired. Request a new one and try again."
      : FLOW_FALLBACK[flow];
  }

  // --- Rate limiting ----------------------------------------------------
  if (
    haystack.includes("rate limit") ||
    haystack.includes("too many") ||
    haystack.includes("try again later")
  ) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  // --- Email-delivery problems on reset request -------------------------
  if (
    haystack.includes("resend") ||
    haystack.includes("email send") ||
    haystack.includes("smtp")
  ) {
    return "We couldn't send the reset email. Try again in a minute, or contact support.";
  }

  // --- Network / offline ------------------------------------------------
  if (
    haystack.includes("failed to fetch") ||
    haystack.includes("networkerror") ||
    haystack.includes("network error") ||
    haystack.includes("offline")
  ) {
    return "Network problem. Check your connection and try again.";
  }

  // --- Server / 5xx -----------------------------------------------------
  if (
    haystack.includes("internal server error") ||
    haystack.includes("server error") ||
    haystack.includes("500") ||
    haystack.includes("502") ||
    haystack.includes("503")
  ) {
    return "Our servers had a hiccup. Please try again in a moment.";
  }

  // --- ConvexError payload that already looks human ---------------------
  // If the cleaned message is short and sentence-like, surface it directly.
  if (cleaned && cleaned.length > 0 && cleaned.length <= 160) {
    return cleaned;
  }

  return FLOW_FALLBACK[flow];
}
