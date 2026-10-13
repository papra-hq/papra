import type { Config } from '../config/config.types';

export function isAutoProcessingEnabled({ config }: { config: Config }) {
  return (
    config.ai.isEnabled &&
    (config.autoTagging.isEnabled ||
      config.autoNaming.isEnabled ||
      config.autoDocumentDate.isEnabled)
  );
}
