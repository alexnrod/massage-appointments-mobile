import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useDbMigrations } from '@/db/client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { success, error } = useDbMigrations();

  // A failed migration has to hide the splash too, or its error screen renders unseen underneath.
  useEffect(() => {
    if (success || error) SplashScreen.hideAsync();
  }, [success, error]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text>Database migration failed</Text>
        <Text>{error.message}</Text>
      </View>
    );
  }
  if (!success) return null;

  return (
    <>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Appointments' }} />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
});
