import {  View, StyleSheet, Text } from "react-native";
import { colors } from "@/theme/colors";
import { GameModal } from "@/components/modal/GameModal";
import { PlayerSkill } from "@/api/player";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

interface PurchaseSkillConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
  skill: PlayerSkill
}

export function PurchaseSkillConfirmDialog({
  visible, onClose, onConfirm, skill
}: PurchaseSkillConfirmDialogProps) {


  return (
    <GameModal
      title="ИЗУЧИТЬ НАВЫК"
      visible={visible}
      onClose={onClose}
      onConfirm={() => {onConfirm(skill.id)}}
      confirmHidden={false}
      closeText="ОТМЕНА"
      confirmText="КУПИТЬ"
    >
      <View style={styles.container}>
       <Text style={styles.title}>{skill.name}</Text>
       <Text style={styles.descr}>{skill.description}</Text>
       
       <View style={styles.footer}>
          <FontAwesome5 name="bitcoin" size={22} color={colors.textGold} />
          <Text style={styles.price}> {skill.byn_price} BYN</Text>
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