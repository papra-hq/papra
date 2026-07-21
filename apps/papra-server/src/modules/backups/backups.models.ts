import type { BackupSchedule } from './backups.types';

// Finds the next Date (>= `from`) matching the schedule's days-of-week + time.
// Server-local time throughout — kept simple deliberately (see backups.config.ts
// doc comment); if you run the server in a different timezone than you want
// backups scheduled in, that's a config concern, not something the picker needs
// to model.
export function computeNextScheduledAt({
  schedule,
  from,
}: {
  schedule: BackupSchedule;
  from: Date;
}): Date | null {
  if (!schedule.isEnabled) {
    return null;
  }

  const hour = schedule.hour ?? 3;
  const minute = schedule.minute ?? 0;
  const days = schedule.days.length > 0 ? schedule.days : [0, 1, 2, 3, 4, 5, 6];

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(from);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(hour, minute, 0, 0);

    if (candidate <= from) {
      continue;
    }
    if (days.includes(candidate.getDay())) {
      return candidate;
    }
  }

  // Unreachable in practice (checked a full week), but keep the type honest.
  return null;
}

export function parseScheduleDays(scheduleDaysJson: string): number[] {
  try {
    const parsed = JSON.parse(scheduleDaysJson) as unknown;
    if (
      Array.isArray(parsed) &&
      parsed.every((d): d is number => typeof d === 'number' && d >= 0 && d <= 6)
    ) {
      return parsed;
    }
  } catch {
    // fall through
  }
  return [];
}
