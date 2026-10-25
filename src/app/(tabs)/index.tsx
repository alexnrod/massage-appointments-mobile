import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';

import { bookingStart, dayLabel, services, time } from '@/lib/format';
import type { Booking } from '@/lib/types';
import { mutate, useApi } from '@/lib/useApi';
import { Button, Chip, OfflineBanner } from '@/ui/primitives';
import { StatusPill } from '@/ui/StatusPill';
import { colors, font, radius, spacing } from '@/ui/theme';

const byStart = (a: Booking, b: Booking) => bookingStart(a).localeCompare(bookingStart(b));

export default function BookingsScreen() {
  const { data = [], error, loading, refresh } = useApi<Booking[]>('/api/admin/bookings');
  const [showHistory, setShowHistory] = useState(false);
  const now = new Date().toISOString();

  const pending = data.filter((b) => b.status === 'pending').sort(byStart);
  const upcoming = data.filter((b) => b.status === 'accepted' && bookingStart(b) >= now).sort(byStart);
  const history = data
    .filter((b) => !pending.includes(b) && !upcoming.includes(b))
    .sort(byStart)
    .reverse();

  const sections = showHistory
    ? [{ title: 'История', data: history }]
    : [
        { title: 'Ждут ответа', data: pending },
        { title: 'Предстоящие', data: upcoming },
      ];

  return (
    <SectionList
      contentContainerStyle={styles.list}
      sections={sections}
      keyExtractor={(b) => b.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} colors={[colors.accent]} />}
      ListHeaderComponent={
        <>
          <OfflineBanner error={error} />
          <View style={styles.toggle}>
            <Chip label="Актуальные" selected={!showHistory} onPress={() => setShowHistory(false)} />
            <Chip label="История" selected={showHistory} onPress={() => setShowHistory(true)} />
          </View>
        </>
      }
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionTitle}>
          {section.title} · {section.data.length}
        </Text>
      )}
      renderSectionFooter={({ section }) =>
        section.data.length === 0 ? <Text style={[font.secondary, styles.empty]}>Пусто</Text> : null
      }
      renderItem={({ item }) => <BookingRow booking={item} />}
      stickySectionHeadersEnabled={false}
    />
  );
}

function BookingRow({ booking: b }: { booking: Booking }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function decide(status: 'accepted' | 'declined') {
    setBusy(status);
    try {
      await mutate(`/api/admin/bookings/${b.id}`, 'PATCH', { status });
    } catch (e) {
      Alert.alert('Не получилось', (e as Error).message);
    }
    setBusy(null);
  }

  const start = bookingStart(b);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/booking/[id]', params: { id: b.id } })}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <View style={styles.rowHeader}>
        <Text style={font.heading}>{b.customer_name}</Text>
        <StatusPill status={b.status} />
      </View>
      <Text style={font.body}>
        {dayLabel(start)}, {time(start)}
      </Text>
      <Text style={font.secondary}>
        {services(b.service_type)}
        {b.duration_minutes ? ` · ${b.duration_minutes} мин` : ''}
      </Text>
      {b.status === 'pending' && (
        <View style={styles.actions}>
          <Button title="Принять" variant="success" onPress={() => decide('accepted')} busy={busy === 'accepted'} style={styles.flex} />
          <Button title="Отклонить" variant="danger" onPress={() => decide('declined')} busy={busy === 'declined'} style={styles.flex} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  toggle: { flexDirection: 'row', gap: spacing.sm },
  sectionTitle: { ...font.label, textTransform: 'uppercase', marginTop: spacing.xl, marginBottom: spacing.sm },
  empty: { paddingVertical: spacing.sm },
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  rowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  flex: { flex: 1 },
});
