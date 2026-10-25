import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { bookingStart, MONTHS_NOMINATIVE, MONTHS_SHORT, msk, plural } from '@/lib/format';
import { BIRTHDAY_NAME, season } from '@/lib/season';
import { adminName, markMilestonesSeen, seenMilestones } from '@/lib/settings';
import { computeStats } from '@/lib/stats';
import type { Booking } from '@/lib/types';
import { useApi } from '@/lib/useApi';
import { Card, OfflineBanner, SectionLabel } from '@/ui/primitives';
import { colors, font, radius, spacing } from '@/ui/theme';

const sessions = (n: number) => plural(n, 'сеанс', 'сеанса', 'сеансов');

export default function StatsScreen() {
  const { data = [], error, loading, refresh } = useApi<Booking[]>('/api/admin/bookings');
  const [name, setName] = useState(adminName);
  const [seen] = useState(seenMilestones);
  useFocusEffect(useCallback(() => setName(adminName()), []));

  const s = computeStats(data);
  const month = msk(new Date()).getUTCMonth();
  const delta = s.monthSessions - s.prevMonthSessions;
  const max = Math.max(1, ...s.yearByMonth);

  // Remember what was celebrated; the animation plays once per milestone.
  const milestoneIds = s.milestones.map((m) => m.id).join(',');
  useEffect(() => {
    if (milestoneIds) markMilestonesSeen([...new Set([...seenMilestones(), ...milestoneIds.split(',')])]);
  }, [milestoneIds]);

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
        <View style={styles.newYear}>
          <Text style={[font.title, styles.flex]}>
            {month === 11 ? 'С наступающим' : 'С Новым годом'}, <Text style={{ color: colors.gold }}>{BIRTHDAY_NAME}!</Text>
          </Text>
          <Text style={styles.festiveEmoji}>🎄</Text>
        </View>
      ) : (
        <Text style={font.title}>{name ? `Привет, ${name}!` : 'Привет!'} 👋</Text>
      )}

      <View style={styles.hero}>
        <Text style={styles.heroLabel}>{MONTHS_NOMINATIVE[month]}</Text>
        <Text style={styles.heroNumber}>{s.monthSessions}</Text>
        <Text style={styles.heroText}>
          {sessions(s.monthSessions)} · {s.monthHours} ч массажа
        </Text>
        <Text style={styles.heroDelta}>
          {delta > 0
            ? `+${delta} к прошлому месяцу 🎉`
            : delta < 0
              ? `${delta} к прошлому месяцу`
              : s.monthSessions > 0
                ? 'Как в прошлом месяце 💪'
                : 'Первая запись месяца впереди ✨'}
        </Text>
      </View>

      {s.milestones.length > 0 && <SectionLabel>Достижения</SectionLabel>}
      {s.milestones.map((m) => {
        const isNew = !seen.includes(m.id);
        return (
          <Animated.View key={m.id} entering={isNew ? ZoomIn.springify().damping(9) : undefined}>
            <Card style={[styles.milestone, isNew && styles.milestoneNew]}>
              <Text style={styles.milestoneEmoji}>{m.emoji}</Text>
              <View style={styles.flex}>
                {isNew && <Text style={styles.newBadge}>НОВОЕ</Text>}
                <Text style={font.heading}>{m.title}</Text>
              </View>
            </Card>
          </Animated.View>
        );
      })}

      <SectionLabel>{msk(new Date()).getUTCFullYear()} по месяцам</SectionLabel>
      <Card>
        <View style={styles.chart}>
          {s.yearByMonth.map((n, i) => (
            <View key={i} style={styles.barColumn} accessibilityLabel={`${MONTHS_NOMINATIVE[i]}: ${n} ${sessions(n)}`}>
              <Text style={styles.barValue}>{n > 0 ? n : ''}</Text>
              <View
                style={[
                  styles.bar,
                  { height: `${(n / max) * 100}%`, backgroundColor: i === month ? colors.accent : colors.accentSoft },
                ]}
              />
              <Text style={[styles.barLabel, i === month && { color: colors.accent, fontWeight: '700' }]}>{MONTHS_SHORT[i]}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.tiles}>
        <Card style={styles.tile}>
          <Text style={styles.tileNumber}>
            {s.totalSessions}
            {season === 'newyear' ? ' ☃️' : ''}
          </Text>
          <Text style={font.secondary}>{sessions(s.totalSessions)} за всё время</Text>
        </Card>
        {s.topService && (
          <Card style={styles.tile}>
            <Text style={styles.tileTitle}>💆 {s.topService.name}</Text>
            <Text style={font.secondary}>самый популярный · {s.topService.count}</Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
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
  newYear: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  festiveEmoji: { fontSize: 48 },
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.md },
  hero: { backgroundColor: colors.accent, borderRadius: radius.lg, padding: spacing.xl, marginTop: spacing.sm },
  heroLabel: { color: '#FFFFFFCC', fontSize: 16, fontWeight: '600' },
  heroNumber: { color: '#FFFFFF', fontSize: 72, fontWeight: '800', lineHeight: 80 },
  heroText: { color: '#FFFFFF', fontSize: 18 },
  heroDelta: { color: '#FFFFFF', fontSize: 15, marginTop: spacing.md, fontWeight: '600' },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  milestoneNew: { borderColor: colors.gold, borderWidth: 2 },
  milestoneEmoji: { fontSize: 36 },
  newBadge: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  flex: { flex: 1 },
  chart: { flexDirection: 'row', height: 160, alignItems: 'flex-end', gap: 4 },
  barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6, minHeight: 4 },
  barValue: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  barLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 4 },
  tiles: { flexDirection: 'row', gap: spacing.md },
  tile: { flex: 1, gap: spacing.xs },
  tileNumber: { fontSize: 32, fontWeight: '800', color: colors.purple },
  tileTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
});
