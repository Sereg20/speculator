// src/components/game-header/GameHeader.tsx

import { View, Text, StyleSheet, Pressable } from "react-native";
import { colors } from "@/theme/colors";
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Entypo from '@expo/vector-icons/Entypo';
import {CircularProgressBase}  from 'react-native-circular-progress-indicator';


import { useQuery } from "@tanstack/react-query";
import { playerQuery } from "@/api/player";

interface GameHeaderProps {
  onLvlPress: () => void;
  onCashPress: () => void;
  onEnergyPress: () => void;
}

export function GameHeader({onLvlPress, onCashPress, onEnergyPress}: GameHeaderProps) {
  const { data: player } = useQuery(playerQuery());
  const xpProgress = player!.xp / (player!.xp + player!.xp_to_next_level) * 100;

  return (
    <View style={styles.container}>
      {/* Level + XP */}
      <Pressable onPress={onLvlPress}>
        <CircularProgressBase
          radius={20}
          value={xpProgress}
          activeStrokeWidth={6}
          inActiveStrokeWidth={6}
          activeStrokeColor={colors.textGold}
          >
            <Text style={styles.level}>{player?.level}</Text>
          </CircularProgressBase>
      </Pressable>

      <View style={styles.statsContainer}>
      {/* Money */}
        <Pressable style={styles.stat} onPress={onCashPress}>
          <View style={styles.statContainer}>
            <FontAwesome5 name="bitcoin" size={14} color={colors.textGold} />
            <Text style={styles.value}>
              {player?.cash.toLocaleString()}
            </Text>
          </View>
          <Entypo name="plus" size={18} color={colors.textGold} />
        </Pressable>

        {/* Energy */}
        <Pressable style={styles.stat} onPress={onEnergyPress}>
          <View style={styles.statContainer}>
            <AntDesign name="thunderbolt" size={16} color={colors.textGold} />
            <Text style={styles.value}>
              {player?.energy_current}/{player?.energy_max}
            </Text>
          </View>
          <Entypo name="plus" size={18} color={colors.textGold} />
        </Pressable>
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
    justifyContent: 'space-between',
    backgroundColor: colors.mainBackground,

    borderBottomWidth: 1,
    borderBottomColor: "#12211A",
  },

  level: {
    color: colors.textGold,
    fontSize: 15,
    fontWeight: "bold",
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
    gap: 12,
  },

  stat: {
    backgroundColor: colors.darkBackground,
    paddingHorizontal: 4,
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
    width: 100,
    height: 25,
  },

  value: {
    color: colors.textMain,
    fontWeight: "bold",
    fontSize: 12
  },

  statContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4
  }
});