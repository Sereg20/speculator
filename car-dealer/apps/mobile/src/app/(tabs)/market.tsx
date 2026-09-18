// app/(tabs)/market.tsx

import {
  View,
  Text,
  StyleSheet,
} from "react-native";

export default function MarketScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Market</Text>

      <View style={styles.card}>
        <Text style={styles.itemName}>
          Turbo Engine
        </Text>

        <Text style={styles.price}>
          $25,000
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.itemName}>
          Racing Tires
        </Text>

        <Text style={styles.price}>
          $8,500
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
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#222222",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },

  itemName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },

  price: {
    color: "#4ade80",
    fontSize: 16,
    marginTop: 8,
  },
});