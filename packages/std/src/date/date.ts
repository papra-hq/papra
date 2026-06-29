export function getDateValue(value: string, now: Date): Date {
  let clean = value.trim();

  // Strip outer matching parentheses if present
  if (clean.startsWith('(') && clean.endsWith(')')) {
    clean = clean.slice(1, -1).trim();
  }

  // Check if it starts with "now" (either exact "now" or "now.") or "now" followed by space/operator
  if (clean === 'now') {
    return now;
  }

  if (clean.startsWith('now')) {
    let baseDate = new Date(now);
    let remaining = '';

    if (clean === 'now.year') {
      baseDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      remaining = '';
    } else if (clean.startsWith('now.year')) {
      baseDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      remaining = clean.slice('now.year'.length).trim();
    } else if (clean === 'now.month') {
      baseDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      remaining = '';
    } else if (clean.startsWith('now.month')) {
      baseDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      remaining = clean.slice('now.month'.length).trim();
    } else if (clean === 'now.day') {
      baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      remaining = '';
    } else if (clean.startsWith('now.day')) {
      baseDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      remaining = clean.slice('now.day'.length).trim();
    } else {
      remaining = clean.slice('now'.length).trim();
    }

    // Now process any method calls or arithmetic modifications on baseDate
    let current = baseDate;

    // We can repeatedly parse modifiers
    while (remaining.length > 0) {
      // 1. Match method chain, e.g> .minusYear(1), .plusDays(5), etc.
      const methodMatch = remaining.match(/^\.(minus|plus)(Year|Month|Week|Day)s?\(\s*(\d+)\s*\)/i);
      if (methodMatch) {
        const [fullMatch, operation, unit, quantityStr] = methodMatch;
        const quantity = parseInt(quantityStr, 10);
        const direction = operation.toLowerCase() === 'minus' ? -1 : 1;
        current = applyUnitModifier(current, unit.toLowerCase(), quantity * direction);
        remaining = remaining.slice(fullMatch.length).trim();
        continue;
      }

      // 2. Match arithmetic operator at the start of remaining: e.g> - 1y, + 2m, -30d
      const arithmeticMatch = remaining.match(/^([+-])\s*(\d+)\s*([ymwd])/i);
      if (arithmeticMatch) {
        const [fullMatch, operator, quantityStr, unit] = arithmeticMatch;
        const quantity = parseInt(quantityStr, 10);
        const direction = operator === '-' ? -1 : 1;
        current = applyUnitModifier(current, unit.toLowerCase(), quantity * direction);
        remaining = remaining.slice(fullMatch.length).trim();
        continue;
      }

      // If we cannot match any known pattern, we break to avoid infinite loop
      break;
    }

    return current;
  }

  return new Date(value);
}

function applyUnitModifier(date: Date, unit: string, amount: number): Date {
  const result = new Date(date);
  const normalizedUnit = unit.toLowerCase();
  if (normalizedUnit === 'year' || normalizedUnit === 'y') {
    result.setFullYear(result.getFullYear() + amount);
  } else if (normalizedUnit === 'month' || normalizedUnit === 'm') {
    result.setMonth(result.getMonth() + amount);
  } else if (normalizedUnit === 'week' || normalizedUnit === 'w') {
    result.setDate(result.getDate() + amount * 7);
  } else if (normalizedUnit === 'day' || normalizedUnit === 'd') {
    result.setDate(result.getDate() + amount);
  }
  return result;
}
