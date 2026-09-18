// src/components/game-header/GameHeader.tsx

import { View, Text, StyleSheet } from "react-native";

import { useGame } from "@/context/GameContext";

export function GameHeader() {
  const {
    level,
    xp,
    xpToNextLevel,
    money,
    energy,
    maxEnergy,
  } = useGame();

  const xpProgress = xp / xpToNextLevel;
  const energyProgress = energy / maxEnergy;

  return (
    <View style={styles.container}>
      {/* Level + XP */}
      <View style={styles.levelContainer}>
        <View style={styles.levelRow}>
          <Text style={styles.level}>
            LVL {level}
          </Text>

          <Text style={styles.xp}>
            {xp} / {xpToNextLevel} XP
          </Text>
        </View>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.xpProgress,
              {
                width: `${Math.min(
                  xpProgress * 100,
                  100
                )}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Money */}
      <View style={styles.stat}>
        <Text style={styles.icon}>$</Text>

        <View>
          <Text style={styles.label}>Money</Text>

          <Text style={styles.value}>
            {money.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Energy */}
      <View style={styles.stat}>
        <Text style={styles.icon}>⚡</Text>

        <View>
          <Text style={styles.label}>Energy</Text>

          <Text style={styles.value}>
            {energy}/{maxEnergy}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 10,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#181818",

    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",

    gap: 16,
  },

  levelContainer: {
    flex: 1,
  },

  levelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  level: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "bold",
  },

  xp: {
    color: "#888888",
    fontSize: 11,
  },

  progressBackground: {
    height: 6,
    backgroundColor: "#303030",
    borderRadius: 3,
    overflow: "hidden",
  },

  xpProgress: {
    height: "100%",
    backgroundColor: "#7c3aed",
    borderRadius: 3,
  },

  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  icon: {
    color: "#ffffff",
    fontSize: 18,
  },

  label: {
    color: "#777777",
    fontSize: 10,
  },

  value: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "bold",
  },
});