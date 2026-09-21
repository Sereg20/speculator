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
import { NegotiateAction } from "./NegotiateAction";


interface InspectDialogProps {
  visible: boolean,
  onClose: () => void,
  onChat: () => void,
  onPreInspect: () => void
}

export function InspectDialog({
  visible, onClose, onChat, onPreInspect
}: InspectDialogProps) {

  return (
    <GameModal
      visible={visible}
      title="ПРЕДЛОЖИТЬ ЦЕНУ"
      onClose={onClose}
      onConfirm={onClose}
      confirmText="ПРЕДЛОЖИТЬ"
    >
      <NegotiateAction disabled={false} text={'СПРОСИТЬ'} onPress={onChat} iconName='handshake' iconColor='#be6b22' color='#EBA13C'/>
      <NegotiateAction disabled={false} text={'ПРОВЕРИТЬ'} onPress={onPreInspect} iconName='bug' iconColor='#09427a' color='#307DC1'/>
    </GameModal>
  );
}

const styles = StyleSheet.create({


});