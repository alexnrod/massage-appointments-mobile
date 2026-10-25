import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { bookingStart, duration, hours, MONTHS_NOMINATIVE, MONTHS_SHORT, msk, plural, rub } from '@/lib/format';
import { BIRTHDAY_NAME, season } from '@/lib/season';
import { markMilestonesSeen, seenMilestones } from '@/lib/settings';
import { computeStats, type Totals } from '@/lib/stats';
import type { Booking } from '@/lib/types';
import { useApi } from '@/lib/useApi';
import { Card, OfflineBanner, SectionLabel } from '@/ui/primitives';
import { colors, font, radius, spacing } from '@/ui/theme';

const sessions = (n: number) => plural(n, 'сеанс', 'сеанса', 'сеансов');

const METRICS = [
  { key: 'sessions', title: 'Сеансы', value: (t: Totals) => t.sessions, label: (t: Totals) => `${t.sessions}` },
  { key: 'hours', title: 'Часы', value: (t: Totals) => t.minutes, label: (t: Totals) => `${Math.round(t.minutes / 60)}` },
  { key: 'earned', title: 'Заработано', value: (t: Totals) => t.earned, label: (t: Totals) => compactRub(t.earned) },
] as const;

// Twelve bars leave about 26 px per label: 12 500 ₽ becomes "13к", 2 500 ₽ "2,5к".
const compactRub = (n: number) =>
  n >= 10000 ? `${Math.round(n / 1000)}к` : n >= 1000 ? `${String(Math.round(n / 100) / 10).replace('.', ',')}к` : `${n}`;

