// src/app/_layout.tsx

import { Stack } from "expo-router";
import { GameProvider } from "@/context/GameContext";

export default function RootLayout() {
  return (
    <GameProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GameProvider>
  );
}