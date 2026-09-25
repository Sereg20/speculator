
import {
  StyleSheet,
} from "react-native";

import { GameModal } from "@/components/modal/GameModal";
import { GameSlider } from "@/components/game-slider/GameSlider";
import { useEffect, useState } from "react";


interface SellingPriceSelectorDialogProps {
  initialPrice: number | null,
  minPrice: number | null,
  maxPrice: number | null,
  onClose: () => void,
  onConfirm: (proposedPrice: number) => void
}

export function SellingPriceSelectorDialog({
  onClose, onConfirm, initialPrice, maxPrice, minPrice
}: SellingPriceSelectorDialogProps) {
  const [proposedPrice, setProposedPrice] = useState<number>(initialPrice ?? 0);

  return (
    <GameModal
      visible
      title="ВЫСТАВИТЬ ЦЕНУ"
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