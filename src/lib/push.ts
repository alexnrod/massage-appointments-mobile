import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';

import { api } from './api';

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
  return true;
}

/** Stops pushes to this phone; called before logout. */
export async function unregisterPush() {
  if (pushToken) await api('/api/admin/push-devices', { method: 'DELETE', body: { token: pushToken } }).catch(() => {});
}
