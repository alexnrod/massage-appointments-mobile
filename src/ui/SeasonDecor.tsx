import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { season } from '@/lib/season';

const LIGHT_COLORS = ['#FF5A5F', '#FFD166', '#4DD4AC', '#6FA8FF'];
const CONFETTI_COLORS = ['#E8875F', '#9B6BD3', '#FFB84D', '#4DB6AC', '#FF6F86'];

// Fixed pseudo-random layout so particles do not jump between renders.
const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  x: (i * 37) % 100,
  size: 3 + (i % 4) * 1.5,
  duration: 7000 + ((i * 1300) % 6000),
  delay: (i * 450) % 7000,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}));

/** Festive layer drawn over every screen; it never takes touches. */
export function SeasonDecor() {
  const reducedMotion = useReducedMotion();
  if (!season) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {!reducedMotion && PARTICLES.map((p, i) => <Particle key={i} {...p} />)}
      {season === 'newyear' && <Garland />}
    </View>
  );
}

function Particle({ x, size, duration, delay, color }: (typeof PARTICLES)[number]) {
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1));
  }, [progress, delay, duration]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -20 + progress.value * (height + 40) },
      { translateX: Math.sin(progress.value * 12 + x) * 12 },
      { rotate: `${progress.value * 720}deg` },
    ],
  }));

  const shape =
    season === 'newyear'
      ? { width: size, height: size, borderRadius: size, backgroundColor: '#FFFFFF', opacity: 0.8 }
      : { width: size + 2, height: size * 2 + 2, borderRadius: 2, backgroundColor: color, opacity: 0.85 };
  return <Animated.View style={[{ position: 'absolute', top: 0, left: (x / 100) * width }, shape, style]} />;
}

function Garland() {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.garland, { top }]}>
      {Array.from({ length: 14 }, (_, i) => (
        <View
          key={i}
          style={[styles.bulb, { backgroundColor: LIGHT_COLORS[i % LIGHT_COLORS.length], marginTop: i % 2 ? 6 : 0 }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  garland: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 4 },
  bulb: { width: 9, height: 9, borderRadius: 5, opacity: 0.9 },
});
