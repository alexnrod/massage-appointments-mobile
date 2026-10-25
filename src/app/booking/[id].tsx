import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { bookingStart, CITY_LABELS, dayLabel, services, time } from '@/lib/format';
import type { Booking } from '@/lib/types';
import { mutate, useApi } from '@/lib/useApi';
import { Button, Card, OfflineBanner } from '@/ui/primitives';
import { StatusPill } from '@/ui/StatusPill';
import { colors, font, spacing } from '@/ui/theme';

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, error } = useApi<Booking[]>('/api/admin/bookings');
  const [busy, setBusy] = useState<string | null>(null);
  const b = data?.find((x) => x.id === id);

  if (!b) {
    return <Text style={[font.secondary, styles.missing]}>{data ? 'Заявка не найдена' : 'Загрузка…'}</Text>;
  }

  async function run(action: string, path: string, method: string, body?: unknown) {
    setBusy(action);
    try {
      await mutate(path, method, body);
      if (action === 'delete') router.back();
    } catch (e) {
      Alert.alert('Не получилось', (e as Error).message);
    }
    setBusy(null);
  }

  function confirmDelete() {
    Alert.alert('Удалить заявку?', 'Она пропадёт из истории и статистики.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => run('delete', `/api/admin/bookings/${b!.id}`, 'DELETE') },
    ]);
  }

  const start = bookingStart(b);
  const telegram = b.customer_telegram?.replace(/^@/, '');
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <OfflineBanner error={error} />
      <View style={styles.header}>
        <Text style={font.title}>{b.customer_name}</Text>
        <StatusPill status={b.status} />
      </View>
      <Card style={styles.card}>
        <Row label="Когда" value={`${dayLabel(start)}, ${time(start)}`} />
        <Row label="Услуга" value={services(b.service_type)} />
        {b.duration_minutes ? <Row label="Длительность" value={`${b.duration_minutes} мин`} /> : null}
        <Row label="Город" value={CITY_LABELS[b.slot.city] ?? b.slot.city} />
        {b.address ? <Row label="Адрес" value={b.address} /> : null}
        {b.note ? <Row label="Комментарий" value={b.note} /> : null}
      </Card>
      <Card style={styles.card}>
        {b.customer_phone ? <Row label="Телефон" value={b.customer_phone} onPress={() => Linking.openURL(`tel:${b.customer_phone}`)} /> : null}
        {telegram ? <Row label="Telegram" value={`@${telegram}`} onPress={() => Linking.openURL(`https://t.me/${telegram}`)} /> : null}
        {b.customer_email ? <Row label="Email" value={b.customer_email} onPress={() => Linking.openURL(`mailto:${b.customer_email}`)} /> : null}
        {!b.customer_phone && !telegram && !b.customer_email ? <Text style={font.secondary}>Контактов нет</Text> : null}
      </Card>
      {b.status === 'pending' && (
        <View style={styles.actions}>
          <Button
            title="Принять"
            variant="success"
            busy={busy === 'accepted'}
            onPress={() => run('accepted', `/api/admin/bookings/${b.id}`, 'PATCH', { status: 'accepted' })}
          />
          <Button
            title="Отклонить"
            variant="danger"
            busy={busy === 'declined'}
            onPress={() => run('declined', `/api/admin/bookings/${b.id}`, 'PATCH', { status: 'declined' })}
          />
        </View>
      )}
      <Button title="Удалить заявку" variant="ghost" busy={busy === 'delete'} onPress={confirmDelete} style={styles.delete} />
    </ScrollView>
  );
}

function Row({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  return (
    <View style={styles.row}>
      <Text style={font.label}>{label}</Text>
      <Text style={[font.body, onPress && { color: colors.accent }]} onPress={onPress}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  missing: { padding: spacing.xl, textAlign: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  card: { gap: spacing.md },
  row: { gap: 2 },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  delete: { marginTop: spacing.lg },
});
