export function coerceStripeTimestampToDate(timestamp: number) {
  return new Date(timestamp * 1000);
}
