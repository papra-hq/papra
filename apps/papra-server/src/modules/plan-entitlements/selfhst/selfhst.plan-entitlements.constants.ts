export const SELFHST_ENTITLEMENT_NAME = 'selfhst-premium';

// Validity window granted on claim and rolled forward by the periodic
// re-verification task; a lapsed selfh.st subscription expires naturally.
// Temporal.Instant does not support calendar units, hence hours.
export const SELFHST_ENTITLEMENT_CLAIM_VALIDITY_DURATION: Temporal.DurationLike = {
  hours: 45 * 24,
};

// Once selfh.st confirms a user is no longer premium, their entitlement
// expiration is capped to this grace period instead of the full validity
// window, long enough to absorb billing hiccups on selfh.st's side
export const SELFHST_ENTITLEMENT_INELIGIBILITY_GRACE_DURATION: Temporal.DurationLike = {
  hours: 7 * 24,
};
