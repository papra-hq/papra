import { bench, describe } from 'vitest';

function formatWithSwitch(date: Date, exp: string): string {
  return exp.replace(/\\?\{.*?\}/g, (key) => {
    if (key.startsWith('\\')) {
      return key.slice(1);
    }

    switch (key) {
      case '{yyyy}':
        return `${date.getFullYear()}`;
      case '{yy}':
        return `${date.getFullYear()}`.slice(-2);
      case '{MM}':
        return `${(date.getMonth() + 1)}`.padStart(2, '0');
      case '{dd}':
        return `${date.getDate()}`.padStart(2, '0');
      case '{HH}':
        return `${date.getHours()}`.padStart(2, '0');
      case '{mm}':
        return `${date.getMinutes()}`.padStart(2, '0');
      case '{ss}':
        return `${date.getSeconds()}`.padStart(2, '0');
      case '{SSS}':
        return `${date.getMilliseconds()}`.padStart(3, '0');
      default:
        return '';
    }
  });
}

const formatters: Record<string, (date: Date) => string> = {
  '{yyyy}': date => `${date.getFullYear()}`,
  '{yy}': date => `${date.getFullYear()}`.slice(-2),
  '{MM}': date => `${(date.getMonth() + 1)}`.padStart(2, '0'),
  '{dd}': date => `${date.getDate()}`.padStart(2, '0'),
  '{HH}': date => `${date.getHours()}`.padStart(2, '0'),
  '{mm}': date => `${date.getMinutes()}`.padStart(2, '0'),
  '{ss}': date => `${date.getSeconds()}`.padStart(2, '0'),
  '{SSS}': date => `${date.getMilliseconds()}`.padStart(3, '0'),
};

export function formatWithLut(date: Date, exp: string): string {
  return exp.replace(/\\?\{.*?\}/g, (key) => {
    if (key.startsWith('\\')) {
      return key.slice(1);
    }

    return formatters[key]?.(date) ?? '';
  });
}

describe.skip('date formatting', () => {
  const date = new Date();
  const exp = '{yyyy}-{MM}-{dd} {HH}:{mm}:{ss}.{SSS}';

  bench('formatWithLut', () => {
    const result = formatWithLut(date, exp);
    void result;
  });

  bench('formatWithSwitch', () => {
    const result = formatWithSwitch(date, exp);
    void result;
  });
});
