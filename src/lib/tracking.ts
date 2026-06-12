const TRACKING_KEY = "hb_tracking_id";

/** Characters that avoid visual ambiguity (no I, O, 0, 1) */
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Returns the current session's 6-character tracking ID,
 * generating one if it doesn't exist yet.
 */
export function getOrCreateTrackingId(): string {
  let id = sessionStorage.getItem(TRACKING_KEY);
  if (!id) {
    id = "";
    for (let i = 0; i < 6; i++) {
      id += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
    }
    sessionStorage.setItem(TRACKING_KEY, id);
  }
  return id;
}
