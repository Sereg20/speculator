import {
  View,
  StyleSheet,
} from "react-native";
import { GameModal } from "../../components/modal/GameModal";
import { InspectDialogAction } from "../../components/dialog/InspectDialogAction";
import { InspectionActionId } from "@/api/market";
import { GameModalWithoutHeader } from "../../components/modal/GameModalWithoutHeader";


interface InspectDialogProps {
  visible: boolean,
  onClose: () => void,
  onPreInspect: (actionId: InspectionActionId) => void
  chatDisabled: boolean,
  preInspectDisabled: boolean
}

export function InspectDialog({
  visible, onClose, onPreInspect, chatDisabled, preInspectDisabled
}: InspectDialogProps) {

  return (
    <GameModalWithoutHeader
      visible={visible}
      onClose={onClose}
      confirmHidden={true}
    >
      <View style={styles.container}>
      
      </View>
    </GameModalWithoutHeader>
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