import { bookingStart, msk, services } from './format';
import type { Booking } from './types';

const SESSION_MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2000];

export interface Milestone {
  id: string;
  emoji: string;
  title: string;
}

export interface Stats {
  monthSessions: number;
  monthHours: number;
  prevMonthSessions: number;
  /** Accepted sessions per month of the current year, January first. */
  yearByMonth: number[];
  totalSessions: number;
  topService: { name: string; count: number } | null;
  milestones: Milestone[];
}

const monthIndex = (d: Date) => d.getUTCFullYear() * 12 + d.getUTCMonth();

/** Statistics over accepted bookings, in Moscow months. */
export function computeStats(bookings: Booking[], now = new Date()): Stats {
  const accepted = bookings.filter((b) => b.status === 'accepted');
  const current = monthIndex(msk(now));
  const year = msk(now).getUTCFullYear();

  const perMonth = new Map<number, number>();
  const serviceCounts = new Map<string, number>();
  let monthMinutes = 0;
  for (const b of accepted) {
    const start = msk(bookingStart(b));
    const m = monthIndex(start);
    perMonth.set(m, (perMonth.get(m) ?? 0) + 1);
    if (m === current) monthMinutes += b.duration_minutes ?? 60;
    for (const s of (b.service_type ?? '').split(',').filter(Boolean)) {
      serviceCounts.set(s.trim(), (serviceCounts.get(s.trim()) ?? 0) + 1);
    }
  }

  const monthSessions = perMonth.get(current) ?? 0;
  const yearByMonth = Array.from({ length: 12 }, (_, i) => perMonth.get(year * 12 + i) ?? 0);

  const milestones: Milestone[] = [];
  const reached = SESSION_MILESTONES.filter((n) => accepted.length >= n).at(-1);
  if (reached) milestones.push({ id: `sessions-${reached}`, emoji: '🏆', title: `${reached} сеансов за всё время` });
  const previousBest = Math.max(0, ...[...perMonth].filter(([m]) => m < current).map(([, n]) => n));
  if (monthSessions > previousBest && previousBest > 0) {
    milestones.push({ id: `record-${current}-${monthSessions}`, emoji: '🚀', title: `Рекордный месяц: ${monthSessions} сеансов` });
  }

  const top = [...serviceCounts].sort((a, b) => b[1] - a[1])[0];

  return {
    monthSessions,
    monthHours: Math.round((monthMinutes / 60) * 10) / 10,
    prevMonthSessions: perMonth.get(current - 1) ?? 0,
    yearByMonth,
    totalSessions: accepted.length,
    topService: top ? { name: services(top[0]), count: top[1] } : null,
    milestones,
  };
}
