import { StyleSheet, Text, View } from "react-native";

import type { PlayerEquipment } from "@/api/player";
import { ListItem } from "@/components/list-item/ListItem";
import { colors } from "@/theme/colors";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";


interface EquipmentListItemProps {
  equipment: PlayerEquipment;
  onPress: (equipment: PlayerEquipment) => void
}

function getEquipmentCategoryText(category: string) {
  switch (category) {
    case 'body':
      return 'кузов'
    case 'engine':
      return 'двигатель';
    case 'transmission':
      return 'трансмиссия';
    case 'electrical':
      return 'электрика'
    case 'interior':
      return 'салон';
    case 'suspension':
      return 'подвеска';
  }
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
    <ListItem disabled={equipment.owned} onPress={() => { onPress(equipment) }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              {equipment.name}
            </Text>
            <Text style={styles.tierText}>{getTierTitle(equipment.detection_tier)}</Text>
          </View>
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
          {equipment.defect_categories_targeted?.length > 0 ? (
            <View style={styles.badgesRow}>
              {equipment.defect_categories_targeted.map(
                (category) => (
                  <View
                    key={category}
                    style={styles.badge}
                  >
                    <Text style={styles.badgeText}>
                      {getEquipmentCategoryText(category)}
                    </Text>
                  </View>
                ),
              )}
            </View>
          ) : <View></View>}
          <View style={styles.costContainer}>
            {!equipment.owned && (
              <View style={styles.priceContainer}>
                <FontAwesome5 name="bitcoin" size={14} color={colors.textGold} />
                <Text style={styles.price}> {equipment.purchase_price} USD</Text>
              </View>
            )}

            {equipment.monthly_upkeep > 0 && (
              <Text style={styles.upkeep}>
                Содержание: {equipment.monthly_upkeep} USD/мес.
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
    alignItems: "flex-start",
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
    alignItems: "flex-end",
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
  },

  tierText: {
    color: colors.textGray,
    fontSize: 11,
  },

  badgesRow: {
    flexWrap: "wrap",
    gap: 6,
    marginTop: spacing.sm,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#4c5052",
  },

  badgeText: {
    ...typography.body,
    color: colors.textMain,
    fontSize: 11,
    textAlign: 'center'
  },
});