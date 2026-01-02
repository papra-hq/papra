export function getSecretFromTotpUri({ totpUri }: { totpUri: string }): string {
  try {
    return new URL(totpUri).searchParams.get('secret') ?? '';
  } catch {
    return '';
  }
}
