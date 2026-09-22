// src/components/game-header/GameHeader.tsx

import { View, Text, StyleSheet } from "react-native";
import { useGame } from "../../app/context/GameContext";
import { colors } from "@/theme/colors";

import { useQuery } from "@tanstack/react-query";
import { playerQuery } from "@/api/player";

export function GameHeader() {
  const { data: player } = useQuery(playerQuery());
  const xpProgress = player!.xp / (player!.xp + player!.xp_to_next_level);

  return (
    <View style={styles.container}>
      {/* Level + XP */}
      <View style={styles.levelContainer}>
        <Text style={styles.title}>
          Уровень {player?.level}
        </Text>

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
            <Text style={styles.xp}>
              XP {player?.xp} / {`${(player?.xp || 0) + (player?.xp_to_next_level || 0)}`}
            </Text>
        </View>
      </View>

      {/* Money */}
      <View style={styles.stat}>
        <Text style={styles.title}>Бабки</Text>

        <View>
          <Text style={styles.value}>
            {player?.cash.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Energy */}
      <View style={styles.stat}>
        <Text style={styles.title}>Энергия</Text>

        <View>

          <Text style={styles.value}>
            ⚡ {player?.energy_current}/100
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 8,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: colors.mainBackground,

    borderBottomWidth: 1,
    borderBottomColor: "#12211A",
  },

  levelContainer: {
    flex: 1,
    gap: 4,
  },


  title: {
    color: colors.textMain,
    fontSize: 15,
    fontWeight: "bold",
  },


  progressBackground: {
    height: 16,
    backgroundColor: colors.darkBackground,
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },

  xpProgress: {
    height: "100%",
    backgroundColor: "#3B6481",
    borderRadius: 0,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },

  xp: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    color: colors.textMain,
    fontSize: 12,
  },

  stat: {
    alignItems: "center",
    width: '33%',
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