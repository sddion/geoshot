
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CameraSettingsProvider } from "@/contexts/CameraSettingsContext";

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
          title: "Camera Settings",
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
        }}
      />
      <Stack.Screen
        name="gallery"
        options={{
          title: "Gallery",
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
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
  useEffect(() => {
    const configureImmersiveMode = async () => {
      if (Platform.OS === 'android') {
        try {
          // Hide the navigation bar (back, home, overview)
          await NavigationBar.setVisibilityAsync('hidden');
          // Allow swiping up to reveal it temporarily
          await NavigationBar.setBehaviorAsync('overlay-swipe');
        } catch (e) {
          console.warn("Error configuring navigation bar:", e);
        }
      }

      const hideSplash = async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn("Error hiding splash screen:", e);
        }
      };

      hideSplash();
    };

    configureImmersiveMode();

    // Fallback: force hide splash after 3 seconds
    const timeout = setTimeout(SplashScreen.hideAsync, 3000);
    return () => clearTimeout(timeout);
  }, []);

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