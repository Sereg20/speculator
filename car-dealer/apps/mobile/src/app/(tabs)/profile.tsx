// app/(tabs)/profile.tsx

import {
  View,
  Text,
  StyleSheet,
} from "react-native";

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          P
        </Text>
      </View>

      <Text style={styles.username}>
        PlayerOne
      </Text>

      <Text style={styles.level}>
        Level 24
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
    alignItems: "center",
    padding: 20,
  },

  title: {
    alignSelf: "flex-start",
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 40,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#ffffff",
    fontSize: 40,
    fontWeight: "bold",
  },

  username: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
  },

  level: {
    color: "#888888",
    fontSize: 16,
    marginTop: 8,
  },
});