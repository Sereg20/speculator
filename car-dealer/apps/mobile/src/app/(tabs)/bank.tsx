// app/(tabs)/bank.tsx

import GarageItem from "@/features/bank/garage-item/GarageItem";
import LoanItem from "@/features/bank/loan-item/LoanItem";
import { colors } from "@/theme/colors";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
} from "react-native";

const bankBackground = require("@/../assets/images/backgrounds/background_bank.png");

export default function BankScreen() {
  return (
    <ImageBackground
      source={bankBackground}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.content}>
        <GarageItem />
      </View>

      <View style={styles.content}>
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
    padding: 20,
    backgroundColor: colors.mainBackground,
    width: '90%',
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.lightBackground,
    boxShadow: '0px 0px 15px 3px rgba(0, 0, 0, 0.2)',
  }
});