// src/app/(tabs)/index.tsx

import { View, Text, StyleSheet } from "react-native";

export default function GarageScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Garage</Text>

      <Text style={styles.subtitle}>
        Your vehicles
      </Text>

      <View style={styles.card}>
        <Text style={styles.carName}>
          Sport Car
        </Text>

        <Text style={styles.carInfo}>
          Level 12
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
    padding: 20,
  },

  title: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subtitle: {
    color: "#888888",
    fontSize: 16,
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#222222",
    padding: 20,
    borderRadius: 12,
  },

  carName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "bold",
  },

  carInfo: {
    color: "#888888",
    marginTop: 8,
  },
});