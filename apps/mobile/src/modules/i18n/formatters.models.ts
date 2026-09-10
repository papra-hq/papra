export function createDateFormatter({ locale }: { locale: string }) {
  const defaultFormatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Custom options replace the defaults so dateStyle/timeStyle can also be used.
  return (date: Date, options?: Intl.DateTimeFormatOptions): string => {
    const formatter = options ? new Intl.DateTimeFormat(locale, options) : defaultFormatter;

    return formatter.format(date);
  };
}
