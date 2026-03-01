export function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function formatDate(date: Date, expression: string): string {
  return expression
    .replace(
      /\\?\{.*?\}/g,
      (key) => {
        if (key.startsWith('\\')) {
          return key.slice(1);
        }

        switch (key) {
          case '{yyyy}': return `${date.getFullYear()}`;
          case '{yy}': return `${date.getFullYear()}`.slice(-2);
          case '{MM}': return `${(date.getMonth() + 1)}`.padStart(2, '0');
          case '{dd}': return `${date.getDate()}`.padStart(2, '0');
          case '{HH}': return `${date.getHours()}`.padStart(2, '0');
          case '{mm}': return `${date.getMinutes()}`.padStart(2, '0');
          case '{ss}': return `${date.getSeconds()}`.padStart(2, '0');
          case '{SSS}': return `${date.getMilliseconds()}`.padStart(3, '0');
          case '{timestamp}': return `${date.getTime()}`;
          case '{unix}': return `${Math.floor(date.getTime() / 1000)}`;
          case '{iso}': return date.toISOString();
          default: return '';
        }
      },
    );
}
