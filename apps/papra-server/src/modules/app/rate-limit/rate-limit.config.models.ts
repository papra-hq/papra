import { isNil } from '../../shared/utils';
import { DURATION_UNIT_IN_MS, RATE_LIMIT_CONFIG_REGEX } from './rate-limit.config.constants';

export function parseRateLimitConfig(rateLimitConfig: string) {
  const match = rateLimitConfig.trim().match(RATE_LIMIT_CONFIG_REGEX);

  const makeInvalidFormatError = () =>
    new Error(
      `Invalid rate limit format: "${rateLimitConfig}". Expected formats like "10/h", "10/2h", "2/5m", etc.`,
    );

  if (!match) {
    throw makeInvalidFormatError();
  }

  const [, maxHitsStr, durationValueStr, durationUnit] = match;

  if (isNil(maxHitsStr) || isNil(durationValueStr) || isNil(durationUnit)) {
    // Shouldn't be possible due to regex, but for type safety
    throw makeInvalidFormatError();
  }

  const maxHits = Number.parseInt(maxHitsStr, 10);
  const durationValue = durationValueStr === '' ? 1 : Number.parseInt(durationValueStr, 10);

  if (Number.isNaN(maxHits) || Number.isNaN(durationValue)) {
    throw makeInvalidFormatError();
  }

  const durationUnitInMs = DURATION_UNIT_IN_MS[durationUnit.toLowerCase()];

  if (isNil(durationUnitInMs)) {
    // Shouldn't be possible due to regex, but for type safety
    throw makeInvalidFormatError();
  }

  const durationInMs = durationValue * durationUnitInMs;

  return {
    maxHits,
    window: Temporal.Duration.from({ milliseconds: durationInMs }),
  };
}
