
import {
  StyleSheet,
} from "react-native";

import { GameModal } from "../modal/GameModal";
import { GameSlider } from "../game-slider/GameSlider";
import { useState } from "react";
import { View } from "react-native";
import { colors } from "@/theme/colors";
import { Text } from "react-native";


interface NegotiatePriceSelectorDialogProps {
  originalPrice: number;
  initialPrice: number,
  minPrice?: number,
  maxPrice?: number;
  visible: boolean,
  onClose: () => void,
  onConfirm: (proposedPrice: number) => void
}

export function NegotiatePriceSelectorDialog({
  visible, onClose, onConfirm, originalPrice, initialPrice, minPrice, maxPrice
}: NegotiatePriceSelectorDialogProps) {
  const [proposedPrice, setProposedPrice] = useState(initialPrice);
  if (maxPrice && !minPrice) {
    minPrice = initialPrice
  } else if (!maxPrice && minPrice) {
    maxPrice = initialPrice;
  } else if (!maxPrice && !minPrice) {
    maxPrice = initialPrice + 1;
    minPrice = initialPrice - 1;
  }
  const markup = originalPrice - proposedPrice;
  const markupPercent = Math.round(((markup) / originalPrice) * 100);


  return (
    <GameModal
      visible={visible}
      title="ПРЕДЛОЖИТЬ ЦЕНУ"
      onClose={onClose}
      onConfirm={() => { onConfirm(proposedPrice) }}
      confirmText="ПРЕДЛОЖИТЬ"
    >
      <GameSlider
        value={proposedPrice}
        max={maxPrice || 0}
        min={minPrice || 0}
        onChange={(value) => { setProposedPrice(value) }}
      />
      <View style={styles.infoContainer}>
        <View style={styles.markupBlock}>
          <Text style={styles.infoLabel}>Скидка: </Text>
          <Text style={[styles.markup, markup > 0 ? styles.markupPositive : styles.markupNegative]}>{markup} BYN ({markupPercent}%)</Text>
        </View>
      </View>
    </GameModal>
  );
}

const styles = StyleSheet.create({
  infoContainer: {
    borderTopWidth: 1,
    borderColor: colors.mainBackground,
    paddingTop: 8,
    marginTop: 16,
    gap: 8
  },

  markupBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoBlock: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  infoLabel: {
    color: colors.textMain,
    fontSize: 16
  },

  markup: {
    fontSize: 16,
    fontWeight: 'bold'
  },

  markupPositive: {
    color: colors.textGreen
  },

  markupNegative: {
    color: colors.textMain
  },

});