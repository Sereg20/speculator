
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ActiveDefect } from "@/api/cars";
import { GameModalWithoutHeader } from "@/components/modal/GameModalWithoutHeader";
import { colors } from "@/theme/colors";
import { DefectToBeRepairedItem } from "./DefectToBeRepairedItem";
import { useState } from "react";
import { RepairType } from "@/api/repair";
import { ListItem } from "@/components/list-item/ListItem";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';


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
            <View style={styles.priceContainer}>
              <Text style={styles.priceInfo}>Качественный Ремонт:  </Text>
              <FontAwesome5 name="bitcoin" size={16} color={colors.textGold} />
              <Text style={styles.price}> {defect.proper_repair_cost} BYN</Text>
            </View>
          </ListItem>

          <ListItem onPress={() => {setRepairType("quick_fix")}} style={repairType === "quick_fix" && styles.selectedRepair}>
            <View style={styles.priceContainer}>
              <Text style={styles.priceInfo}>Ремонт на скорую руку:  </Text>
              <FontAwesome5 name="bitcoin" size={16} color={colors.textGold} />
              <Text style={styles.price}> {defect.quick_fix_cost} BYN</Text>
            </View>
          </ListItem>
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
    fontSize: 22,
    color: colors.textGold,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 18,
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

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  priceInfo: {
    color: colors.textMain,
  },

  price: {
    color: colors.textMain,
    fontWeight: 'bold'
  },
});