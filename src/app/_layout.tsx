import { MaterialCommunityIcons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { PaperProvider, useTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { darkTheme, lightTheme, navDarkTheme, navLightTheme } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/store/auth';
import { AppProvider } from '@/store/store';

const queryClient = new QueryClient();

/** Renders the navigator and redirects between Login and the app based on session. */
function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    if (loading) return;
    const onLogin = segments[0] === 'login';
    if (!session && !onLogin) router.replace('/login');
    else if (session && onLogin) router.replace('/(tabs)');
  }, [session, loading, segments, router]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
    </Stack>
  );
}

export default function RootLayout() {
  const isDark = useColorScheme() === 'dark';
  const paperTheme = isDark ? darkTheme : lightTheme;
  const navTheme = isDark ? navDarkTheme : navLightTheme;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider
          theme={paperTheme}
          settings={{ icon: (props) => <MaterialCommunityIcons {...props} /> }}>
          <ThemeProvider value={navTheme}>
            <AuthProvider>
              <AppProvider>
                <RootNavigator />
                <StatusBar style={isDark ? 'light' : 'dark'} />
              </AppProvider>
            </AuthProvider>
          </ThemeProvider>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
