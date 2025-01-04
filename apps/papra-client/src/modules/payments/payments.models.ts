export function getIsRenderingQuotaReached({ maxRenderingsPerMonth, renderingsCount }: { maxRenderingsPerMonth: number; renderingsCount: number }) {
  return renderingsCount >= maxRenderingsPerMonth;
}
