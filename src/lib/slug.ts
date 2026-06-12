/**
 * Convert arbitrary text into a URL-friendly slug.
 * Lowercase, strips punctuation, collapses whitespace/underscores into hyphens,
 * removes leading/trailing hyphens.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
