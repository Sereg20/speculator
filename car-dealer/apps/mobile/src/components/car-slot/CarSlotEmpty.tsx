import { View, Text, StyleSheet, Image, Pressable, FlatList } from "react-native";
import { colors } from "@/theme/colors";
import { Car } from "@/api/cars";
import { DefectItemIcon } from "./DefectItemIcon";

interface CarSlotEmptyProps {
  onMarket: () => void
}

export function CarSlotEmpty({ onMarket }: CarSlotEmptyProps) {

  return (
    <View style={styles.carSlot}>
      <View style={{height: '40%'}}>
        <View>
          <View style={styles.carSlotIndex}>
            <Text style={{color: colors.textMain}}>1</Text>
          </View>
        </View>
        <Image
          source={require("@/../assets/images/backgrounds/background_garage1.png")}
          style={styles.carSlotBackground}
          resizeMode="cover"
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.title}>В ГАРАЖЕ СЕЙЧАС НЕТ АВТОМОБИЛЕЙ</Text>
      </View>
      
      <View style={styles.actions}>
        <Pressable onPress={onMarket} style={styles.onMarketBtn}>
          <Text style={styles.btnText}>НА РЫНОК</Text>  
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carSlot: {
    position: 'relative',
    paddingBottom: 10,
    width: '70%',
    height: 440,
    backgroundColor: colors.greyColor,
    borderColor: colors.accentBlueColor,
    borderRadius: 10,
    borderWidth: 3,
    boxShadow: "0px 0px 16px #49E2FF",
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  
  carSlotBackground: {
    flex: 1,
    width: "100%",
    minHeight: 140
  },

  carSlotIndex: {
    backgroundColor: "#3f4242",
    color: colors.textMain,
    borderBottomRightRadius: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
  },

  title: {
    color: colors.textMain,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 18
  },


  info: {
   
  },

  actions: {
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  onMarketBtn: {
    backgroundColor: colors.blueButtonColor,
    width: '100%',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center'
  },

  btnText: {
    color: colors.textMain,
    fontWeight: 'bold'
  },

  btnDisabled: {
    opacity: 0.7
  }

});