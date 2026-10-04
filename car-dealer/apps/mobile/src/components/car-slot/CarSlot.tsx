import { View, Text, StyleSheet, Image, Pressable, FlatList, Dimensions } from "react-native";
import { colors } from "@/theme/colors";
import { Car } from "@/api/cars";
import { DefectItemIcon } from "./DefectItemIcon";
import { useListingInquiry } from "@/hooks/useListingInquiry";
import { router } from "expo-router";
import Animated, { Extrapolation, interpolate, SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { CarSlotEmpty } from "./CarSlotEmpty";

interface CarCardProps {
  car: Car | null;
  onSell: (selectedCar: Car) => void;
  onCancelListing: (listingId: string) => void;
  onRepair: (selectedCar: Car) => void;
  onInspect: (selectedCar: Car) => void;
  onMarket: () => void;
  index: number;
  scrollX: SharedValue<number>;
}

export function CarSlot({ car, onSell, onCancelListing, onRepair, onInspect, onMarket, index, scrollX }: CarCardProps) {
  const {width} = Dimensions.get("screen");
  const rnAmimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [-width * 0.25, 0, width * 0.25],
            Extrapolation.CLAMP
          ),
        },
        {
          scale: interpolate(
            scrollX.value,
            [(index - 1) * width, index * width, (index + 1) * width],
            [0.9, 1, 0.9],
            Extrapolation.CLAMP
          )
        }
      ]
    }
  });

  const { inquiry: activeInquiry } = useListingInquiry(
    car?.activeListing?.id ?? null,
  );

  if (!car) {
    return <CarSlotEmpty onMarket={onMarket} index={index} scrollX={scrollX}/>
  }
  
  

  const activeDefects = car.revealedDefects ? car.revealedDefects.filter(defect => !defect.is_quick_fixed) : [];
  const carState = getStateText(car.state);
  
  
  function getStateText(state: string) {
    switch (state) {
      case "listed_for_sale":
        return `НА ПРОДАЖЕ (${car?.activeListing?.asking_price} BYN)`
      case "in_repair":
        return "В РЕМОНТЕ"
      default:
        return "В ГАРАЖЕ"
    }
  }

  function onCancelListingPress() {
    if (!car?.activeListing?.id) return;

    return onCancelListing(car.activeListing?.id);
  }

  function onInquiryPress() {
    if (!car?.activeListing) return;

    router.push({
      pathname: "/listing/[listingId]",
      params: {
        listingId: car.activeListing.id,
        inquiryId: activeInquiry?.id
      },
    });
  }

  return (
    <Animated.View style={[styles.carSlotContainer, {width: width}, rnAmimatedStyle]}>
      <View style={styles.carSlot}>
        <View style={{ height: '50%' }}>
          <View>
            <View style={styles.carSlotIndex}>
              <Text style={{ color: colors.textMain }}>{index + 1}</Text>
            </View>
          </View>
          <Image
            source={require("@/../assets/images/backgrounds/garage/background_garage1.png")}
            style={styles.carSlotBackground}
            resizeMode="cover"
          />

          <Text style={styles.title}>{car.make} {car.model}</Text>
          <Text style={styles.status}>{carState}</Text>
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
          <FlatList
            data={activeDefects}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DefectItemIcon defect={item} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={false}
            onRefresh={() => { }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.defectsFallbackText}>
                  Не обнаружено
                </Text>
              </View>
            }
          />
        </View>
        <View style={styles.actions}>
          {(car.state === "purchased" || car.state === "in_repair") && (
            <View style={styles.repairActions}>
              <Pressable onPress={() => { onSell(car) }} disabled={activeDefects.length > 0} style={[styles.sellBtn,
                activeDefects.length > 0
                  ? styles.btnDisabled
                  : {}]}>
                <Text style={styles.btnText}>ПРОДАТЬ</Text>
              </Pressable>
              <Pressable onPress={() => { onRepair(car) }} style={styles.repairBtn}>
                <Text style={styles.btnText}>РЕМОНТ</Text>
              </Pressable>
            </View>
          )}
          <View>
            {(car.state === "purchased" || car.state === "in_repair") &&
              <Pressable onPress={() => { onInspect(car) }} style={styles.inspectBtn}>
                <Text style={styles.btnText}>ДИАГНОСТИКА</Text>
              </Pressable>
            }
            {car.state === "listed_for_sale" &&
              <Pressable onPress={onCancelListingPress} style={styles.cancelListingBtn}>
                <Text style={styles.btnText}>СНЯТЬ С ПРОДАЖИ</Text>
              </Pressable>
            }
            {activeInquiry && (
              <Pressable onPress={onInquiryPress}><Text>ЕСТЬ!</Text></Pressable>
            )}
          </View>        
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  carSlotContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },

  carSlot: {
    position: 'relative',
    height: 440,
    width: '66%',
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
    height: 40,
    borderBottomWidth: 2,
    borderColor: '#3c5a4d',
    marginBottom: 12,
    justifyContent: 'center'
  },


  listContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },

  emptyContainer: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },

  defectsFallbackText: {
    color: colors.textMain,
    fontSize: 16,
    textAlign: 'center'
  },

  actions: {
    marginHorizontal: 16,
    gap: 8
  },

  repairActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  inspectBtn: {
    backgroundColor: colors.blueButtonColor,
    width: '100%',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center'
  },

  sellBtn: {
    backgroundColor: colors.greenButton,
    width: '47%',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center'
  },

  repairBtn: {
    backgroundColor: colors.orangeButtonColor,
    width: '47%',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center'
  },

  cancelListingBtn: {
    backgroundColor: colors.redButtonColor,
    width: '100%',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center'
  },

  cancelRepairBtn: {
    backgroundColor: colors.orangeButtonColor,
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