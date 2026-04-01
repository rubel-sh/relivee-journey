import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Font from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ActivityProvider } from "@/context/ActivityContext";
import { VideoProvider } from "@/context/VideoContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="recording"
        options={{ headerShown: false, presentation: "fullScreenModal" }}
      />
      <Stack.Screen
        name="activity/[id]"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="video-replay/[id]"
        options={{ headerShown: false, presentation: "fullScreenModal" }}
      />
      <Stack.Screen
        name="generate-video/[id]"
        options={{ headerShown: false, presentation: "fullScreenModal" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          Inter_400Regular: require("../assets/fonts/Inter_400Regular.ttf"),
          Inter_500Medium: require("../assets/fonts/Inter_500Medium.ttf"),
          Inter_600SemiBold: require("../assets/fonts/Inter_600SemiBold.ttf"),
          Inter_700Bold: require("../assets/fonts/Inter_700Bold.ttf"),
        });
      } catch (e) {
        console.warn("[Journey] Font load error:", e);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <ActivityProvider>
                <VideoProvider>
                  <RootLayoutNav />
                </VideoProvider>
              </ActivityProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
