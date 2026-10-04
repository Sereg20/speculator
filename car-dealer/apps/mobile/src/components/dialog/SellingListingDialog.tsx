import {
  View,
  StyleSheet,
  Text,
  FlatList,
} from "react-native";
import { RevealedDefect } from "@/api/market";
import { GameModalWithoutHeader } from "../modal/GameModalWithoutHeader";
import { colors } from "@/theme/colors";
import { ListItem } from "../list-item/ListItem";
import Foundation from '@expo/vector-icons/Foundation';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { DefectItem } from "@/features/inspection/DefectItem";
import { ActiveListing } from "@/api/listings";


interface SellingListingDialogProps {
  visible: boolean;
  defects: RevealedDefect[];
  onClose: () => void;
  car: ActiveListing | undefined;
  finalPrice: number;
  purchasePrice: number;
}

export function SellingListingDialog({
  visible, defects, onClose, car, finalPrice, purchasePrice
}: SellingListingDialogProps) {
  const askingPrice = car?.asking_price || 0;
  const marketValue = car?.market_value || 0;

  return (
    <GameModalWithoutHeader
      visible={visible}
      closeText="ЗАКРЫТЬ"
      closeColor={colors.greyButton}
      onClose={onClose}
      confirmHidden={true}
    >
      <View style={styles.container}>
        <Text style={styles.title}>ДЕТАЛИ ПРЕДЛОЖЕНИЯ</Text>
        <Text style={styles.subtitle}>{car?.make} {car?.model} ({car?.year})</Text>

        <View style={styles.dealDetails}>
          <ListItem>
            <View style={styles.dealContainer}>
              <Text style={styles.label}>Начальная цена:  </Text>
              <FontAwesome5 name="bitcoin" size={20} color={colors.textGold} />
              <Text style={[styles.price, { color: colors.textMain }]}> {askingPrice} BYN </Text>
            </View>
          </ListItem>

          <ListItem>
            <View style={styles.dealContainer}>
              <Text style={styles.label}>Текущая цена:  </Text>
              <FontAwesome5 name="bitcoin" size={20} color={colors.textGold} />
              <Text style={[styles.price, finalPrice < purchasePrice ?
                { color: colors.textRed } :
                { color: colors.textGreen }
              ]}> {finalPrice} BYN </Text>
              {finalPrice < purchasePrice ?
                <Foundation name="arrow-down" size={24} color={colors.textRed} /> :
                <Foundation name="arrow-up" size={24} color={colors.textGreen} />
              }
            </View>
            <Text style={styles.startPrice}>(Цена Покупки: {purchasePrice} BYN)</Text>
          </ListItem>

          <Text style={styles.defectsTitle}>Неисправности</Text>
          <FlatList
            data={defects}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DefectItem defect={item} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={false}
            onRefresh={() => { }}
            ListEmptyComponent={
              <ListItem style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Неисправностей не обнаружено
                </Text>
              </ListItem>
            }
          />
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
  },

  defectsTitle: {
    fontSize: 18,
    textAlign: 'center',
    color: colors.textMain,
    marginTop: 12
  },

  listContent: {
    gap: 8,
    maxHeight: 280
  },

  emptyContainer: {
    backgroundColor: colors.darkBackground,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
  },

  emptyText: {
    color: colors.textMain,
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center'

  }

});