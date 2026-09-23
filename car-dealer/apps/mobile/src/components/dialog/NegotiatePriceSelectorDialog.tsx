
import {
  StyleSheet,
} from "react-native";

import { GameModal } from "../modal/GameModal";
import { GameSlider } from "../game-slider/GameSlider";
import { useState } from "react";


interface NegotiatePriceSelectorDialogProps {
  initialPrice: number,
  minPrice: number,
  visible: boolean,
  onClose: () => void,
  onConfirm: (proposedPrice: number) => void
}

export function NegotiatePriceSelectorDialog({
  visible, onClose, onConfirm, initialPrice, minPrice
}: NegotiatePriceSelectorDialogProps) {
  const [proposedPrice, setProposedPrice] = useState(initialPrice);
  const maxPrice = initialPrice;

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
        max={maxPrice}
        min={minPrice}
        onChange={(value) => {setProposedPrice(value)}}
      />
    </GameModal>
  );
}

const styles = StyleSheet.create({


});