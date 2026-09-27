import {  View, StyleSheet, Text } from "react-native";
import { colors } from "@/theme/colors";
import { GameModal } from "@/components/modal/GameModal";
import { PlayerEquipment } from "@/api/player";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';


interface PurchaseEquipmentConfirmDialogProps {
  equipment: PlayerEquipment;
  visible: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export function PurchaseEquipmentConfirmDialog({
  visible, onClose, onConfirm, equipment
}: PurchaseEquipmentConfirmDialogProps) {


  return (
    <GameModal
      title="КУПИТЬ ОБОРУДОВАНИЕ"
      visible={visible}
      onClose={onClose}
      onConfirm={() => {onConfirm(equipment.id)}}
      confirmHidden={false}
      closeText="ОТМЕНА"
     
      confirmText="КУПИТЬ"
    >
      <View style={styles.container}>
       <Text style={styles.title}>{equipment.name}</Text>
       <Text style={styles.descr}>Позволит диагностировать: {equipment.defect_categories_targeted.join(', ')}</Text>
       
       <View style={styles.footer}>
          <FontAwesome5 name="bitcoin" size={22} color={colors.textGold} />
          <Text style={styles.price}> {equipment.purchase_price} BYN</Text>
       </View>
      </View>
    </GameModal>
  );
}

const styles = StyleSheet.create({
  container: {},

  title: {
    fontSize: 18,
    color: colors.textGold,
    marginBottom: 4
  },

  descr: {
    color: colors.textMain
  },

  footer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end'
  },

  price: {
    fontSize: 20,
    color: colors.textGold,
    fontWeight: "bold",
  }

});