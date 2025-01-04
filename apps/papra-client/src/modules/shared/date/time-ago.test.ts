import { describe, expect, test } from 'vitest';
import { timeAgo } from './time-ago';

describe('time-ago', () => {
  describe('timeAgo', () => {
    test('formats the relative time', () => {
      expect(timeAgo({ date: new Date('2021-01-01T00:00:00Z'), now: new Date('2021-01-01T00:00:00Z') })).toBe('just now');
      expect(timeAgo({ date: new Date('2021-01-01T00:00:00Z'), now: new Date('2021-01-01T00:00:06Z') })).toBe('a few seconds ago');
      expect(timeAgo({ date: new Date('2021-01-01T00:00:00Z'), now: new Date('2021-01-01T00:01:00Z') })).toBe('a minute ago');
      expect(timeAgo({ date: new Date('2021-01-01T00:00:00Z'), now: new Date('2021-01-01T00:02:00Z') })).toBe('2 minutes ago');
      expect(timeAgo({ date: new Date('2021-01-01T00:00:00Z'), now: new Date('2021-01-01T01:00:00Z') })).toBe('an hour ago');
      expect(timeAgo({ date: new Date('2021-01-01T00:00:00Z'), now: new Date('2021-01-01T02:00:00Z') })).toBe('2 hours ago');
      expect(timeAgo({ date: new Date('2021-01-01T00:00:00Z'), now: new Date('2021-01-02T00:00:00Z') })).toBe('a day ago');
      expect(timeAgo({ date: new Date('2021-01-01T00:00:00Z'), now: new Date('2021-01-03T00:00:00Z') })).toBe('2 days ago');
      expect(timeAgo({ date: new Date('2021-01-01T00:00:00Z'), now: new Date('2021-02-01T00:00:00Z') })).toBe('a month ago');
      expect(timeAgo({ date: new Date('2021-01-01T00:00:00Z'), now: new Date('2021-03-02T00:00:00Z') })).toBe('2 months ago');
      expect(timeAgo({ date: new Date('2021-01-01T00:00:00Z'), now: new Date('2022-01-01T00:00:00Z') })).toBe('a year ago');
      expect(timeAgo({ date: new Date('2021-01-01T00:00:00Z'), now: new Date('2023-01-01T00:00:00Z') })).toBe('2 years ago');
    });

    test('the date can be a parsable string', () => {
      expect(timeAgo({ date: '2021-01-01T00:00:00Z', now: new Date('2021-01-01T00:00:00Z') })).toBe('just now');
      expect(timeAgo({ date: '2021-01-01T00:00:00Z', now: new Date('2021-03-02T00:00:00Z') })).toBe('2 months ago');
    });
  });
});
