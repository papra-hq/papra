export const DURATION_UNIT_IN_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
};

export const RATE_LIMIT_CONFIG_REGEX = new RegExp(
  `^(\\d+)\\/(\\d*)([${Object.keys(DURATION_UNIT_IN_MS).join('')}])$`,
  'i',
);

export const RATE_LIMIT_CONFIG_FORMAT_DOC =
  'Expected formats matching /^\\d+\\/\\d*[smh]$/, like "10/h", "10/2h", "2/5m", etc. For example "10/h" means 10 hits per hour, "10/2h" means 10 hits per 2 hours, "2/5m" means 2 hits per 5 minutes, etc. Units can be seconds (s), minutes (m) or hours (h).';
