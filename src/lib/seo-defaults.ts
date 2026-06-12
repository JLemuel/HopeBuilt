export const SITE_NAME = "HopeBuilt";
export const SITE_URL = "https://hopebuilt.org";
export const SITE_LOGO = "https://hercules-cdn.com/file_UhilzQ5c5eKlEltiVpI0Nvai";
export const DEFAULT_OG_IMAGE = "https://hercules-cdn.com/file_UhilzQ5c5eKlEltiVpI0Nvai";

export const DEFAULT_TITLE = `${SITE_NAME} — Donate to causes that matter`;
export const DEFAULT_DESCRIPTION =
  "HopeBuilt is a transparent crowdfunding platform where every donation is trackable and every campaign has a voice. Browse fundraisers or start your own.";

export type SeoJsonLd = Record<string, unknown> | Array<Record<string, unknown>>;

export function organizationJsonLd(): SeoJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: SITE_LOGO,
    description: DEFAULT_DESCRIPTION,
    sameAs: [],
  };
}

export function websiteJsonLd(): SeoJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/campaigns?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
): SeoJsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

export function campaignJsonLd(opts: {
  slug: string;
  title: string;
  description: string;
  image?: string | null;
  goal?: number | null;
  raised?: number | null;
  currency?: string | null;
}): SeoJsonLd {
  const url = `${SITE_URL}/campaign/${opts.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "DonateAction",
      name: opts.title,
      description: opts.description,
      url,
      target: url,
      recipient: {
        "@type": "Organization",
        name: opts.title,
      },
      priceCurrency: opts.currency ?? "USD",
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: opts.title,
      description: opts.description,
      image: opts.image ? [opts.image] : undefined,
      mainEntityOfPage: url,
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        logo: { "@type": "ImageObject", url: SITE_LOGO },
      },
    },
  ];
}
