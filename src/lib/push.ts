import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, SchedulableTriggerInputTypes } from 'expo-notifications';

import { api } from './api';
import { BIRTHDAY_PUSH_AT } from './season';

// Show pushes while the app is open too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

let pushToken: string | null = null;

/** Asks for permission and sends this phone's Expo push token to the backend. Returns false if not allowed. */
export async function registerForPush(): Promise<boolean> {
  // The backend sends with channelId "bookings"; Android 13+ also needs a channel before it shows the permission prompt.
  await Notifications.setNotificationChannelAsync('bookings', {
    name: 'Заявки',
    importance: AndroidImportance.HIGH,
  });
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await api('/api/admin/push-devices', { method: 'POST', body: { token: pushToken } });
  await scheduleBirthdayPush();
  return true;
}

/** A surprise on the phone itself; the same identifier replaces the earlier schedule on every start. */
async function scheduleBirthdayPush() {
  if (BIRTHDAY_PUSH_AT <= new Date()) return;
  await Notifications.scheduleNotificationAsync({
    identifier: 'birthday-2026',
    content: { title: 'Вячеслав, у нас есть вам кое-что сообщить :)', data: { screen: 'stats' } },
    trigger: { type: SchedulableTriggerInputTypes.DATE, date: BIRTHDAY_PUSH_AT, channelId: 'bookings' },
  });
}

/** Stops pushes to this phone; called before logout. */
export async function unregisterPush() {
  if (pushToken) await api('/api/admin/push-devices', { method: 'DELETE', body: { token: pushToken } }).catch(() => {});
}
