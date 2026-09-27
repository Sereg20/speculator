import { StyleSheet, Text, View } from "react-native";

import type { PlayerEquipment } from "@/api/player";
import { ListItem } from "@/components/list-item/ListItem";
import { colors } from "@/theme/colors";

interface EquipmentListItemProps {
  equipment: PlayerEquipment;
}

export function EquipmentListItem({
  equipment,
}: EquipmentListItemProps) {
  return (
    <ListItem disabled={equipment.owned}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {equipment.name}
          </Text>

          {equipment.owned && (
            <Text style={styles.owned}>
              КУПЛЕНО
            </Text>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            Требуемый уровень: {equipment.level_required}
          </Text>

          <Text style={styles.infoText}>
            Обнаружение: Tier {equipment.detection_tier}
          </Text>

          <Text style={styles.infoText}>
            Бонус: +{equipment.detection_bonus}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.price}>
            {equipment.purchase_price} BYN
          </Text>

          {equipment.monthly_upkeep > 0 && (
            <Text style={styles.upkeep}>
              Содержание: {equipment.monthly_upkeep} BYN/мес.
            </Text>
          )}
        </View>
      </View>
    </ListItem>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  title: {
    flex: 1,
    color: colors.textMain,
    fontSize: 17,
    fontWeight: "bold",
  },

  owned: {
    color: "#84d78c",
    fontSize: 11,
    fontWeight: "bold",
  },

  info: {
    gap: 4,
  },

  infoText: {
    color: colors.textMain,
    opacity: 0.8,
    fontSize: 13,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  price: {
    color: colors.textGold,
    fontWeight: "bold",
  },

  upkeep: {
    color: colors.textMain,
    opacity: 0.7,
    fontSize: 12,
  },
});