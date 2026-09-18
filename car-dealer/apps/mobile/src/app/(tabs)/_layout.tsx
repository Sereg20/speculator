import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";

import { GameHeader } from "@/components/game-header/GameHeader";

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <GameHeader />

      <View style={styles.tabs}>
        <Tabs
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Garage",
            }}
          />

          <Tabs.Screen
            name="market"
            options={{
              title: "Market",
            }}
          />

          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
            }}
          />

          <Tabs.Screen
            name="bank"
            options={{
              title: "Bank",
            }}
          />

          <Tabs.Screen
            name="stats"
            options={{
              title: "Stats",
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  tabs: {
    flex: 1,
  },
});