import { expect, test } from '@jest/globals';

import { duration, hours, rub } from './format';
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
  price: 3000,
  created_at: start,
  slot: { id: 's', start_time: start, end_time: start, city: 'saint_petersburg' },
  ...over,
});

const now = new Date('2026-10-25T12:00:00Z');

test('sums past accepted sessions per Moscow month and counts the rest of the month as upcoming', () => {
  const s = computeStats(
    [
      booking('2026-10-01T10:00:00Z'),
      booking('2026-10-10T10:00:00Z', { price: null, duration_minutes: null }),
      booking('2026-09-30T22:00:00Z'), // 1 October in Moscow
      booking('2026-10-05T10:00:00Z', { status: 'declined' }),
      booking('2026-10-28T10:00:00Z'), // ahead this month
      booking('2026-10-31T22:30:00Z'), // 1 November in Moscow, ahead
      booking('2025-12-10T10:00:00Z', { price: 5000 }),
    ],
    now,
  );
  expect(s.month).toBe(9);
  expect(s.months[9]).toEqual({ sessions: 3, minutes: 240, earned: 6000, unpriced: 1 });
  expect(s.months[10].sessions).toBe(0);
  expect(s.upcoming).toBe(1);
  expect(s.total).toEqual({ sessions: 4, minutes: 330, earned: 11000, unpriced: 1 });
});

test('reports the latest reached and the next session milestone', () => {
  const many = Array.from({ length: 12 }, (_, i) => booking(`2026-09-${String(i + 1).padStart(2, '0')}T10:00:00Z`));
  expect(computeStats(many, now).milestone).toEqual({ reached: 10, next: 25 });
  expect(computeStats([], now).milestone).toEqual({ reached: null, next: 10 });
});

test('formats rubles and durations', () => {
  expect(rub(12500)).toBe('12 500 ₽');
  expect(hours(90)).toBe('1,5 ч');
  expect(duration(70)).toBe('1 ч 10 мин');
  expect(duration(45)).toBe('45 мин');
});
