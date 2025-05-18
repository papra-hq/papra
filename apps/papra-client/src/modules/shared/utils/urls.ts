import { buildUrl } from '@corentinth/chisels';
import { buildTimeConfig } from '@/modules/config/config';

export function createVitrineUrl({ path, baseUrl = buildTimeConfig.vitrineBaseUrl }: { path: string; baseUrl?: string }): string {
  return buildUrl({ path, baseUrl });
}
