import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
  type SeoJsonLd,
} from "@/lib/seo-defaults.ts";

type JsonLdNode = Record<string, unknown>;

type SeoHeadProps = {
  title?: string;
  description?: string;
  ogImage?: string | null;
  ogType?: "website" | "article" | "profile";
  canonicalPath?: string;
  noindex?: boolean;
  jsonLd?: SeoJsonLd;
};

// React 19 hoists <title>, <meta>, <link>, and <script> rendered inside any
// component to the document <head> automatically. No HelmetProvider needed.
export default function SeoHead({
  title,
  description,
  ogImage,
  ogType = "website",
  canonicalPath,
  noindex = false,
  jsonLd,
}: SeoHeadProps) {
  const fullTitle = title
    ? title.includes(SITE_NAME)
      ? title
      : `${title} | ${SITE_NAME}`
    : DEFAULT_TITLE;
  const finalDescription = description ?? DEFAULT_DESCRIPTION;
  const finalOgImage = ogImage ?? DEFAULT_OG_IMAGE;
  const canonical = canonicalPath
    ? canonicalPath.startsWith("http")
      ? canonicalPath
      : `${SITE_URL}${canonicalPath}`
    : undefined;

  const jsonLdEntries: JsonLdNode[] = jsonLd
    ? Array.isArray(jsonLd)
      ? (jsonLd as JsonLdNode[])
      : [jsonLd as JsonLdNode]
    : [];

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      {noindex ? <meta name="robots" content="noindex,nofollow" /> : null}
      {canonical ? <link rel="canonical" href={canonical} /> : null}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={finalOgImage} />
      {canonical ? <meta property="og:url" content={canonical} /> : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalOgImage} />

      {jsonLdEntries.map((entry, i) => (
        <script
          key={i}
          type="application/ld+json"
          // React 19 hoists <script> tags, but the JSON-LD payload must be
          // serialized into the element body — dangerouslySetInnerHTML is the
          // standard pattern (the content is JSON, not arbitrary HTML).
          dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
        />
      ))}
    </>
  );
}
