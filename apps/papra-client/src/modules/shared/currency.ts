export function formatAmountInCents({ amountInCents, currency = 'USD' }: { amountInCents: number; currency?: string }): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    currencyDisplay: 'symbol',
  }).format(amountInCents / 100);
}
