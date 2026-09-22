import {
  View,
  StyleSheet,
} from "react-native";
import { GameModal } from "../modal/GameModal";
import { InspectDialogAction } from "./InspectDialogAction";


interface InspectDialogProps {
  visible: boolean,
  onClose: () => void,
  onChat: () => void,
  onPreInspect: (tier: string) => void
  chatDisabled: boolean,
  preInspectDisabled: boolean
}

export function InspectDialog({
  visible, onClose, onChat, onPreInspect, chatDisabled, preInspectDisabled
}: InspectDialogProps) {

  return (
    <GameModal
      visible={visible}
      title="ПОИСК НЕИСПРАВНОСТЕЙ"
      onClose={onClose}
      confirmHidden={true}
    >
      <View style={styles.container}>
      <InspectDialogAction disabled={chatDisabled} text={'СПРОСИТЬ'} onPress={onChat} energyCost={3} color='#EBA13C'/>
      <InspectDialogAction disabled={preInspectDisabled} text={'ОСМОТРЕТЬ'} onPress={() => {onPreInspect('visual')}} energyCost={3} color='#429958'/>
      <InspectDialogAction disabled={chatDisabled} text={'ПРОВЕРИТЬ'} onPress={() => {onPreInspect('tap_test')}} energyCost={3} color='#307DC1'/>
      <InspectDialogAction disabled={preInspectDisabled} text={'СКАНЕР'} onPress={() => {onPreInspect('obd')}} energyCost={3} color='#C5453C'/>
      </View>
    </GameModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
  }

});