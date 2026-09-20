// src/app/_layout.tsx

import { Stack } from "expo-router";
import { GameProvider } from "./context/GameContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </GameProvider>
    </QueryClientProvider>
  );
}