export function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}
