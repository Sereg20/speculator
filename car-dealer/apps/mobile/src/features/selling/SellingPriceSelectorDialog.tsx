
import {
  StyleSheet,
  View,
} from "react-native";

import { GameModal } from "@/components/modal/GameModal";
import { GameSlider } from "@/components/game-slider/GameSlider";
import { useEffect, useState } from "react";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { Text } from "react-native";
import { colors } from "@/theme/colors";


interface SellingPriceSelectorDialogProps {
  initialPrice: number | null,
  minPrice: number | null,
  maxPrice: number | null,
  marketValue: number,
  purchasePrice: number,
  onClose: () => void,
  onConfirm: (proposedPrice: number) => void
}

export function SellingPriceSelectorDialog({
  onClose, onConfirm, initialPrice, maxPrice, minPrice, marketValue, purchasePrice
}: SellingPriceSelectorDialogProps) {
  const [proposedPrice, setProposedPrice] = useState<number>(initialPrice ?? 0);

  return (
    <GameModal
      visible
      title="ВЫСТАВИТЬ НА ПРОДАЖУ"
      onClose={onClose}
      onConfirm={() => {onConfirm(proposedPrice)}}
      confirmText="ПРЕДЛОЖИТЬ"
    >
      <GameSlider
        value={proposedPrice}
        max={maxPrice || 0}
        min={minPrice || 0}
        onChange={(value) => {setProposedPrice(value)}}
      />
      <View style={styles.infoContainer}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Рыночная цена:  </Text>
            <FontAwesome5 name="bitcoin" size={18} color={colors.textGold} />
            <Text style={styles.price}> {marketValue} BYN</Text>
          </View>

          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Цена покупки:  </Text>
            <FontAwesome5 name="bitcoin" size={16} color={colors.textGold} />
            <Text style={styles.price}> {purchasePrice} BYN</Text>
          </View>
      </View>
    </GameModal>
  );
}

const styles = StyleSheet.create({
  infoContainer: {
    borderTopWidth: 1,
    borderColor: colors.mainBackground,
    paddingTop: 4,
    marginTop: 16,
    gap: 8
  },

  infoBlock: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  infoLabel: {
    color: colors.textMain,
    fontSize: 16
  },

  price: {
    color: colors.textMain,
    fontSize: 16,
    fontWeight: 'bold'
  }

});