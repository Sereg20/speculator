import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { PlayerEquipment } from "@/api/player";
import { EquipmentListItem } from "./EquipmentListItem";

interface EquipmentListProps {
  equipment: PlayerEquipment[];
  isLoading: boolean;
  error: Error | null;
}

export function EquipmentList({
  equipment,
  isLoading,
  error,
}: EquipmentListProps) {
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
          Не удалось загрузить оборудование
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={equipment}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <EquipmentListItem equipment={item} />
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