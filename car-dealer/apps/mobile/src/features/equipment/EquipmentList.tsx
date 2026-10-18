import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { PlayerEquipment } from "@/api/player";
import { EquipmentListItem } from "./EquipmentListItem";
import { colors } from "@/theme/colors";

interface EquipmentListProps {
  equipment: PlayerEquipment[];
  isLoading: boolean;
  error: Error | null;
  onEquipmentPress: (selectedEquipment: PlayerEquipment) => void;
}

export function EquipmentList({
  equipment,
  isLoading,
  error,
  onEquipmentPress,
}: EquipmentListProps) {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.blueButtonColor} size='large'/>
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
        <EquipmentListItem equipment={item} onPress={onEquipmentPress}/>
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