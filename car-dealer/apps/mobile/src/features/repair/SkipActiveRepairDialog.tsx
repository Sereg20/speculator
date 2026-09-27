
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
import { GameModal } from "@/components/modal/GameModal";


interface SkipActiveRepairDialogProps {
  onClose: () => void,
  onConfirm: () => void,
}

export function SkipActiveRepairDialog({
  onClose, onConfirm
}: SkipActiveRepairDialogProps) {

  return (
    <GameModal
      visible
      onConfirm={onConfirm}
      onClose={onClose}
      title="УСКОРИТЬ РЕМОНТ"
      confirmText="УСКОРИТЬ"
      closeText="ЗАКРЫТЬ"
    >
      <View style={styles.container}>

       <Text>Ускорить ремонт за энергию?</Text>
        
      </View>
    </GameModal>
  );
}

const styles = StyleSheet.create({

  container: {
    width: '100%',
  },

 
});