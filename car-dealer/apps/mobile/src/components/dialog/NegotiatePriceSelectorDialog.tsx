import { MarketListing } from "@/api/market";
import { colors } from "@/theme/colors";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ImageBackground,
} from "react-native";
import { router } from "expo-router";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { GameModal } from "../modal/GameModal";
import { GameSlider } from "../game-slider/GameSlider";
import { useState } from "react";


interface NegotiatePriceSelectorDialogProps {
  initialPrice: number,
  visible: boolean,
  onClose: () => void,
  onConfirm: (proposedPrice: number) => void
}

export function NegotiatePriceSelectorDialog({
  visible, onClose, onConfirm, initialPrice
}: NegotiatePriceSelectorDialogProps) {
  const [proposedPrice, setProposedPrice] = useState(initialPrice);
  const maxPrice = Math.floor(initialPrice * 1.3);
  const minPrice = Math.ceil(initialPrice * 0.7);

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