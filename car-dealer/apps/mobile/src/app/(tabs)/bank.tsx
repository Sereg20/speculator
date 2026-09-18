// app/(tabs)/bank.tsx

import {
  View,
  Text,
  StyleSheet,
} from "react-native";

export default function BankScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bank</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.label}>
          Current Balance
        </Text>

        <Text style={styles.balance}>
          $125,450
        </Text>
      </View>

      <View style={styles.transaction}>
        <Text style={styles.transactionTitle}>
          Car sold
        </Text>

        <Text style={styles.income}>
          +$15,000
        </Text>
      </View>

      <View style={styles.transaction}>
        <Text style={styles.transactionTitle}>
          Engine purchase
        </Text>

        <Text style={styles.expense}>
          -$25,000
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

  balanceCard: {
    backgroundColor: "#222222",
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },

  label: {
    color: "#888888",
    fontSize: 14,
  },

  balance: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 8,
  },

  transaction: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#222222",
  },

  transactionTitle: {
    color: "#ffffff",
  },

  income: {
    color: "#4ade80",
  },

  expense: {
    color: "#f87171",
  },
});