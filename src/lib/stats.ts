import { bookingStart, msk } from './format';
import type { Booking } from './types';

const SESSION_MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2000];

export interface Totals {
  sessions: number;
  minutes: number;
  /** Rubles over sessions with a price. */
  earned: number;
  /** Sessions without a price yet. */
  unpriced: number;
}

export interface Stats {
  year: number;
  /** Current Moscow month, 0 = January. */
  month: number;
  /** Current year, January first. */
  months: Totals[];
  total: Totals;
  /** Accepted sessions still ahead this month. */
  upcoming: number;
  /** Latest reached and next session milestone. */
  milestone: { reached: number | null; next: number | null };
}

const empty = (): Totals => ({ sessions: 0, minutes: 0, earned: 0, unpriced: 0 });

function add(t: Totals, b: Booking) {
  t.sessions++;
  t.minutes += b.duration_minutes ?? 60;
  if (b.price == null) t.unpriced++;
  else t.earned += b.price;
}

/** Statistics over accepted sessions that already took place, in Moscow months. */
export function computeStats(bookings: Booking[], now = new Date()): Stats {
  const today = msk(now);
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const months = Array.from({ length: 12 }, empty);
  const total = empty();
  let upcoming = 0;

  for (const b of bookings) {
    if (b.status !== 'accepted') continue;
    const start = msk(bookingStart(b));
    const thisYear = start.getUTCFullYear() === year;
    if (new Date(bookingStart(b)) > now) {
      if (thisYear && start.getUTCMonth() === month) upcoming++;
      continue;
    }
    add(total, b);
    if (thisYear) add(months[start.getUTCMonth()], b);
  }

  return {
    year,
    month,
    months,
    total,
    upcoming,
    milestone: {
      reached: SESSION_MILESTONES.filter((n) => total.sessions >= n).at(-1) ?? null,
      next: SESSION_MILESTONES.find((n) => total.sessions < n) ?? null,
    },
  };
}
