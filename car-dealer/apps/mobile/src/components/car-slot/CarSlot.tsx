import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { colors } from "@/theme/colors";
import { Car } from "@/api/cars";

interface CarCardProps {
  car: Car;
}

export function CarSlot({ car }: CarCardProps) {

  return (
    <View style={styles.carSlot}>
      <View style={{height: '50%'}}>
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
      
        <Text style={styles.title}>{car.make} {car.model}</Text>
        <Text style={styles.status}>В ГАРАЖЕ</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.infoBlock}>
          <Text style={styles.infoItemLabel}>Год Выпуска:</Text>
          <Text style={styles.infoItemValue}>{car.year}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoItemLabel}>Пробег:</Text>
          <Text style={styles.infoItemValue}>{car.mileage}</Text>
        </View>
        <View style={styles.infoBlock}>
          <Text style={styles.infoItemLabel}>Цена покупки:</Text>
          <Text style={styles.infoItemValue}>{car.purchase_price} BUN</Text>
        </View>
      </View>
      <View style={styles.defectsList}>
          <Text style={styles.defectsFallbackText}>Неисправностей нет</Text>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.sellBtn}>
          <Text style={styles.btnText}>ПРОДАТЬ</Text>  
        </Pressable>
        <Pressable style={styles.repairBtn}>
          <Text style={styles.btnText}>РЕМОНТ</Text>  
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carSlot: {
    position: 'relative',
    width: '70%',
    height: 440,
    backgroundColor: colors.mainBackground,
    borderColor: colors.accentBlueColor,
    borderRadius: 10,
    borderWidth: 3,
    boxShadow: "0px 0px 16px #49E2FF",
    overflow: 'hidden',
  },
  
  carSlotBackground: {
    flex: 1,
    width: "100%",
    minHeight: 140
  },

  carSlotIndex: {
    backgroundColor: '#2582D5',
    color: colors.textMain,
    borderBottomRightRadius: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
  },

  title: {
    marginTop: 10,
    color: colors.textMain,
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 18
  },

  status: {
    fontSize: 14,
    textAlign: 'center',
    color: '#7B9BAC',
  },

  info: {
    marginTop: 12,
    paddingVertical: 4,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#3c5a4d',
    position: 'relative',
    marginHorizontal: 16
  },

  infoBlock: {
    marginTop: 2,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  infoItemLabel: {
    color: colors.textDark,
    fontWeight: 'bold'
  },

  infoItemValue: {
    color: colors.textMain,
  },

  defectsList: {
    marginHorizontal: 16,
    paddingVertical: 4,
    height: 70,
    borderBottomWidth: 2,
    borderColor: '#3c5a4d',
    marginBottom: 12,
    justifyContent: 'center'
  },

  defectsFallbackText: {
    color: colors.textMain,
    fontSize: 16,
    textAlign: 'center'
  },

  actions: {
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  sellBtn: {
    backgroundColor: colors.orangeButtonColor,
    width: '45%',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center'
  },

  repairBtn: {
    backgroundColor: colors.blueButtonColor,
    width: '45%',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center'
  },

  btnText: {
    color: colors.textMain,
    fontWeight: 'bold'
  }

});