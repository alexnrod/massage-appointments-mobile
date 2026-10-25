import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, Text, TextInput, View } from 'react-native';

import { login } from '@/lib/api';
import { Button } from '@/ui/primitives';
import { colors, font, radius, spacing } from '@/ui/theme';

export default function LoginScreen() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError('');
    try {
      await login(password);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.container}>
      <View style={styles.form}>
        <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
        <Text style={[font.title, styles.center]}>Массаж</Text>
        <Text style={[font.secondary, styles.center]}>Вход для администратора</Text>
        <TextInput
          style={styles.input}
          placeholder="Пароль"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          autoFocus
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={submit}
          returnKeyType="go"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Войти" onPress={submit} busy={busy} disabled={!password} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: colors.background },
  form: { padding: spacing.xl, gap: spacing.md },
  logo: { width: 120, height: 120, borderRadius: 28, alignSelf: 'center', marginBottom: spacing.sm },
  center: { textAlign: 'center' },
  input: {
    ...font.body,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  error: { color: colors.danger, textAlign: 'center' },
});
