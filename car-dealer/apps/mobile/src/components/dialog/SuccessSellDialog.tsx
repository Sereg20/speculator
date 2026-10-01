import {
  View,
  StyleSheet,
  Text,
} from "react-native";
import { MarketListing } from "@/api/market";
import { GameModalWithoutHeader } from "../modal/GameModalWithoutHeader";
import { colors } from "@/theme/colors";
import { ListItem } from "../list-item/ListItem";
import Foundation from '@expo/vector-icons/Foundation';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { ActiveListing } from "@/api/listings";


interface SuccessSellDialogProps {
  visible: boolean,
  onClose: () => void,
  finalPrice: number,
  listing: ActiveListing | undefined,
}

export function SuccessSellDialog({
  visible, onClose, listing, finalPrice
}: SuccessSellDialogProps) {
  const discount = (listing?.asking_price || 0) - finalPrice;

  return (
    <GameModalWithoutHeader
      visible={visible}
      closeText="В ГАРАЖ"
      closeColor={colors.greyButton}
      onClose={onClose}
      confirmHidden={true}
    >
      <View style={styles.container}>
        <Text style={styles.title}>УСПЕШНАЯ ПРОДАЖА!</Text>
        <Text style={styles.subtitle}>{listing?.make} {listing?.model} ({listing?.year})</Text>

        <View style={styles.dealDetails}>
          <ListItem>
            <View style={styles.dealContainer}>
              <Text style={styles.label}>Цена продажи: </Text>
              <FontAwesome5 name="bitcoin" size={20} color={colors.textGold} />
              <Text style={styles.price}> {finalPrice} BYN</Text>
            </View>
          </ListItem>

          <ListItem>
            <View style={styles.dealContainer}>
              <Text style={styles.label}>НАВАР: </Text>
              <Text style={[
                styles.discount,
                discount > 0
                  ? {color: colors.textGreen}
                  : {color: colors.textMain}
              ]}> - {discount} BYN </Text>
              { discount > 0 && <Foundation name="arrow-down" size={24} color={colors.textGreen} />}
            </View>
            <Text style={styles.startPrice}>(Начальная цена {listing?.asking_price} BYN)</Text>
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

  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: colors.textMain
  },

  dealDetails: {
    marginTop: 16,
    marginBottom: 10,
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