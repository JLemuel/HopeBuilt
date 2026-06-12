import LegalPageLayout from "@/components/legal-page-layout.tsx";

const TOC = [
  { id: "acceptance", label: "Acceptance" },
  { id: "eligibility", label: "Eligibility" },
  { id: "fundraisers", label: "Fundraiser obligations" },
  { id: "donors", label: "Donor terms" },
  { id: "fees", label: "Fees & payouts" },
  { id: "prohibited", label: "Prohibited use" },
  { id: "content", label: "User content" },
  { id: "termination", label: "Termination" },
  { id: "disclaimers", label: "Disclaimers" },
  { id: "disputes", label: "Disputes" },
  { id: "changes", label: "Changes" },
];

export default function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Terms of Service"
      subtitle="The rules of the road for using HopeBuilt as a fundraiser or donor."
      lastUpdated="May 28, 2026"
      canonicalPath="/terms"
      toc={TOC}
    >
      <p>
        <strong>Note for legal review:</strong> this is a starting template and must be
        reviewed by counsel before public launch.
      </p>

      <h2 id="acceptance">1. Acceptance of these terms</h2>
      <p>
        By creating an account, starting a campaign, or making a donation on HopeBuilt, you
        agree to be bound by these Terms of Service and our{" "}
        <a href="/privacy">Privacy Policy</a>. If you do not agree, do not use the platform.
      </p>

      <h2 id="eligibility">2. Eligibility</h2>
      <p>
        You must be at least 18 years old (or the age of majority in your jurisdiction) and
        able to enter into binding contracts to use HopeBuilt. Fundraisers acting on behalf
        of an organization must have authority to bind that organization.
      </p>

      <h2 id="fundraisers">3. Fundraiser obligations</h2>
      <ul>
        <li>Provide truthful, accurate, and complete information about the cause, recipient, and intended use of funds.</li>
        <li>Use raised funds only for the purpose described in your campaign.</li>
        <li>Promptly deliver funds to the named beneficiary if you are fundraising on someone else&apos;s behalf.</li>
        <li>Comply with all applicable laws, including tax reporting requirements.</li>
        <li>Respond to donor questions and platform requests for information in good faith.</li>
      </ul>

      <h2 id="donors">4. Donor terms</h2>
      <p>
        Donations are voluntary contributions, not purchases. HopeBuilt is a platform — we do
        not control how funds are used by individual fundraisers. Read each campaign carefully
        before donating. If you believe a campaign is fraudulent, please{" "}
        <a href="/report-issue">report it</a>.
      </p>

      <h2 id="fees">5. Fees, processing & payouts</h2>
      <p>
        HopeBuilt charges a platform fee on each donation; payment processing fees are
        collected separately by Stripe. Fees are disclosed before you complete a donation.
        Payouts to fundraisers occur on a regular schedule once Stripe verifies the recipient
        account.
      </p>

      <h2 id="prohibited">6. Prohibited use</h2>
      <p>You may not use HopeBuilt to:</p>
      <ul>
        <li>Solicit funds for hate speech, harassment, violence, or illegal activity.</li>
        <li>Run campaigns based on misleading or false claims.</li>
        <li>Bypass platform fees or move donors off-platform after they pledge.</li>
        <li>Upload malware, phishing content, or sexually explicit material.</li>
        <li>Infringe intellectual property or privacy rights.</li>
      </ul>

      <h2 id="content">7. User content</h2>
      <p>
        You keep ownership of the content you post (campaign stories, photos, videos). By
        posting, you grant HopeBuilt a worldwide, royalty-free license to display, distribute,
        and promote that content as needed to operate and market the platform.
      </p>

      <h2 id="termination">8. Suspension & termination</h2>
      <p>
        We may suspend or remove campaigns, withhold payouts, or close accounts that violate
        these terms or that we reasonably suspect of fraud or abuse. You may close your
        account at any time from your <a href="/dashboard">dashboard</a>.
      </p>

      <h2 id="disclaimers">9. Disclaimers & limitation of liability</h2>
      <p>
        The platform is provided &quot;as is&quot; without warranty. To the maximum extent
        permitted by law, HopeBuilt is not liable for indirect, incidental, or consequential
        damages arising from your use of the service.
      </p>

      <h2 id="disputes">10. Disputes & governing law</h2>
      <p>
        These terms are governed by the laws of <em>[TODO: jurisdiction]</em>. Disputes will
        be resolved by binding arbitration where permitted, otherwise in the courts of{" "}
        <em>[TODO: venue]</em>.
      </p>

      <h2 id="changes">11. Changes to these terms</h2>
      <p>
        We may update these terms periodically. Material changes will be announced by email
        or in-app notice at least 30 days before they take effect.
      </p>

      <p className="mt-8">
        Questions? <a href="/contact">Contact us</a>.
      </p>
    </LegalPageLayout>
  );
}
