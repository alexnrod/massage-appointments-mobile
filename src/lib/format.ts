import type { Booking } from './types';

// Moscow has been UTC+3 all year since 2014, so a fixed offset is exact and avoids Intl time-zone support.
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

export const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
export const MONTHS_NOMINATIVE = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
export const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const SERVICE_LABELS: Record<string, string> = {
  sound_massage: 'Вибрационно-акустический',
  relaxing: 'Расслабляющий',
  anticellulite: 'Антицеллюлитный',
  sports: 'Спортивный',
};

export const CITY_LABELS: Record<string, string> = {
  saint_petersburg: 'Санкт-Петербург',
  gatchina: 'Гатчина',
};

/** A Date whose UTC fields read as Moscow wall-clock time. */
export function msk(iso: string | Date): Date {
  return new Date(new Date(iso).getTime() + MSK_OFFSET_MS);
}

/** `YYYY-MM-DD` of the Moscow calendar day. */
export function dayKey(iso: string | Date): string {
  return msk(iso).toISOString().slice(0, 10);
}

/** ISO instant for a Moscow date and `HH:MM`. */
export function mskIso(key: string, hhmm: string): string {
  return new Date(`${key}T${hhmm}:00+03:00`).toISOString();
}

export function time(iso: string): string {
  return msk(iso).toISOString().slice(11, 16);
}

export function dayLabel(iso: string | Date): string {
  const d = msk(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}, ${WEEKDAYS[d.getUTCDay()]}`;
}

export function bookingStart(b: Booking): string {
  return b.booking_start ?? b.slot.start_time;
}

export function services(serviceType: string | null): string {
  if (!serviceType) return 'Массаж';
  return serviceType
    .split(',')
    .map((s) => SERVICE_LABELS[s.trim()] ?? s.trim())
    .join(', ');
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
