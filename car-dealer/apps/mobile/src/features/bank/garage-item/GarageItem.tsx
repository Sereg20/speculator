// app/(tabs)/bank.tsx

import { getGarageBackground } from "@/assets/images/backgrounds/garage/garageBackground";
import { colors } from "@/theme/colors";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
} from "react-native";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { getGarageImage } from "@/assets/images/garage-bank/garageBank";


interface GarageItemProps {
  garageLevel: number;
  onGarageBuy: () => void;
}

export function GarageItem({
  garageLevel, onGarageBuy
}: GarageItemProps) {
  const garageImg = getGarageImage(garageLevel);

  return (
    <View style={styles.container}>
      <Image
        source={garageImg}
        style={styles.backgroundListItem}
        resizeMode="cover"
      />
      <View style={styles.infoContainer}>
        <View>
          <Text style={styles.title}>Добротный гараж</Text>
          <Text style={styles.subtitle}>количество мест: {garageLevel}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <FontAwesome5 name="bitcoin" size={18} color={colors.textGold} />
            <Text style={styles.price}>25000 BYN</Text>
          </View>
          <Pressable onPress={onGarageBuy} style={styles.buyBtn}>
            <Text style={styles.btnText}>КУПИТЬ</Text>
          </Pressable>
        </View>
      </View>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    height: 120,
    borderWidth: 2,
    borderRadius: 8,
    borderColor: '#ffffff',
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    gap: 8,
    paddingRight: 8
  },

  backgroundListItem: {
    backgroundColor: colors.mainBackground,
    width: '42%',
    height: '100%',
  },

  title: {
    color: colors.textBlack,
    fontWeight: 'bold',
    fontSize: 18
  },

  subtitle: {
    color: colors.textBlack,
  },

  infoContainer: {
    flex: 1,
    justifyContent: 'space-between'
  },

  footer: {
    alignItems: 'flex-end',
    width: '100%',
    gap: 4,
    paddingBottom: 4
  },

  priceContainer: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center'
  },

  price: {
    fontWeight: 'bold',
    color: colors.textBlack
  },

  buyBtn: {
    backgroundColor: colors.blueButtonColor,
    width: '100%',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center'
  },

  btnText: {
    color: colors.textMain,
    fontWeight: 'bold'
  }
});