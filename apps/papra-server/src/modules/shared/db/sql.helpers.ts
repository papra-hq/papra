export function escapeLikeWildcards(input: string): string {
  return input.replace(/\\/g, '\\\\').replace(/[%_]/g, '\\$&');
}
