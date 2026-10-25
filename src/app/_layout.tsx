import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useIsLoggedIn } from '@/lib/api';
import { refreshAll } from '@/lib/useApi';
import { colors } from '@/ui/theme';

export default function RootLayout() {
  const loggedIn = useIsLoggedIn();
  const response = Notifications.useLastNotificationResponse();

  // A tap on a booking push opens that booking, also when it started the app.
  useEffect(() => {
    const id = response?.notification.request.content.data?.bookingId;
    if (!loggedIn || typeof id !== 'string' || response?.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    Notifications.clearLastNotificationResponseAsync();
    router.push({ pathname: '/booking/[id]', params: { id } });
  }, [response, loggedIn]);

  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener(refreshAll);
    const foreground = AppState.addEventListener('change', (s) => s === 'active' && refreshAll());
    return () => {
      received.remove();
      foreground.remove();
    };
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Protected guard={loggedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="booking/[id]" options={{ title: 'Заявка' }} />
        </Stack.Protected>
        <Stack.Protected guard={!loggedIn}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
