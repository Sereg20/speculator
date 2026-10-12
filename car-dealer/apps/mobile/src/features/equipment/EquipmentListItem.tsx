import { StyleSheet, Text, View } from "react-native";

import type { PlayerEquipment } from "@/api/player";
import { ListItem } from "@/components/list-item/ListItem";
import { colors } from "@/theme/colors";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';


interface EquipmentListItemProps {
  equipment: PlayerEquipment;
  onPress: (equipment: PlayerEquipment) => void
}

function getTierTitle(tier: number) {
  switch (tier) {
    case 0:
      return 'Базовый';
    case 1:
      return 'Очевидный';
    case 2:
      return 'Заметный';
    case 3:
      return 'Скрытый';
    default:
      return '';
  }
}

function getTierColor(tier: number) {
  switch (tier) {
    case 0:
      return colors.blueButtonColor;
    case 1:
      return colors.textGreen;
    case 2:
      return colors.orangeButtonColor;
    case 3:
      return colors.textRed;
    default:
      return colors.textMain;
  }
}

export function EquipmentListItem({
  equipment, onPress
}: EquipmentListItemProps) {
  return (
    <ListItem disabled={equipment.owned} onPress={() => {onPress(equipment)}}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {equipment.name}
          </Text>

          {equipment.owned ? (
            <Text style={styles.owned}>
              КУПЛЕНО
            </Text>
          ) : (
            <Text style={styles.requirement}>Ур: {equipment.level_required}</Text>
          )}
        </View>

        <View style={styles.info}>
          
          <Text style={styles.infoText}>
            Шанс обнаружения неисправности: +{equipment.detection_bonus}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.tierContainer}>
            <Text style={styles.tier}><Text style={{fontWeight: 'bold', color: getTierColor(equipment.detection_tier)}}>{getTierTitle(equipment.detection_tier)}</Text></Text>
          </View>
          <View style={styles.costContainer}>
            {!equipment.owned && (
              <View style={styles.priceContainer}>
                <FontAwesome5 name="bitcoin" size={14} color={colors.textGold} />
                <Text style={styles.price}> {equipment.purchase_price} BYN</Text>
              </View>
            )}

            {equipment.monthly_upkeep > 0 && (
              <Text style={styles.upkeep}>
                Содержание: {equipment.monthly_upkeep} BYN/мес.
              </Text>
            )}
          </View>
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
    fontSize: 16,
    fontWeight: "bold",
  },

  requirement: {
    color: colors.textMain,
    fontSize: 11,
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
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: "space-between",
    gap: 2
  },

  costContainer: {
    alignItems: 'flex-end'
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  price: {
    color: colors.textGold,
    fontWeight: "bold",
    fontSize: 13,
  },

  upkeep: {
    color: colors.textMain,
    opacity: 0.7,
    fontSize: 11,
  },

  tierContainer: {
    backgroundColor: "#4c5052",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },

  tier: {
    fontSize: 13,
    color: colors.textMain
  }
});