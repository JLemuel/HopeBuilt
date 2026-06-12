import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";

/** Generate or retrieve a session ID stored in sessionStorage */
function getSessionId(): string {
  const KEY = "hb_session_id";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

/** Capture and persist UTM params from the current URL */
function getUtmParams(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
} {
  const UTM_KEY = "hb_utm_params";

  // Check URL params first (landing page)
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source") ?? undefined;
  const utmMedium = params.get("utm_medium") ?? undefined;
  const utmCampaign = params.get("utm_campaign") ?? undefined;
  const utmContent = params.get("utm_content") ?? undefined;

  // If we found UTMs in the URL, save them for the session
  if (utmSource) {
    const saved = { utmSource, utmMedium, utmCampaign, utmContent };
    sessionStorage.setItem(UTM_KEY, JSON.stringify(saved));
    return saved;
  }

  // Otherwise check sessionStorage for previously captured UTMs
  const stored = sessionStorage.getItem(UTM_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as {
        utmSource?: string;
        utmMedium?: string;
        utmCampaign?: string;
        utmContent?: string;
      };
    } catch {
      // ignore parse errors
    }
  }

  return {};
}

/** Get document referrer, but only from external sources */
function getExternalReferrer(): string | undefined {
  const ref = document.referrer;
  if (!ref) return undefined;
  try {
    const refHost = new URL(ref).hostname;
    const currentHost = window.location.hostname;
    // Only capture external referrers
    if (refHost !== currentHost) return ref;
  } catch {
    // invalid URL
  }
  return undefined;
}

/**
 * Tracks a page view for conversion rate analytics.
 * Captures UTM parameters and referrer for channel attribution.
 * Fires once per mount (deduplicated on the backend by sessionId + pageType).
 */
export function useTrackPageView(
  pageType: "campaign" | "thank_you",
  campaignSlug?: string,
) {
  const record = useMutation(api.pageViews.record);
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const sessionId = getSessionId();
    const utms = getUtmParams();
    const referrer = getExternalReferrer();

    record({
      pageType,
      sessionId,
      campaignSlug: campaignSlug || undefined,
      utmSource: utms.utmSource,
      utmMedium: utms.utmMedium,
      utmCampaign: utms.utmCampaign,
      utmContent: utms.utmContent,
      referrer,
    }).catch((err: unknown) => {
      console.error("Page view tracking failed:", err);
    });
  }, [pageType, campaignSlug, record]);
}
