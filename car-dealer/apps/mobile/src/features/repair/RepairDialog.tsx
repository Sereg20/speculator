
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ActiveDefect } from "@/api/cars";
import { GameModalWithoutHeader } from "@/components/modal/GameModalWithoutHeader";
import { colors } from "@/theme/colors";
import { useState } from "react";
import { RepairType } from "@/api/repair";
import { ListItem } from "@/components/list-item/ListItem";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AntDesign from '@expo/vector-icons/AntDesign';


interface RepairDialogProps {
  defect: ActiveDefect,
  onClose: () => void,
  onConfirm: (repairType: RepairType) => void,
}

export function RepairDialog({
  onClose, defect, onConfirm
}: RepairDialogProps) {
  const [repairType, setRepairType] = useState<RepairType | null>(null);

  function onConfirmPress() {
    if (!repairType) return;
    onConfirm(repairType);
  }

  return (
    <GameModalWithoutHeader
      visible
      onConfirm={onConfirmPress}
      onClose={onClose}
      confirmText="РЕМОНТ"
      confirmColor={colors.blueButtonColor}
      closeColor={colors.greyButton}
      closeText="ЗАКРЫТЬ"
    >
      <View style={styles.container}>
        <Text style={styles.title}>РЕМОНТ</Text>
        <Text style={styles.subtitle}>{defect.label}</Text>

        <View style={styles.repairTypesContainer}>
          <ListItem onPress={() => setRepairType("proper")} style={repairType === "proper" && styles.selectedRepair}>
            <View style={styles.repairContainer}>
              <View style={styles.infoContainer}>
                <Text style={styles.priceInfo}>Качественный Ремонт</Text>
                <Text style={styles.time}>(Время ремонта: {defect.proper_repair_time_minutes} минут)</Text>
              </View>

              <View style={styles.costContainer}>
                <View style={styles.priceContainer}>
                  <FontAwesome5 name="bitcoin" size={16} color={colors.textGold} />
                  <Text style={styles.price}> {defect.proper_repair_cost} BYN</Text>
                </View>
                <View style={styles.priceContainer}>
                  <AntDesign name="thunderbolt" size={16} color={colors.textGold} />
                  <Text style={styles.price}> {defect.proper_repair_energy_cost}</Text>
                </View>
              </View>
            </View>
          </ListItem>

          {defect.quick_fix_cost && (
            <ListItem onPress={() => { setRepairType("quick_fix") }} style={repairType === "quick_fix" && styles.selectedRepair}>
              <View style={styles.repairContainer}>
                <View style={styles.infoContainer}>
                  <Text style={styles.priceInfo}>Ремонт на скорую руку</Text>
                  <Text style={styles.time}>(Время ремонта: {defect.quick_fix_time_minutes} минут)</Text>
                </View>

                <View style={styles.costContainer}>
                  <View style={styles.priceContainer}>
                    <FontAwesome5 name="bitcoin" size={16} color={colors.textGold} />
                    <Text style={styles.price}> {defect.quick_fix_cost} BYN</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <AntDesign name="thunderbolt" size={16} color={colors.textGold} />
                    <Text style={styles.price}> {defect.quick_fix_energy_cost}</Text>
                  </View>
                </View>
              </View>
            </ListItem>
          )}
        </View>

      </View>
    </GameModalWithoutHeader>
  );
}

const styles = StyleSheet.create({

  container: {
    width: '100%',
  },

  title: {
    fontWeight: 'bold',
    fontSize: 20,
    color: colors.textGold,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    color: colors.textMain
  },

  repairTypesContainer: {
    marginTop: 12,
    gap: 8
  },

  selectedRepair: {
    backgroundColor: colors.blueButtonColor
  },

  repairContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  infoContainer: {

  },

  costContainer: {
    alignItems: 'flex-end'
  },

  priceInfo: {
    color: colors.textMain,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  },

  price: {
    color: colors.textMain,
    fontWeight: 'bold',
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  },

  time: {
    fontSize: 12,
    color: colors.textGray,
    marginTop: 2,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  }
});