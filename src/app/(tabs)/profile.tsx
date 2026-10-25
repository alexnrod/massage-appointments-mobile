import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, TextInput } from 'react-native';

import { api, logout } from '@/lib/api';
import { registerForPush, unregisterPush } from '@/lib/push';
import type { HotNews } from '@/lib/types';
import { mutate, useApi } from '@/lib/useApi';
import { Button, Card, SectionLabel } from '@/ui/primitives';
import { colors, font, radius, spacing } from '@/ui/theme';

// Shared with clients as is; Cyrillic reads better in messengers than the punycode the app calls.
const SITE_URL = 'https://массажквячеславу.рф';

export default function ProfileScreen() {
  const news = useApi<HotNews | null>('/api/admin/hot-news');
  const [busy, setBusy] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);

  const savedNews = news.data?.content ?? '';

  async function testPush() {
    setBusy('push');
    try {
      if (!(await registerForPush())) {
        Alert.alert('Уведомления выключены', 'Разрешите уведомления для приложения в настройках телефона.', [
          { text: 'Отмена', style: 'cancel' },
          { text: 'Открыть настройки', onPress: () => Linking.openSettings() },
        ]);
      } else {
        await api('/api/admin/push-devices/test', { method: 'POST' });
      }
    } catch (e) {
      Alert.alert('Не получилось', (e as Error).message);
    }
    setBusy(null);
  }

  function confirmLogout() {
    Alert.alert('Выйти?', 'Уведомления на этот телефон перестанут приходить.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          await unregisterPush();
          logout();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <SectionLabel>Ссылка для клиентов</SectionLabel>
      <Card style={styles.gap}>
        <Text style={font.body} selectable>
          {SITE_URL}
        </Text>
        {/* Android's share sheet has "Copy" on top and sends straight to messengers. */}
        <Button title="Поделиться или скопировать" onPress={() => Share.share({ message: SITE_URL })} />
      </Card>

      <SectionLabel>Горячая новость на сайте</SectionLabel>
      {/* Keyed by the saved text so the editor resets when the server copy changes. */}
      <NewsEditor key={savedNews} saved={savedNews} />

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: advanced }}
        onPress={() => setAdvanced(!advanced)}
        style={styles.advancedToggle}>
        <Text style={font.label}>ДОПОЛНИТЕЛЬНО {advanced ? '▾' : '▸'}</Text>
      </Pressable>
      {advanced && (
        <Card style={styles.gap}>
          <Text style={font.body}>
            Если уведомления не приходят, в настройках приложения включите «Автозапуск», в «Контроле активности» выберите «Нет
            ограничений», а в «Уведомлениях» включите всплывающие уведомления и уведомления на экране блокировки.
          </Text>
          <Button title="Открыть настройки приложения" variant="ghost" onPress={() => Linking.openSettings()} />
          <Button title="Отправить проверочное уведомление" variant="ghost" onPress={testPush} busy={busy === 'push'} />
          <Text style={font.secondary}>Версия {Constants.expoConfig?.version}</Text>
          <Button title="Выйти" variant="danger" onPress={confirmLogout} />
        </Card>
      )}
    </ScrollView>
  );
}

function NewsEditor({ saved }: { saved: string }) {
  const [text, setText] = useState(saved);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await mutate('/api/admin/hot-news', 'PUT', { content: text });
      Alert.alert('Готово', text.trim() ? 'Новость опубликована на сайте.' : 'Новость убрана с сайта.');
    } catch (e) {
      Alert.alert('Не получилось', (e as Error).message);
    }
    setBusy(false);
  }

  return (
    <Card style={styles.gap}>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Например: скидка 20% до конца месяца"
        placeholderTextColor={colors.textSecondary}
        multiline
        value={text}
        onChangeText={setText}
      />
      <Text style={font.secondary}>Пустое поле убирает новость с сайта.</Text>
      <Button title="Сохранить" onPress={save} busy={busy} disabled={text === saved} />
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  gap: { gap: spacing.md },
  input: {
    ...font.body,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  advancedToggle: { marginTop: spacing.xl, paddingVertical: spacing.sm },
});
