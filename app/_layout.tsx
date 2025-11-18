
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CameraSettingsProvider } from "@/contexts/CameraSettingsContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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

function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CameraSettingsProvider>
        <GestureHandlerRootView>
          <RootLayoutNav />
        </GestureHandlerRootView>
      </CameraSettingsProvider>
    </QueryClientProvider>
  );
}
export default function RorkRootLayoutWrapper() {
  return (
    <RootLayout />
  );
}