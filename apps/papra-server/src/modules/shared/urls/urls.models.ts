export function getUrlHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
