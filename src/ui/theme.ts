/** Warm palette taken from the app icon. */
export const colors = {
  background: '#FFF6F0',
  card: '#FFFFFF',
  border: '#F1DFD3',
  text: '#3A2A24',
  textSecondary: '#8A746A',
  accent: '#E8875F',
  accentSoft: '#FFE6D6',
  purple: '#9B6BD3',
  purpleSoft: '#EFE4FA',
  success: '#3E9B6A',
  successSoft: '#DDF3E6',
  danger: '#D2553F',
  dangerSoft: '#FBE1DB',
  gold: '#FFB84D',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;

export const font = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 16, color: colors.text },
  secondary: { fontSize: 14, color: colors.textSecondary },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.6, color: colors.textSecondary },
};
