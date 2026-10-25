import { season } from '@/lib/season';

/** Warm palette taken from the app icon. */
const warm = {
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
};

/** Winter night for 25 December – 3 January. */
const winter: typeof warm = {
  background: '#13234A',
  card: '#1D3160',
  border: '#2F4A85',
  text: '#F4F7FF',
  textSecondary: '#A9BCE3',
  accent: '#D9483B',
  accentSoft: '#2A3F72',
  purple: '#8FB3FF',
  purpleSoft: '#24396A',
  success: '#3FB47A',
  successSoft: '#1E4A3C',
  danger: '#FF8A7A',
  dangerSoft: '#4A2632',
  gold: '#FFD166',
};

// Picked once at start; every StyleSheet reads it at import time.
export const colors = season === 'newyear' ? winter : warm;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;

export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;

export const font = {
  title: { fontSize: 28, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 16, color: colors.text },
  secondary: { fontSize: 14, color: colors.textSecondary },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.6, color: colors.textSecondary },
};
