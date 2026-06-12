import LegalPageLayout from "@/components/legal-page-layout.tsx";

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "eligibility", label: "When refunds apply" },
  { id: "how-to-request", label: "How to request" },
  { id: "timing", label: "Timing" },
  { id: "fraud", label: "Reporting fraud" },
  { id: "chargebacks", label: "Chargebacks" },
];

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      eyebrow="Legal"
      title="Refund Policy"
      subtitle="Donations are voluntary, but mistakes happen. Here's how refunds work on HopeBuilt."
      lastUpdated="May 28, 2026"
      canonicalPath="/refund-policy"
      toc={TOC}
    >
      <h2 id="overview">Overview</h2>
      <p>
        Donations made through HopeBuilt are voluntary contributions to a fundraiser. As a
        general rule, completed donations are final. We do, however, recognize that mistakes
        and exceptional situations occur, and we review refund requests case-by-case.
      </p>

      <h2 id="eligibility">When refunds apply</h2>
      <p>You may request a refund if:</p>
      <ul>
        <li>You donated the wrong amount (e.g., a typo turned $20 into $200).</li>
        <li>You were charged more than once for the same donation.</li>
        <li>The fundraiser was removed by HopeBuilt for policy violations.</li>
        <li>The campaign was confirmed by our team to be fraudulent.</li>
        <li>You request a refund within 14 days and funds have not yet been paid out to the fundraiser.</li>
      </ul>
      <p>
        Refunds are generally not available for completed campaigns where funds have already
        been disbursed to the recipient.
      </p>

      <h2 id="how-to-request">How to request a refund</h2>
      <ol>
        <li>Sign in to your <a href="/dashboard">donor dashboard</a>.</li>
        <li>Find the donation in your history and click &quot;Request refund&quot;.</li>
        <li>Provide a short reason — this helps us route the request.</li>
        <li>Our team will respond within 3 business days.</li>
      </ol>
      <p>
        Don&apos;t have an account? <a href="/contact">Contact us</a> with your donation
        receipt number.
      </p>

      <h2 id="timing">Refund timing</h2>
      <p>
        Approved refunds are returned to the original payment method via Stripe. Most refunds
        appear within 5&ndash;10 business days, depending on your bank.
      </p>

      <h2 id="fraud">Suspect a fraudulent campaign?</h2>
      <p>
        If you believe a campaign is misrepresenting itself or misusing donations,{" "}
        <a href="/report-issue">report the campaign</a>. Confirmed fraud cases are eligible
        for full refunds and we will pursue recovery of disbursed funds where possible.
      </p>

      <h2 id="chargebacks">Chargebacks</h2>
      <p>
        Initiating a chargeback through your bank for a donation that is otherwise eligible
        for refund slows down resolution for everyone. Please contact us first &mdash; we are
        usually able to resolve the issue faster than the chargeback process.
      </p>

      <p className="mt-8">
        Questions? <a href="/contact">Contact us</a>.
      </p>
    </LegalPageLayout>
  );
}
