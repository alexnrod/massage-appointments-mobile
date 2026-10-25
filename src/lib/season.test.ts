import { expect, test } from '@jest/globals';

import { seasonAt } from './season';

test('birthday is 16 November in Moscow time', () => {
  expect(seasonAt(new Date('2026-11-15T21:00:00Z'))).toBe('birthday'); // 00:00 MSK on the 16th
  expect(seasonAt(new Date('2026-11-16T20:59:00Z'))).toBe('birthday');
  expect(seasonAt(new Date('2026-11-16T21:00:00Z'))).toBe(null);
});

test('new year runs from 25 December to 3 January inclusive', () => {
  expect(seasonAt(new Date('2026-12-24T20:59:00Z'))).toBe(null);
  expect(seasonAt(new Date('2026-12-24T21:00:00Z'))).toBe('newyear');
  expect(seasonAt(new Date('2027-01-03T20:00:00Z'))).toBe('newyear');
  expect(seasonAt(new Date('2027-01-03T21:00:00Z'))).toBe(null);
});
