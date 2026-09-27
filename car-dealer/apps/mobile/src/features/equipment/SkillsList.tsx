import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { PlayerSkill } from "@/api/player";
import { SkillListItem } from "./SkillListItem";

interface SkillsListProps {
  skills: PlayerSkill[];
  isLoading: boolean;
  error: Error | null;
  onSkillPress: (selectedSkill: PlayerSkill) => void;
}

export function SkillsList({
  skills,
  isLoading,
  error,
  onSkillPress,
}: SkillsListProps) {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>
          Не удалось загрузить навыки
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={skills}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SkillListItem skill={item} onPress={onSkillPress}/>
      )}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
    paddingBottom: 20,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  error: {
    color: "#FFFFFF",
  },
});