import {
  View,
  StyleSheet,
} from "react-native";
import { NegotiateAction } from "./NegotiateAction";
import { GameModelWithoutButtons } from "../modal/GameModelWithoutButtons";


interface InspectDialogProps {
  visible: boolean,
  onClose: () => void,
  onChat: () => void,
  onPreInspect: () => void
  chatDisabled: boolean,
  preInspectDisabled: boolean
}

export function InspectDialog({
  visible, onClose, onChat, onPreInspect, chatDisabled, preInspectDisabled
}: InspectDialogProps) {

  return (
    <GameModelWithoutButtons
      visible={visible}
      title="ПОИСК НЕИСПРАВНОСТЕЙ"
      onClose={onClose}
    >
      <View style={styles.container}>
      <NegotiateAction disabled={chatDisabled} text={'СПРОСИТЬ'} onPress={onChat} iconName='handshake' iconColor='#be6b22' color='#EBA13C'/>
      <NegotiateAction disabled={preInspectDisabled} text={'ПРОВЕРИТЬ'} onPress={onPreInspect} iconName='bug' iconColor='#09427a' color='#307DC1'/>
      </View>
    </GameModelWithoutButtons>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  }

});