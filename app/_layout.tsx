
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CameraSettingsProvider } from '@/contexts/CameraSettingsContext';
import { UpdateProvider } from '@/utils/UpdateContext';
import { useAutoPermissions } from '@/hooks/Permissions';
import * as SplashScreen from 'expo-splash-screen';
import { cleanupOldApkFiles } from '@/utils/updater';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
          presentation: "transparentModal",
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="geo-preview"
        options={{
          headerShown: false,
          presentation: "modal",
        }}
      />
    </Stack>
  );
}

import * as NavigationBar from 'expo-navigation-bar';
import { Platform, AppState } from 'react-native';


function RootLayout() {
  useAutoPermissions();

  // Clean up old APK files on app startup
  useEffect(() => {
    cleanupOldApkFiles();
  }, []);

  // Immersive mode configuration (runs once)
  useEffect(() => {
    let listener: { remove: () => void } | undefined;

    const configureImmersiveMode = async () => {
      if (Platform.OS === 'android') {
        try {
          // Initial hide
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('overlay-swipe');

          // Re-hide on visibility change
          listener = NavigationBar.addVisibilityListener(({ visibility }) => {
            if (visibility === 'visible') {
              setTimeout(async () => {
                await NavigationBar.setVisibilityAsync('hidden');
              }, 2000);
            }
          });
        } catch (e) {
          console.warn('Error configuring navigation bar:', e);
        }
      }
    };

    configureImmersiveMode();

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <UpdateProvider>
        <CameraSettingsProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </CameraSettingsProvider>
      </UpdateProvider>
    </QueryClientProvider>
  );
}
export default function RootLayoutWrapper() {
  return (
    <RootLayout />
  );
}