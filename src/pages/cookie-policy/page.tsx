import LegalPageLayout from "@/components/legal-page-layout.tsx";

const TOC = [
  { id: "what-are-cookies", label: "What are cookies?" },
  { id: "types", label: "Cookies we use" },
  { id: "third-parties", label: "Third-party cookies" },
  { id: "controls", label: "Your controls" },
  { id: "changes", label: "Changes" },
];

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Cookie Policy"
      subtitle="The cookies and similar technologies we use, and how to opt out."
      lastUpdated="May 28, 2026"
      canonicalPath="/cookie-policy"
      toc={TOC}
    >
      <h2 id="what-are-cookies">What are cookies?</h2>
      <p>
        Cookies are small text files stored in your browser when you visit a website. They
        let us recognize your browser across requests so we can keep you signed in, remember
        your preferences, and measure how the site is used.
      </p>

      <h2 id="types">Cookies we use</h2>
      <h3>Strictly necessary</h3>
      <ul>
        <li>Authentication tokens (Convex Auth) &mdash; keep you signed in.</li>
        <li>Session cookies &mdash; secure form submissions and CSRF protection.</li>
        <li>Theme preference &mdash; remembers light/dark mode.</li>
      </ul>
      <h3>Analytics</h3>
      <ul>
        <li>Aggregated page-view counts &mdash; measure popular pages and detect outages.</li>
        <li>Performance metrics &mdash; identify slow pages and improve speed.</li>
      </ul>
      <h3>Marketing (only with consent)</h3>
      <ul>
        <li>Meta Pixel &mdash; if a campaign opts in to running ads, the Pixel measures conversions.</li>
        <li>TripleWhale &mdash; attribution for campaigns that connect ad accounts.</li>
      </ul>

      <h2 id="third-parties">Third-party cookies</h2>
      <p>
        Some cookies are set by services that power HopeBuilt:
      </p>
      <ul>
        <li><strong>Stripe</strong> &mdash; fraud detection on payment pages (required to take donations).</li>
        <li><strong>Google Fonts</strong> &mdash; serves the fonts used on the site.</li>
      </ul>

      <h2 id="controls">Your controls</h2>
      <p>
        Most browsers let you block or delete cookies through their settings. Blocking
        strictly-necessary cookies will break sign-in and payments. You can also opt out of
        analytics and marketing at any time by visiting your{" "}
        <a href="/dashboard">dashboard preferences</a>.
      </p>

      <h2 id="changes">Changes</h2>
      <p>
        We will update this list as we add or remove tools. Material changes will be
        announced alongside <a href="/privacy">privacy policy</a> updates.
      </p>

      <p className="mt-8">
        Questions? <a href="/contact">Contact us</a>.
      </p>
    </LegalPageLayout>
  );
}
