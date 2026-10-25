import { msk } from './format';

export type Season = 'newyear' | 'birthday' | null;

export const BIRTHDAY_NAME = 'Слава';
/** 10:00 Moscow time; only this year's birthday gets a push. */
export const BIRTHDAY_PUSH_AT = new Date('2026-11-16T10:00:00+03:00');

/** Festive theme for a Moscow calendar day: 16 November, or 25 December to 3 January. */
export function seasonAt(now: Date): Season {
  const d = msk(now);
  const month = d.getUTCMonth();
  const day = d.getUTCDate();
  if (month === 10 && day === 16) return 'birthday';
  if ((month === 11 && day >= 25) || (month === 0 && day <= 3)) return 'newyear';
  return null;
}

// shortcut: read once at app start, so a session running across midnight keeps yesterday's theme until the app restarts.
// EXPO_PUBLIC_SEASON=newyear|birthday previews a theme in development.
export const season: Season = (process.env.EXPO_PUBLIC_SEASON as Season | undefined) || seasonAt(new Date());
