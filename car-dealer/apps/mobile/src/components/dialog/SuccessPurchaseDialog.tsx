import {
  View,
  StyleSheet,
  Text,
} from "react-native";
import { GameModal } from "../modal/GameModal";
import { MarketListing } from "@/api/market";
import { GameModalWithoutHeader } from "../modal/GameModalWithoutHeader";
import { colors } from "@/theme/colors";
import { ListItem } from "../list-item/ListItem";
import Foundation from '@expo/vector-icons/Foundation';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';


interface SuccessPurchaseDialogProps {
  visible: boolean,
  onClose: () => void,
  onConfirm: () => void,
  finalPrice: number,
  car: MarketListing | undefined,
}

export function SuccessPurchaseDialog({
  visible, onClose, car, finalPrice, onConfirm
}: SuccessPurchaseDialogProps) {
  const discount = (car?.asking_price || 0) - finalPrice;

  return (
    <GameModalWithoutHeader
      visible={visible}
      closeText="ЗАКРЫТЬ"
      closeColor={colors.greyButton}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmText="В ГАРАЖ"
      confirmColor={colors.blueButtonColor}
    >
      <View style={styles.container}>
        <Text style={styles.title}>УСПЕШНАЯ ПОКУПКА!</Text>
        <Text style={styles.carInfo}>{car?.make} {car?.model} ({car?.year})</Text>

        <View style={styles.dealDetails}>
          <ListItem>
            <View style={styles.dealContainer}>
              <Text style={styles.label}>Цена покупки: </Text>
              <FontAwesome5 name="bitcoin" size={20} color={colors.textGold} />
              <Text style={styles.price}> {finalPrice} BYN</Text>
            </View>
          </ListItem>

          <ListItem>
            <View style={styles.dealContainer}>
              <Text style={styles.label}>СТОРГОВАНО: </Text>
              <Text style={[
                styles.discount,
                discount > 0
                  ? {color: colors.textGreen}
                  : {color: colors.textMain}
              ]}> - {discount} BYN </Text>
              { discount > 0 && <Foundation name="arrow-down" size={24} color={colors.textGreen} />}
            </View>
            <Text style={styles.startPrice}>(Начальная цена {car?.asking_price} BYN)</Text>
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

  carInfo: {
    fontSize: 18,
    textAlign: 'center',
    color: colors.textMain
  },

  dealDetails: {
    marginVertical: 10,
    gap: 8
  },

  label: {
    fontSize: 18,
    textAlign: 'center',
    color: colors.textMain
  },

  dealContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },

  price: {
    fontWeight: 'bold',
    fontSize: 18,
    color: colors.textGold
  },

  discount: {
    fontWeight: 'bold',
    fontSize: 18
  },

  startPrice: {
    textAlign: 'center',
    color: colors.textGray,
    marginTop: 4
  }

});