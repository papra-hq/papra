export type Clock = {
  now: () => Temporal.Instant;
};

export type TestClock = Clock & {
  setNow: (instant: Temporal.InstantLike) => void;
  advanceBy: (duration: Temporal.DurationLike) => void;
};
