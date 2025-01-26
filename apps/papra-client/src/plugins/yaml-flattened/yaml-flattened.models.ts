import { parse } from 'yaml';

function flattenObject(
  obj: Record<string, any>,
  parentKeys: string[] = [],
  result: Record<string, string> = {},
): Record<string, string> {
  for (const key in obj) {
    const newKey = [...parentKeys, key];
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      flattenObject(obj[key], newKey, result);
    } else {
      result[newKey.join('.')] = obj[key];
    }
  }
  return result;
}

export function flattenYaml({ code }: { code: string }): Record<string, string> {
  const parsed = parse(code);
  const flattenedData = flattenObject(parsed);

  return flattenedData;
}
