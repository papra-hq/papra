export const IN_MS = {
  SECOND: 1_000,
  MINUTE: 60_000, // 60 * 1_000
  HOUR: 3_600_000, // 60 * 60 * 1_000
  DAY: 86_400_000, // 24 * 60 * 60 * 1_000
  WEEK: 604_800_000, // 7 * 24 * 60 * 60 * 1_000
  MONTH: 2_630_016_000, // 30.44 * 24 * 60 * 60 * 1_000 -- approximation using average month length
  YEAR: 31_556_736_000, // 365.24 * 24 * 60 * 60 * 1_000 -- approximation using average year length
};
