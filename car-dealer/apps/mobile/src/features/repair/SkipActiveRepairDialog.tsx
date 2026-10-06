
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "@/theme/colors";
import { GameModal } from "@/components/modal/GameModal";
import AntDesign from '@expo/vector-icons/AntDesign';

interface SkipActiveRepairDialogProps {
  skipEnergyCost: number;
  onClose: () => void,
  onConfirm: () => void,
}

export function SkipActiveRepairDialog({
  skipEnergyCost, onClose, onConfirm
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

       <Text style={styles.text}>Завершить ремонт за </Text>
       <Text style={styles.text}>{skipEnergyCost}</Text>
       <AntDesign name="thunderbolt" size={18} color={colors.textGold} />
        
      </View>
    </GameModal>
  );
}

const styles = StyleSheet.create({

  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },

  text: {
    color: colors.textMain,
    fontSize: 18
  }

});