import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '@/components/ErrorBoundary';
import { supabase } from '@/lib/supabase';
import { night } from '@/theme';

export default function RootLayout() {
  const router = useRouter();

  // On web, native <img> drag-and-drop steals mouse drags from the swipe
  // gesture (and text selection fights drags too) — disable both globally.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.textContent =
      'img{-webkit-user-drag:none;user-drag:none;user-select:none;-webkit-user-select:none;}';
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // A password-reset link opens the app with a recovery token; supabase-js
  // detects it and fires PASSWORD_RECOVERY. Send the user to the screen where
  // they can actually set a new password, wherever the link happened to land.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') router.replace('/update-password');
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppErrorBoundary>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: night.bg },
            }}
          >
            <Stack.Screen name="match" options={{ presentation: 'transparentModal', animation: 'fade' }} />
          </Stack>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
