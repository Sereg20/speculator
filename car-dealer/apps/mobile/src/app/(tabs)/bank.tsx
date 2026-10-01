// app/(tabs)/bank.tsx

import { playerQuery, upgradeGarage } from "@/api/player";
import { updatePlayerState } from "@/api/playerState";
import { getGarageBackground } from "@/assets/images/backgrounds/garage/garageBackground";
import { GarageItem } from "@/features/bank/garage-item/GarageItem";
import LoanItem from "@/features/bank/loan-item/LoanItem";
import { colors } from "@/theme/colors";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { useGame } from "../context/GameContext";

const bankBackground = require("@/../assets/images/backgrounds/background_bank.png");

export default function BankScreen() {
  const { showError } = useGame();

  const { data: player } = useQuery(playerQuery());
  const queryClient = useQueryClient();

  const upgradeGarageMutation = useMutation({
    mutationFn: upgradeGarage,

    onSuccess: (result) => {
      updatePlayerState(
        queryClient,
        result.meta.playerState
      );
    },

    onError: (error) => {
      showError(error.message);
    },
  });

  function onGarageBuy () {
    upgradeGarageMutation.mutate();
  }

  return (
    <ImageBackground
      source={bankBackground}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.content}>
        <Text style={styles.title}>ОТДЕЛ НЕДВИЖИМОСТИ</Text>
        <GarageItem garageLevel={(player?.garage_slots || 1) + 1} onGarageBuy={onGarageBuy}/>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>ОТДЕЛ КРЕДИТОВАНИЯ</Text>
        <LoanItem />
        <LoanItem />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#111111",
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
    gap: 30
  },

  backgroundImage: {

    width: "100%",
    height: "100%",
  },

  content: {
    gap: 12,
    padding: 12,
    backgroundColor: colors.mainBackground,
    width: '90%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.lightBackground,
    boxShadow: '0px 0px 15px 3px rgba(0, 0, 0, 0.2)',
  },

  title: {
    fontSize: 20,
    color: colors.textMain,
    fontWeight: 'bold'
  }
});