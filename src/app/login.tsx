import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';

import { Spacing } from '@/constants/theme';
import { useAuth } from '@/store/auth';

export default function LoginScreen() {
  const theme = useTheme();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const isSignup = mode === 'signup';

  async function submit() {
    setError('');
    setInfo('');
    if (!email.trim() || password.length < 6) {
      setError('Enter an email and a password of at least 6 characters.');
      return;
    }
    setBusy(true);
    const result = isSignup ? await signUp(email, password) : await signIn(email, password);
    setBusy(false);

    if (result.error) {
      setError(result.error);
    } else if (result.needsConfirmation) {
      setInfo('Account created. Check your email to confirm, then sign in.');
      setMode('signin');
    }
    // On success with a session, the auth listener redirects automatically.
  }

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <View style={[styles.logo, { backgroundColor: theme.colors.primary }]}>
            <MaterialCommunityIcons name="run-fast" size={36} color="#fff" />
          </View>
          <Text variant="headlineMedium" style={styles.title}>
            SportLink
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {isSignup ? 'Create your account' : 'Welcome back'}
          </Text>

          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={styles.field}
          />
          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            style={styles.field}
          />

          {error ? (
            <HelperText type="error" visible>
              {error}
            </HelperText>
          ) : null}
          {info ? (
            <HelperText type="info" visible>
              {info}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={submit}
            loading={busy}
            disabled={busy}
            style={styles.submit}>
            {isSignup ? 'Create account' : 'Sign in'}
          </Button>

          <Button
            mode="text"
            onPress={() => {
              setMode(isSignup ? 'signin' : 'signup');
              setError('');
              setInfo('');
            }}>
            {isSignup ? 'Have an account? Sign in' : 'New here? Create an account'}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontWeight: '800', textAlign: 'center' },
  subtitle: { textAlign: 'center', opacity: 0.7, marginBottom: Spacing.lg },
  field: { marginBottom: Spacing.sm },
  submit: { marginTop: Spacing.sm },
});
