import { expect, test } from '@jest/globals';

import { computeStats } from './stats';
import type { Booking } from './types';

const booking = (start: string, over: Partial<Booking> = {}): Booking => ({
  id: start,
  customer_name: 'Анна',
  customer_email: null,
  customer_phone: null,
  customer_telegram: null,
  service_type: 'relaxing',
  duration_minutes: 90,
  address: null,
  booking_start: start,
  status: 'accepted',
  note: null,
  created_at: start,
  slot: { id: 's', start_time: start, end_time: start, city: 'saint_petersburg' },
  ...over,
});

const now = new Date('2026-10-25T12:00:00Z');

test('counts accepted sessions per Moscow month', () => {
  const s = computeStats(
    [
      booking('2026-10-01T10:00:00Z'),
      booking('2026-10-31T22:30:00Z'), // 1 November in Moscow
      booking('2026-09-30T22:00:00Z'), // 1 October in Moscow
      booking('2026-10-05T10:00:00Z', { status: 'declined' }),
      booking('2026-09-10T10:00:00Z', { service_type: 'sports,relaxing' }),
    ],
    now,
  );
  expect(s.monthSessions).toBe(2);
  expect(s.monthHours).toBe(3);
  expect(s.prevMonthSessions).toBe(1);
  expect(s.yearByMonth[9]).toBe(2);
  expect(s.yearByMonth[10]).toBe(1);
  expect(s.totalSessions).toBe(4);
  expect(s.topService).toEqual({ name: 'Расслабляющий', count: 4 });
});

test('celebrates a record month and the latest session milestone', () => {
  const sept = Array.from({ length: 5 }, (_, i) => booking(`2026-09-0${i + 1}T10:00:00Z`));
  const oct = Array.from({ length: 6 }, (_, i) => booking(`2026-10-0${i + 1}T10:00:00Z`));
  const ids = computeStats([...sept, ...oct], now).milestones.map((m) => m.id);
  expect(ids).toEqual(['sessions-10', expect.stringMatching(/^record-/)]);
});

test('no record in the first month with data', () => {
  expect(computeStats([booking('2026-10-01T10:00:00Z')], now).milestones).toEqual([]);
});
