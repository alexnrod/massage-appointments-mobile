import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { bookingStart, CITY_LABELS, dayKey, dayLabel, MONTHS_NOMINATIVE, mskIso, time, WEEKDAYS_SHORT } from '@/lib/format';
import type { Booking, Break, WorkingDay } from '@/lib/types';
import { mutate, useApi } from '@/lib/useApi';
import { Button, Card, Chip, OfflineBanner, SectionLabel } from '@/ui/primitives';
import { colors, font, radius, spacing } from '@/ui/theme';

// Working days are fixed at 10:00–21:00 Moscow time, as on the website.
const TIMES = Array.from({ length: 23 }, (_, i) => `${String(10 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);

function monthGrid(year: number, month: number): (string | null)[] {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => new Date(Date.UTC(year, month, i + 1)).toISOString().slice(0, 10)),
  ];
}

export default function CalendarScreen() {
  const days = useApi<WorkingDay[]>('/api/admin/slots');
  const breaks = useApi<Break[]>('/api/admin/blocked-periods');
  const bookings = useApi<Booking[]>('/api/admin/bookings');

  const today = dayKey(new Date());
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(() => ({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 }));
  const [breakStart, setBreakStart] = useState('13:00');
  const [breakEnd, setBreakEnd] = useState('14:00');
  const [busy, setBusy] = useState<string | null>(null);

  const workingDay = days.data?.find((d) => dayKey(d.start_time) === selected);
  const openKeys = new Set(days.data?.map((d) => dayKey(d.start_time)));
  const dayBreaks = (breaks.data ?? []).filter((b) => b.type === 'custom' && b.custom_start && b.date.startsWith(selected));
  const accepted = (bookings.data ?? []).filter((b) => b.status === 'accepted');
  const bookedCount = new Map<string, number>();
  for (const b of accepted) bookedCount.set(dayKey(bookingStart(b)), (bookedCount.get(dayKey(bookingStart(b))) ?? 0) + 1);
  const dayBookings = accepted.filter((b) => dayKey(bookingStart(b)) === selected).sort((a, b) => bookingStart(a).localeCompare(bookingStart(b)));

  async function run(action: string, path: string, method: string, body?: unknown) {
    setBusy(action);
    try {
      await mutate(path, method, body);
    } catch (e) {
      Alert.alert('Не получилось', (e as Error).message);
    }
    setBusy(null);
  }

  function shiftMonth(delta: number) {
    const m = month.month + delta;
    setMonth({ year: month.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 });
  }

  function closeDay() {
    Alert.alert('Закрыть день?', 'Клиенты не смогут записаться на этот день.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Закрыть', style: 'destructive', onPress: () => run('close', `/api/admin/slots/${workingDay!.id}`, 'DELETE') },
    ]);
  }

  function addBreak() {
    if (breakEnd <= breakStart) return Alert.alert('Проверьте время', 'Конец перерыва должен быть позже начала.');
    run('break', '/api/admin/blocked-periods', 'POST', {
      date: selected,
      type: 'custom',
      custom_start: mskIso(selected, breakStart),
      custom_end: mskIso(selected, breakEnd),
    });
  }

  const loading = days.loading || breaks.loading || bookings.loading;
  const refresh = async () => {
    await Promise.all([days.refresh(), breaks.refresh(), bookings.refresh()]);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} colors={[colors.accent]} />}>
      <OfflineBanner error={days.error ?? breaks.error ?? bookings.error} />
      <Card>
        <View style={styles.monthHeader}>
          <Text style={styles.arrow} onPress={() => shiftMonth(-1)} accessibilityRole="button" accessibilityLabel="Предыдущий месяц">
            ‹
          </Text>
          <Text style={font.heading}>
            {MONTHS_NOMINATIVE[month.month]} {month.year}
          </Text>
          <Text style={styles.arrow} onPress={() => shiftMonth(1)} accessibilityRole="button" accessibilityLabel="Следующий месяц">
            ›
          </Text>
        </View>
        <View style={styles.grid}>
          {WEEKDAYS_SHORT.map((w) => (
            <Text key={w} style={[styles.cell, font.label, styles.weekday]}>
              {w}
            </Text>
          ))}
          {monthGrid(month.year, month.month).map((key, i) =>
            key ? (
              <Pressable
                key={key}
                onPress={() => setSelected(key)}
                accessibilityRole="button"
                accessibilityLabel={dayLabel(`${key}T12:00:00+03:00`)}
                style={[
                  styles.cell,
                  styles.day,
                  openKeys.has(key) && styles.open,
                  key === today && styles.today,
                  key === selected && styles.selected,
                ]}>
                <Text style={[font.body, key < today && { color: colors.textSecondary }, key === selected && { color: '#FFFFFF', fontWeight: '700' }]}>
                  {Number(key.slice(8))}
                </Text>
                {bookedCount.get(key) ? <View style={[styles.dot, key === selected && { backgroundColor: '#FFFFFF' }]} /> : null}
              </Pressable>
            ) : (
              <View key={`pad-${i}`} style={styles.cell} />
            ),
          )}
        </View>
      </Card>

      <Text style={[font.heading, styles.dayTitle]}>{dayLabel(`${selected}T12:00:00+03:00`)}</Text>

      {workingDay ? (
        <>
          <Card style={styles.gap}>
            <Text style={font.body}>
              Рабочий день 10:00–21:00 · {CITY_LABELS[workingDay.city] ?? workingDay.city}
            </Text>
            <Button title="Закрыть день" variant="danger" onPress={closeDay} busy={busy === 'close'} />
          </Card>

          <SectionLabel>Записи</SectionLabel>
          {dayBookings.length === 0 ? <Text style={font.secondary}>Принятых записей нет</Text> : null}
          {dayBookings.map((b) => (
            <Text key={b.id} style={[font.body, styles.booking]}>
              {time(bookingStart(b))} · {b.customer_name}
              {b.duration_minutes ? ` · ${b.duration_minutes} мин` : ''}
            </Text>
          ))}

          <SectionLabel>Перерывы</SectionLabel>
          {dayBreaks.map((b) => (
            <View key={b.id} style={styles.breakRow}>
              <Text style={font.body}>
                {time(b.custom_start!)}–{time(b.custom_end!)}
              </Text>
              <Text
                style={styles.remove}
                accessibilityRole="button"
                onPress={() => run(`remove-${b.id}`, `/api/admin/blocked-periods/${b.id}`, 'DELETE')}>
                Удалить
              </Text>
            </View>
          ))}
          <Card style={styles.gap}>
            <Text style={font.label}>С</Text>
            <TimeChips value={breakStart} onChange={setBreakStart} />
            <Text style={font.label}>ДО</Text>
            <TimeChips value={breakEnd} onChange={setBreakEnd} />
            <Button title={`Добавить перерыв ${breakStart}–${breakEnd}`} variant="ghost" onPress={addBreak} busy={busy === 'break'} />
          </Card>
        </>
      ) : (
        <Card style={styles.gap}>
          <Text style={font.body}>Выходной</Text>
          {selected >= today ? (
            <Button
              title="Открыть день 10:00–21:00"
              onPress={() =>
                run('open', '/api/admin/slots', 'POST', { start_time: mskIso(selected, '10:00'), end_time: mskIso(selected, '21:00') })
              }
              busy={busy === 'open'}
            />
          ) : null}
        </Card>
      )}
    </ScrollView>
  );
}

function TimeChips({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {TIMES.map((t) => (
        <Chip key={t} label={t} selected={t === value} onPress={() => onChange(t)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  arrow: { fontSize: 32, color: colors.accent, paddingHorizontal: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  weekday: { aspectRatio: 2 },
  day: { borderRadius: radius.pill },
  open: { backgroundColor: colors.accentSoft },
  today: { borderWidth: 2, borderColor: colors.accent },
  selected: { backgroundColor: colors.accent },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.purple, marginTop: 2 },
  dayTitle: { marginTop: spacing.xl, marginBottom: spacing.md },
  gap: { gap: spacing.md },
  booking: { paddingVertical: spacing.xs },
  breakRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  remove: { color: colors.danger, fontWeight: '600' },
  chips: { gap: spacing.sm },
});
