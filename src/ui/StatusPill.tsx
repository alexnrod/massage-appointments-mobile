import { StyleSheet, Text, View } from 'react-native';

import type { Booking } from '@/lib/types';

import { colors, radius, spacing } from './theme';

const STATUS = {
  pending: { label: 'Ждёт', bg: colors.accentSoft, fg: colors.accent },
  accepted: { label: 'Принята', bg: colors.successSoft, fg: colors.success },
  declined: { label: 'Отклонена', bg: colors.dangerSoft, fg: colors.danger },
};

export function StatusPill({ status }: { status: Booking['status'] }) {
  const s = STATUS[status];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <Text style={{ color: s.fg, fontSize: 12, fontWeight: '600' }}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
});
