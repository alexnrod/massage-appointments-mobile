import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, font, radius, spacing } from './theme';

type Variant = 'primary' | 'success' | 'danger' | 'ghost';

const VARIANTS: Record<Variant, { bg: string; fg: string }> = {
  primary: { bg: colors.accent, fg: '#FFFFFF' },
  success: { bg: colors.success, fg: '#FFFFFF' },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  ghost: { bg: colors.accentSoft, fg: colors.text },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  busy,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  busy?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={busy || disabled}
      style={({ pressed }) => [styles.button, { backgroundColor: v.bg, opacity: pressed || disabled ? 0.6 : 1 }, style]}>
      {busy ? <ActivityIndicator color={v.fg} /> : <Text style={[styles.buttonText, { color: v.fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

/** Shown above data when the last refresh failed; the screen keeps the cached data. */
export function OfflineBanner({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>{error}. Показаны последние сохранённые данные.</Text>
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
      <Text style={[font.secondary, selected && { color: '#FFFFFF', fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, borderRadius: radius.md, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  sectionLabel: { ...font.label, textTransform: 'uppercase', marginTop: spacing.lg, marginBottom: spacing.sm },
  banner: { backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  bannerText: { color: colors.danger, fontSize: 14 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
});
