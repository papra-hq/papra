const MONTH_NAME_MAP: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

/**
 * Formats a Date object to YYYY-MM-DD string using local date parts
 * to avoid timezone offset shifts.
 */
export function formatDateToInputString(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) {
    return '';
  }

  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses user input string into a Date object.
 * Supports YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD (strictly requiring a 4-digit year >= 1000),
 * as well as supported ISO and text date formats.
 * Returns null if input is invalid or cannot be parsed into a real calendar date.
 */
export function parseDateInput(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (year >= 1000 && year <= 9999 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day);
      date.setFullYear(year);

      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return date;
      }
    }
    return null;
  }

  const timestamp = Date.parse(trimmed);
  if (!Number.isNaN(timestamp)) {
    // Check supported ISO 8601 format: YYYY-MM-DDTHH:mm:ss...
    const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/);
    if (isoMatch) {
      const year = Number(isoMatch[1]);
      const month = Number(isoMatch[2]);
      const day = Number(isoMatch[3]);

      if (year >= 1000 && year <= 9999 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        date.setFullYear(year);

        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
          return date;
        }
      }
      return null;
    }

    // Check supported "Month Day, Year" or "Month Day Year" format
    const textMatch = trimmed.match(/^([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
    if (textMatch) {
      const monthKey = textMatch[1].toLowerCase();
      const month = MONTH_NAME_MAP[monthKey];
      const day = Number(textMatch[2]);
      const year = Number(textMatch[3]);

      if (month && year >= 1000 && year <= 9999 && day >= 1 && day <= 31) {
        const date = new Date(year, month - 1, day);
        date.setFullYear(year);

        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
          return date;
        }
      }
      return null;
    }
  }

  return null;
}
