
import {
  StyleSheet,
} from "react-native";

import { GameModal } from "../modal/GameModal";
import { GameSlider } from "../game-slider/GameSlider";
import { useState } from "react";


interface NegotiatePriceSelectorDialogProps {
  initialPrice: number,
  minPrice?: number,
  maxPrice?: number;
  visible: boolean,
  onClose: () => void,
  onConfirm: (proposedPrice: number) => void
}

export function NegotiatePriceSelectorDialog({
  visible, onClose, onConfirm, initialPrice, minPrice, maxPrice
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

  return (
    <GameModal
      visible={visible}
      title="ПРЕДЛОЖИТЬ ЦЕНУ"
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
    </GameModal>
  );
}

const styles = StyleSheet.create({


});