export default function StatsScreen() {
  const { data = [], error, loading, refresh } = useApi<Booking[]>('/api/admin/bookings');
  const [seen] = useState(seenMilestones);
  const s = computeStats(data);
  const [selected, setSelected] = useState(s.month);
  const [metricIndex, setMetricIndex] = useState(0);
  const metric = METRICS[metricIndex];

  const cur = s.months[s.month];
  const sel = s.months[selected];
  const values = s.months.map(metric.value);
  const max = Math.max(...values);
  const day = msk(new Date()).getUTCDate();
  const phase = day <= 10 ? 'только начался' : day <= 20 ? 'в разгаре' : 'на финише';

  const milestoneId = s.milestone.reached ? `sessions-${s.milestone.reached}` : '';
  const isNew = !!milestoneId && !seen.includes(milestoneId);
  // Remember what was celebrated; the animation plays once per milestone.
  useEffect(() => {
    if (milestoneId) markMilestonesSeen([...new Set([...seenMilestones(), milestoneId])]);
  }, [milestoneId]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} colors={[colors.accent]} />}>
      <OfflineBanner error={error} />
      {season === 'birthday' ? (
        <Animated.View entering={ZoomIn.springify().damping(8)} style={styles.birthday}>
          <Text style={styles.festiveEmoji}>🎂🎈</Text>
          <Text style={styles.birthdayTitle}>С днём рождения, {BIRTHDAY_NAME}!</Text>
          <Text style={styles.birthdayText}>Спасибо за этот год</Text>
          <Text style={styles.birthdayNumber}>{acceptedSinceBirthday(data)}</Text>
          <Text style={styles.birthdayText}>заявок принято с прошлого дня рождения 💛</Text>
        </Animated.View>
      ) : season === 'newyear' ? (
        <View style={styles.row}>
          <Text style={[font.title, styles.flex]}>
            {s.month === 11 ? 'С наступающим' : 'С Новым годом'}, <Text style={{ color: colors.gold }}>{BIRTHDAY_NAME}!</Text>
          </Text>
          <Text style={styles.festiveEmoji}>🎄</Text>
        </View>
      ) : null}

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>
          {MONTHS_NOMINATIVE[s.month].toUpperCase()} · {phase.toUpperCase()}
        </Text>
        <Text style={styles.heroNumber} adjustsFontSizeToFit numberOfLines={1}>
          {rub(cur.earned)}
        </Text>
        <Text style={styles.heroText}>
          {cur.sessions} {sessions(cur.sessions)} · {hours(cur.minutes)} массажа
        </Text>
        <View style={styles.heroNote}>
          <View style={styles.iconCircle}>
            <SymbolView name={{ ios: 'calendar', android: 'calendar_month' }} tintColor={colors.accent} size={18} />
          </View>
          <Text style={[font.body, styles.flex]}>{monthNote(s.upcoming, cur.sessions, s.months[s.month - 1]?.sessions, s.month)}</Text>
        </View>
      </View>

      {s.milestone.next !== null || s.milestone.reached !== null ? (
        <Animated.View entering={isNew ? ZoomIn.springify().damping(9) : undefined}>
          <Card style={[styles.milestone, isNew && styles.milestoneNew]}>
            <View style={styles.row}>
              <View style={[styles.iconCircle, styles.starCircle]}>
                <SymbolView name={{ ios: 'star.fill', android: 'star' }} tintColor={colors.gold} size={24} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.milestoneLabel}>
                  {s.milestone.reached === null ? 'ПЕРВАЯ ЦЕЛЬ' : isNew ? 'НОВОЕ ДОСТИЖЕНИЕ' : 'ДОСТИЖЕНИЕ'}
                </Text>
                <Text style={font.heading}>
                  {s.milestone.reached === null ? `${s.milestone.next} сеансов` : `${s.milestone.reached} сеансов за всё время`}
                </Text>
              </View>
            </View>
            {s.milestone.next !== null && (
              <>
                <View style={styles.row}>
                  <Text style={[font.secondary, styles.flex]}>
                    До «{s.milestone.next} сеансов» осталось {nextLeft(s.total.sessions, s.milestone.next)}
                  </Text>
                  <Text style={styles.progressCount}>
                    {s.total.sessions}/{s.milestone.next}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${(s.total.sessions / s.milestone.next) * 100}%` }]} />
                </View>
              </>
            )}
          </Card>
        </Animated.View>
      ) : null}

      <SectionLabel>{s.year} по месяцам</SectionLabel>
      <Card style={styles.noPadding}>
        <View style={styles.section}>
          <View style={styles.segments}>
            {METRICS.map((m, i) => (
              <Pressable
                key={m.key}
                accessibilityRole="button"
                accessibilityState={{ selected: i === metricIndex }}
                onPress={() => setMetricIndex(i)}
                style={[styles.segment, i === metricIndex && styles.segmentOn]}>
                <Text style={[styles.segmentText, i === metricIndex && styles.segmentTextOn]}>{m.title}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.chart}>
            {s.months.map((t, i) => {
              const on = i === selected;
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${MONTHS_NOMINATIVE[i]}: ${metric.label(t)}`}
                  onPress={() => setSelected(i)}
                  style={styles.barColumn}>
                  <View style={[styles.barArea, on && styles.barAreaOn]}>
                    <Text style={[styles.barValue, on && styles.barValueOn]} numberOfLines={1}>
                      {values[i] > 0 ? metric.label(t) : ''}
                    </Text>
                    <View
                      style={[
                        styles.bar,
                        { height: `${max ? (values[i] / max) * 80 : 0}%`, backgroundColor: on ? colors.accent : colors.accentSoft },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, i === s.month && styles.barLabelNow, on && styles.barLabelOn]}>{MONTHS_SHORT[i]}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[font.secondary, styles.center]}>Нажмите на месяц, чтобы увидеть подробности</Text>
        </View>

        <View style={[styles.section, styles.divider]}>
          <Text style={styles.monthTitle}>{MONTHS_NOMINATIVE[selected]}</Text>
          {max > 0 && values[selected] === max && (
            <View style={styles.badge}>
              <SymbolView name={{ ios: 'star.fill', android: 'star' }} tintColor={colors.gold} size={14} />
              <Text style={styles.badgeText}>Лучший месяц года!</Text>
            </View>
          )}
          <View style={styles.earned}>
            <View style={styles.flex}>
              <Text style={font.secondary}>Заработано</Text>
              <Text style={styles.earnedNumber}>{rub(sel.earned)}</Text>
              {sel.unpriced > 0 && (
                <Text style={font.secondary}>
                  Без стоимости: {sel.unpriced} {sessions(sel.unpriced)}. Её можно добавить в заявке.
                </Text>
              )}
            </View>
            <View style={[styles.iconCircle, styles.earnedIcon]}>
              <SymbolView name={{ ios: 'chart.bar.fill', android: 'insights' }} tintColor={colors.accent} size={22} />
            </View>
          </View>
          <View style={styles.row}>
            <Tile value={`${sel.sessions}`} label={sessions(sel.sessions)} />
            <Tile value={hours(sel.minutes)} label="массажа" />
            <Tile value={sel.sessions ? duration(sel.minutes / sel.sessions) : '—'} label="средний сеанс" />
          </View>
        </View>
      </Card>

      <SectionLabel>За всё время</SectionLabel>
      <Card>
        <Text style={styles.totalNumber}>
          {rub(s.total.earned)}
          {season === 'newyear' ? ' ☃️' : ''}
        </Text>
        <Text style={font.body}>заработано с первого сеанса</Text>
        <View style={[styles.row, styles.divider, styles.totals]}>
          <Total value={`${s.total.sessions}`} label={sessions(s.total.sessions)} />
          <Total value={hours(s.total.minutes)} label="массажа" />
          <Total value={s.total.sessions ? duration(s.total.minutes / s.total.sessions) : '—'} label="средний сеанс" />
        </View>
      </Card>
    </ScrollView>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileNumber}>{value}</Text>
      <Text style={font.secondary}>{label}</Text>
    </View>
  );
}

