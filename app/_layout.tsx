
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CameraSettingsProvider } from '@/contexts/CameraSettingsContext';
import { useAutoPermissions } from '@/hooks/Permissions';
import * as SplashScreen from 'expo-splash-screen';

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
import { Platform } from 'react-native';


function RootLayout() {
  const { allGranted } = useAutoPermissions();

  // Immersive mode configuration (runs once)
  useEffect(() => {
    const configureImmersiveMode = async () => {
      if (Platform.OS === 'android') {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          NavigationBar.addVisibilityListener(({ visibility }) => {
            if (visibility === 'visible') {
              setTimeout(async () => {
                await NavigationBar.setVisibilityAsync('hidden');
              }, 1500);
            }
          });
        } catch (e) {
          console.warn('Error configuring navigation bar:', e);
        }
      }
    };
    configureImmersiveMode();
  }, []);

  // Hide splash screen only after all permissions are granted
  useEffect(() => {
    if (allGranted) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [allGranted]);

  return (
    <QueryClientProvider client={queryClient}>
      <CameraSettingsProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </CameraSettingsProvider>
    </QueryClientProvider>
  );
}
export default function RootLayoutWrapper() {
  return (
    <RootLayout />
  );
}