import { buildTimeConfig } from '@/modules/config/config';
import { buildUrl } from '@corentinth/chisels';

export function createVitrineUrl({ path, baseUrl = buildTimeConfig.vitrineBaseUrl }: { path: string; baseUrl?: string }): string {
  return buildUrl({ path, baseUrl });
}
