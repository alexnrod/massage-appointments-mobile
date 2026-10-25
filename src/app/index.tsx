import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { StyleSheet, Text, View } from 'react-native';

import { db } from '@/db/client';
import { appointments } from '@/db/schema';

export default function HomeScreen() {
  const { data } = useLiveQuery(db.select().from(appointments));

  return (
    <View style={styles.container}>
      <Text>{data.length} appointments</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
