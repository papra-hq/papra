// Formats a date as e.g. "June 26, 2026", localized to the given locale.
export function formatDate(
  date: Date | string | number,
  { locale = 'en' }: { locale?: string } = {},
) {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}
