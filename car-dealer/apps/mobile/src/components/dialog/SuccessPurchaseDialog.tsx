import {
  View,
  StyleSheet,
  Text,
} from "react-native";
import { GameModal } from "../modal/GameModal";
import { MarketListing } from "@/api/market";


interface SuccessPurchaseDialogProps {
  visible: boolean,
  onClose: () => void,
  car: MarketListing | undefined,
}

export function SuccessPurchaseDialog({
  visible, onClose, car
}: SuccessPurchaseDialogProps) {

  return (
    <GameModal
      visible={visible}
      title="АВТОМОБИЛЬ КУПЛЕН!"
      onClose={onClose}
      confirmHidden={true}
    >
      <View style={styles.container}>
        <Text>{car?.make} {car?.model}</Text>
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