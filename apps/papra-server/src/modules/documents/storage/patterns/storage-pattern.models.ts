import { isNilOrEmptyString } from '../../../shared/utils';

export function tokenizeStringArguments({ argumentsString }: { argumentsString: string | undefined }): string[] {
  if (isNilOrEmptyString(argumentsString)) {
    return [];
  }

  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < argumentsString.length) {
    const char = argumentsString[i];

    // Escaped quotes
    if (char === '\\' && i + 1 < argumentsString.length && argumentsString[i + 1] === '"') {
      current += '"';
      i += 2;
      continue;
    }

    if (char === '"') {
      if (!inQuotes && current.length > 0) {
        args.push(current);
        current = '';
      }
      inQuotes = !inQuotes;
      i++;
      continue;
    }

    if (char === ' ' && !inQuotes) {
      if (current.length > 0) {
        args.push(current);
        current = '';
      }
      i++;
      continue;
    }

    current += char;
    i++;
  }

  if (current.length > 0) {
    args.push(current);
  }

  return args;
}
