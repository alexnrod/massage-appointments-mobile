import { router, Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';

import { registerForPush } from '@/lib/push';
import { season } from '@/lib/season';
import { birthdayShown, setBirthdayShown } from '@/lib/settings';
import type { Booking } from '@/lib/types';
import { useApi } from '@/lib/useApi';
import { colors } from '@/ui/theme';

export default function TabsLayout() {
  const { data: bookings } = useApi<Booking[]>('/api/admin/bookings');
  const pending = bookings?.filter((b) => b.status === 'pending').length ?? 0;

  useEffect(() => {
    // Every start re-sends the token; a reinstall or a new phone gets a new one.
    registerForPush().catch((e) => console.warn('Push registration failed:', e));
    if (season === 'birthday' && !birthdayShown()) {
      setBirthdayShown();
      router.navigate('/stats');
    }
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Заявки',
          tabBarBadge: pending > 0 ? pending : undefined,
          tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: 'tray.full', android: 'inbox' }} tintColor={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Календарь',
          tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: 'calendar', android: 'calendar_month' }} tintColor={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Статистика',
          tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: 'chart.bar.fill', android: 'insights' }} tintColor={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color, size }) => <SymbolView name={{ ios: 'person.fill', android: 'person' }} tintColor={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