function Total({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.flex}>
      <Text style={font.heading}>{value}</Text>
      <Text style={font.secondary}>{label}</Text>
    </View>
  );
}

function monthNote(upcoming: number, done: number, prev: number | undefined, month: number) {
  if (upcoming > 0) {
    const all = done + upcoming;
    return `Ещё ${upcoming} ${plural(upcoming, 'запись', 'записи', 'записей')} впереди — ${MONTHS_NOMINATIVE[month].toLowerCase()} уже идёт к ${all} ${plural(all, 'сеансу', 'сеансам', 'сеансам')}.`;
  }
  if (done === 0) return 'Первая запись месяца впереди ✨';
  const delta = done - (prev ?? 0);
  if (prev === undefined || delta === 0) return 'Отличный темп, так держать 💪';
  return delta > 0 ? `+${delta} ${sessions(delta)} к прошлому месяцу 🎉` : `${delta} к прошлому месяцу`;
}

function nextLeft(done: number, next: number) {
  const left = next - done;
  return left <= next * 0.2 ? 'совсем чуть-чуть' : `${left} ${sessions(left)}`;
}

// Accepted sessions since 16 November 2025, Moscow time.
function acceptedSinceBirthday(bookings: Booking[]) {
  const since = new Date('2025-11-16T00:00:00+03:00').toISOString();
  return bookings.filter((b) => b.status === 'accepted' && bookingStart(b) >= since).length;
}

const styles = StyleSheet.create({
  birthday: { backgroundColor: colors.purple, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center', gap: spacing.xs },
  birthdayTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '800', textAlign: 'center' },
  birthdayText: { color: '#FFFFFF', fontSize: 16, textAlign: 'center' },
  birthdayNumber: { color: '#FFFFFF', fontSize: 64, fontWeight: '800', lineHeight: 72 },
  festiveEmoji: { fontSize: 48 },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  hero: { backgroundColor: colors.accent, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.sm, marginTop: spacing.sm },
  heroLabel: { ...font.label, color: colors.text },
  heroNumber: { color: colors.text, fontSize: 64, fontWeight: '800', lineHeight: 76 },
  heroText: { color: colors.text, fontSize: 18, fontWeight: '600' },
  heroNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  iconCircle: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  starCircle: { width: 48, height: 48, backgroundColor: colors.gold + '33' },
  milestone: { gap: spacing.md },
  milestoneNew: { borderColor: colors.gold, borderWidth: 2 },
  milestoneLabel: { ...font.label, color: colors.gold },
  progressCount: { ...font.secondary, fontWeight: '700', color: colors.text },
  progressTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.gold + '33', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.gold },
  noPadding: { padding: 0 },
  section: { padding: spacing.lg, gap: spacing.md },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  segments: { flexDirection: 'row', backgroundColor: colors.accentSoft, borderRadius: radius.pill, padding: 4 },
  segment: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill, alignItems: 'center' },
  segmentOn: { backgroundColor: colors.card },
  segmentText: { fontSize: 15, color: colors.textSecondary },
  segmentTextOn: { color: colors.accent, fontWeight: '700' },
  chart: { flexDirection: 'row', height: 200, gap: 2 },
  barColumn: { flex: 1, alignItems: 'center' },
  barArea: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'flex-end', borderRadius: radius.pill, paddingHorizontal: 2, paddingBottom: 2 },
  barAreaOn: { backgroundColor: colors.accentSoft },
  bar: { width: '80%', borderRadius: 6, minHeight: 4 },
  barValue: { fontSize: 10, color: colors.textSecondary, marginBottom: 2 },
  barValueOn: { color: colors.accent, fontWeight: '700' },
  barLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 4 },
  barLabelNow: { color: colors.text, fontWeight: '700' },
  barLabelOn: { color: colors.accent, fontWeight: '700' },
  monthTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.gold + '33',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: { fontSize: 14, fontWeight: '600', color: colors.text },
  earned: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: spacing.lg },
  earnedNumber: { fontSize: 30, fontWeight: '800', color: colors.accent },
  earnedIcon: { width: 48, height: 48, backgroundColor: colors.card },
  tile: { flex: 1, alignSelf: 'stretch', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: 2 },
  tileNumber: { fontSize: 20, fontWeight: '700', color: colors.text },
  totalNumber: { fontSize: 40, fontWeight: '800', color: colors.purple },
  totals: { alignItems: 'flex-start', marginTop: spacing.md, paddingTop: spacing.md },
});
