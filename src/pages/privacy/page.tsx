import LegalPageLayout from "@/components/legal-page-layout.tsx";

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "information-we-collect", label: "Information we collect" },
  { id: "how-we-use", label: "How we use it" },
  { id: "sharing", label: "Sharing & sub-processors" },
  { id: "your-rights", label: "Your rights" },
  { id: "security", label: "Security & retention" },
  { id: "children", label: "Children's privacy" },
  { id: "changes", label: "Changes" },
  { id: "contact", label: "Contact" },
];

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Privacy Policy"
      subtitle="How HopeBuilt collects, uses, and protects your information."
      lastUpdated="May 28, 2026"
      canonicalPath="/privacy"
      toc={TOC}
    >
      <h2 id="overview">Overview</h2>
      <p>
        This Privacy Policy explains how Hope Built (&quot;HopeBuilt&quot;, &quot;we&quot;, &quot;us&quot;) collects, uses,
        and shares personal information when you visit our website, browse campaigns, donate,
        or create a fundraiser. By using HopeBuilt you agree to the practices described here.
      </p>
      <p>
        <strong>Note for legal review:</strong> this document is a starting template and must
        be reviewed by counsel before launch in each jurisdiction (GDPR, CCPA, PIPEDA, etc.).
      </p>

      <h2 id="information-we-collect">Information we collect</h2>
      <h3>Information you provide</h3>
      <ul>
        <li>Account details: name, email address, password (hashed), profile photo.</li>
        <li>Campaign details: fundraiser story, goal amount, recipient details, media uploads.</li>
        <li>Donation details: amount, payment method (processed by Stripe), billing address.</li>
        <li>Messages you send through the platform (campaign comments, support requests).</li>
      </ul>
      <h3>Information collected automatically</h3>
      <ul>
        <li>Device & browser metadata (user agent, IP, language).</li>
        <li>Pages viewed, referral source, interaction events.</li>
        <li>Cookies and similar technologies (see our <a href="/cookie-policy">Cookie Policy</a>).</li>
      </ul>

      <h2 id="how-we-use">How we use your information</h2>
      <ul>
        <li>To operate the platform — show campaigns, process donations, send receipts.</li>
        <li>To communicate with you — transactional emails, security notices, optional newsletters.</li>
        <li>To improve the product — diagnose bugs, measure performance, prevent abuse.</li>
        <li>To comply with legal obligations and tax reporting.</li>
      </ul>

      <h2 id="sharing">Sharing & sub-processors</h2>
      <p>
        We do not sell personal information. We share data only with vetted sub-processors
        that help us run the service:
      </p>
      <ul>
        <li><strong>Stripe</strong> — payment processing and fraud prevention.</li>
        <li><strong>Convex</strong> — application database and serverless functions.</li>
        <li><strong>Resend</strong> — transactional email delivery.</li>
        <li><strong>Meta (optional)</strong> — ads measurement, only when a campaign opts in.</li>
      </ul>
      <p>
        We may also disclose information when required by law, to protect our rights, or in a
        business transfer (e.g., acquisition).
      </p>

      <h2 id="your-rights">Your rights</h2>
      <p>
        Depending on where you live, you may have rights to access, correct, delete, or export
        your personal information, and to object to certain processing. To exercise these
        rights, email <a href="mailto:privacy@hopebuilt.org">privacy@hopebuilt.org</a> or use
        the controls in your <a href="/dashboard">dashboard</a>.
      </p>

      <h2 id="security">Security & retention</h2>
      <p>
        We protect your data with encryption in transit (TLS) and at rest, role-based access
        controls, and regular security reviews. We retain personal information for as long as
        your account is active and as required by tax and accounting laws.
      </p>

      <h2 id="children">Children&apos;s privacy</h2>
      <p>
        HopeBuilt is not directed to children under 13 (under 16 in the EEA/UK). We do not
        knowingly collect personal information from children. If you believe a child has
        shared data with us, contact us and we will delete it.
      </p>

      <h2 id="changes">Changes to this policy</h2>
      <p>
        We may update this policy from time to time. If we make material changes, we will
        notify you by email or through the app at least 30 days before they take effect.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        Questions? Email <a href="mailto:privacy@hopebuilt.org">privacy@hopebuilt.org</a> or
        write to us via <a href="/contact">our contact form</a>.
      </p>
    </LegalPageLayout>
  );
}
