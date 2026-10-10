// src/app/_layout.tsx

import { Stack } from "expo-router";
import { GameProvider } from "./context/GameContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthGate } from "@/auth/AuthGate";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </AuthGate>
      </GameProvider>
    </QueryClientProvider>
  );
}