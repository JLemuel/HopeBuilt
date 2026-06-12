/**
 * Returns the displayed raised amount for a campaign.
 *
 * The backend `getBySlug` query already computes the total from
 * simulated donors + real donations, so we simply return currentAmount.
 */
export function getDisplayedAmount(campaign: {
  currentAmount: number;
}): number {
  return campaign.currentAmount;
}

/**
 * Formats a number into a compact string (e.g. 60000 → "$60k", 1500000 → "$1.5M").
 */
export function formatCompactAmount(amount: number): string {
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return `$${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const val = amount / 1_000;
    return `$${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}k`;
  }
  return `$${amount.toLocaleString()}`;
}
