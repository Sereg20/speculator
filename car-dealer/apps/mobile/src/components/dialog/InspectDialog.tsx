import {
  View,
  StyleSheet,
} from "react-native";
import { GameModal } from "../modal/GameModal";
import { InspectDialogAction } from "./InspectDialogAction";
import { InspectionActionId } from "@/api/market";


interface InspectDialogProps {
  visible: boolean,
  onClose: () => void,
  onChat: () => void,
  onPreInspect: (actionId: InspectionActionId) => void
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