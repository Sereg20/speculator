import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  FlatList,
  Dimensions,
} from "react-native";
import { colors } from "@/theme/colors";
import { Car } from "@/api/cars";
import { DefectItemIcon } from "./DefectItemIcon";
import { useListingInquiry } from "@/hooks/useListingInquiry";
import { router } from "expo-router";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { CarSlotEmpty } from "./CarSlotEmpty";
import { getGarageImage } from "@/assets/images/garage-bank/garageBank";

interface CarCardProps {
  car: Car | null;
  onSell: (selectedCar: Car) => void;
  onCancelListing: (listingId: string) => void;
  onRepair: (selectedCar: Car) => void;
  onInspect: (selectedCar: Car) => void;
  onMarket: () => void;
  index: number;
  scrollX: SharedValue<number>;
  garageLevel: number;
}

export function CarSlot({
  car,
  onSell,
  onCancelListing,
  onRepair,
  onInspect,
  onMarket,
  index,
  scrollX,
  garageLevel,
}: CarCardProps) {
  const garageImg = getGarageImage(garageLevel);
  const { width, height } = Dimensions.get("screen");


  const cardWidth = width * 0.7;

  const rnAmimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            scrollX.value,
            [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ],
            [
              -width * 0.25,
              0,
              width * 0.25,
            ],
            Extrapolation.CLAMP
          ),
        },
        {
          scale: interpolate(
            scrollX.value,
            [
              (index - 1) * width,
              index * width,
              (index + 1) * width,
            ],
            [0.9, 1, 0.9],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const { inquiry: activeInquiry } = useListingInquiry(
    car?.activeListing?.id ?? null
  );

  if (!car) {
    return (
      <CarSlotEmpty
        onMarket={onMarket}
        index={index}
        scrollX={scrollX}
        garageLevel={garageLevel}
      />
    );
  }

  const activeDefects = car.revealedDefects
    ? car.revealedDefects.filter(
        (defect) => !defect.is_quick_fixed
      )
    : [];

  const carState = getStateText(car.state);

  function getStateText(state: string) {
    switch (state) {
      case "listed_for_sale":
        return `НА ПРОДАЖЕ • ${car?.activeListing?.asking_price ?? 0} BYN`;

      case "in_repair":
        return "В РЕМОНТЕ";

      default:
        return "В ГАРАЖЕ";
    }
  }

  function onCancelListingPress() {
    if (!car?.activeListing?.id) return;

    onCancelListing(car.activeListing.id);
  }

  function onInquiryPress() {
    if (!car?.activeListing) return;

    router.push({
      pathname: "/listing/[listingId]",
      params: {
        listingId: car.activeListing.id,
        inquiryId: activeInquiry?.id,
      },
    });
  }

  const canSell = activeDefects.length === 0;

  return (
    <Animated.View
      style={[
        styles.carSlotContainer,
        { width },
        rnAmimatedStyle,
      ]}
    >
      <View
        style={[
          styles.carSlot,
          {
            width: cardWidth,
            height: height * 0.77,
            maxHeight: 525
          },
        ]}
      >
        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <View style={styles.hero}>
          <Image
            source={garageImg}
            style={styles.carSlotBackground}
            resizeMode="cover"
          />

          {/* Dark overlay */}
          <View style={styles.heroOverlay} />

          {/* Top gradient-ish dark area */}
          <View style={styles.heroTopShade} />

          {/* Slot number */}
          <View style={styles.slotBadge}>
            <Text style={styles.slotBadgeText}>
              {String(index + 1)}
            </Text>
          </View>

          {/* Status */}
          <View
            style={[
              styles.statusBadge,
              car.state === "listed_for_sale" &&
                styles.statusBadgeListed,
              car.state === "in_repair" &&
                styles.statusBadgeRepair,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                car.state === "listed_for_sale" &&
                  styles.statusDotListed,
                car.state === "in_repair" &&
                  styles.statusDotRepair,
              ]}
            />

            <Text style={styles.statusText}>
              {carState}
            </Text>
          </View>

          {/* Car name */}
          <View style={styles.carNameContainer}>
            <Text
              style={styles.carMake}
              numberOfLines={1}
            >
              {car.make}
            </Text>

            <Text
              style={styles.carModel}
              numberOfLines={1}
            >
              {car.model}
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* CAR STATS */}
        {/* ================================================= */}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>ГОД</Text>
            <Text style={styles.statValue}>{car.year}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.stat}>
            <Text style={styles.statLabel}>ПРОБЕГ</Text>
            <Text style={styles.statValue}>{car.mileage.toLocaleString()}</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.stat}>
            <Text style={styles.statLabel}>ПОКУПКА</Text>
            <Text style={styles.priceValue}>{car.purchase_price.toLocaleString()}</Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* CONDITION */}
        {/* ================================================= */}

        <View style={styles.condition}>
          <View style={styles.conditionHeader}>
            <View>
              <Text style={styles.conditionTitle}>СОСТОЯНИЕ</Text>
            </View>

            <View
              style={[
                styles.defectBadge,
                activeDefects.length > 0
                  ? styles.defectBadgeWarning
                  : styles.defectBadgeGood,
              ]}
            >
              <Text
                style={[
                  styles.defectBadgeText,
                  activeDefects.length > 0
                    ? styles.defectBadgeTextWarning
                    : styles.defectBadgeTextGood,
                ]}
              >
                {activeDefects.length}
              </Text>
            </View>
          </View>

          <View style={styles.defectsContainer}>
            <FlatList
              data={activeDefects}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <DefectItemIcon defect={item} />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshing={false}
              onRefresh={() => {}}
              ListEmptyComponent={
                <View style={styles.noDefects}>
                  <View style={styles.successIcon}>
                    <Text style={styles.successIconText}>
                      ✓
                    </Text>
                  </View>

                  <View style={styles.noDefectsContent}>
                    <Text style={styles.noDefectsTitle}>Всё в порядке</Text>
                    <Text style={styles.noDefectsText}>Активных дефектов нет</Text>
                  </View>
                </View>
              }
            />
          </View>
        </View>

        {/* ================================================= */}
        {/* ACTIONS */}
        {/* ================================================= */}

        <View style={styles.actions}>
          {/* MAIN ACTIONS */}

          {(car.state === "purchased" ||
            car.state === "in_repair") && (
            <View style={styles.mainActions}>
              {/* SELL */}

              <Pressable
                onPress={() => onSell(car)}
                disabled={!canSell}
                style={({ pressed }) => [
                  styles.sellButton,
                  !canSell && styles.disabledButton,
                  pressed &&
                    canSell &&
                    styles.pressedButton,
                ]}
              >
                <Text
                  style={[
                    styles.sellButtonText,
                    !canSell &&
                      styles.disabledButtonText,
                  ]}
                >ПРОДАТЬ</Text>
              </Pressable>

              {/* REPAIR */}

              <Pressable
                onPress={() => onRepair(car)}
                style={({ pressed }) => [
                  styles.repairButton,
                  pressed && styles.pressedButton,
                ]}
              >
                <Text style={styles.repairButtonText}>
                  РЕМОНТ
                </Text>
              </Pressable>
            </View>
          )}

          {/* ================================================= */}
          {/* INSPECT */}
          {/* ================================================= */}

          {(car.state === "purchased" ||
            car.state === "in_repair") && (
            <Pressable
              onPress={() => onInspect(car)}
              style={({ pressed }) => [
                styles.inspectButton,
                pressed && styles.pressedButton,
              ]}
            >
              <Text style={styles.inspectTitle}>ДИАГНОСТИКА</Text>
            </Pressable>
          )}

          {/* ================================================= */}
          {/* LISTING */}
          {/* ================================================= */}

          {car.state === "listed_for_sale" && (
            <View style={styles.listingButton}>
              <View style={styles.listingLeft}>
                <View style={styles.listingDot} />

                <View>
                  <Text style={styles.listingTitle}>НА ПРОДАЖЕ</Text>
                  <Text style={styles.listingPrice}>
                    {car.activeListing?.asking_price ?? 0} BYN
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={onCancelListingPress}
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.pressedButton,
                ]}
              >
                <Text style={styles.cancelButtonText}>
                  СНЯТЬ
                </Text>
              </Pressable>
              
            </View>
          )}

          {/* ================================================= */}
          {/* INQUIRY */}
          {/* ================================================= */}

          {car.state === "listed_for_sale" && activeInquiry && (
            <Pressable
              onPress={onInquiryPress}
              style={({ pressed }) => [
                styles.inquiryButton,
                pressed && styles.pressedButton,
              ]}
            >
              <View style={styles.inquiryIcon}>
                <Text style={styles.inquiryIconText}>
                  !
                </Text>
              </View>

              <View style={styles.inquiryContent}>
                <Text style={styles.inquiryTitle}>ЕСТЬ ПРЕДЛОЖЕНИЕ</Text>
                <Text style={styles.inquiryPrice}>
                  {activeInquiry.offered_price.toLocaleString(
                    "ru-RU"
                  )}{" "}
                  BYN
                </Text>
              </View>

              <Text style={styles.inquiryArrow}>
                →
              </Text>
            </Pressable>
          )}
          {car.state === "listed_for_sale" && !activeInquiry && (
            <View style={styles.inquiryButtonFallback}>
              <View style={styles.inquiryIconFallback}>
                <Text style={styles.inquiryIconText}>
                  !
                </Text>
              </View>

              <View style={styles.inquiryContent}>
                <Text style={styles.inquiryTitleFallback}>Здесь отобразится активное предложение</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  /*
   * =====================================================
   * CONTAINER
   * =====================================================
   */

  carSlotContainer: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  carSlot: {
    overflow: "hidden",
    borderColor: colors.accentBlueColor,
    borderWidth: 3,
    boxShadow: "0px 0px 16px #49E2FF",
    backgroundColor: "rgba(7, 25, 27, 0.97)",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },

  /*
   * =====================================================
   * HERO
   * =====================================================
   */

  hero: {
    height: '44%',

    position: "relative",
    overflow: "hidden",

    backgroundColor: "#142729",
  },

  carSlotBackground: {
    position: "absolute",

    width: "100%",
    height: "100%",

    transform: [
      {
        scale: 1.04,
      },
    ],
  },

  heroOverlay: {
    position: "absolute",

    left: 0,
    right: 0,
    top: 0,
    bottom: 0,

    backgroundColor: "rgba(5, 15, 17, 0.42)",
  },

  heroTopShade: {
    position: "absolute",

    left: 0,
    right: 0,
    top: 0,

    height: 70,

    backgroundColor: "rgba(0,0,0,0.30)",
  },

  slotBadge: {
    position: "absolute",

    top: 12,
    left: 12,

    width: 34,
    height: 34,

    borderRadius: 8,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(5, 15, 17, 0.82)",

    borderWidth: 1,
    borderColor: "rgba(242, 184, 63, 0.48)",
  },

  slotBadgeText: {
    color: "#F4C55B",

    fontSize: 12,
    fontWeight: "900",
  },

  statusBadge: {
    position: "absolute",

    top: 12,
    right: 12,

    maxWidth: "65%",

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 9,
    paddingVertical: 7,

    borderRadius: 13,

    backgroundColor: "rgba(5, 15, 17, 0.84)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  statusBadgeListed: {
    borderColor: "rgba(83, 202, 125, 0.42)",
  },

  statusBadgeRepair: {
    borderColor: "rgba(242, 184, 63, 0.42)",
  },

  statusDot: {
    width: 6,
    height: 6,

    marginRight: 6,

    borderRadius: 3,

    backgroundColor: "#72D88D",
  },

  statusDotListed: {
    backgroundColor: "#65D78B",
  },

  statusDotRepair: {
    backgroundColor: "#F2B83F",
  },

  statusText: {
    color: "#F0F2ED",

    fontSize: 8,
    fontWeight: "900",

    letterSpacing: 0.5,
  },

  carNameContainer: {
    position: "absolute",

    left: 15,
    right: 15,
    bottom: 13,
  },

  carMake: {
    color: "#F5C75E",

    fontSize: 11,
    fontWeight: "900",

    textTransform: "uppercase",

    letterSpacing: 1.2,

    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  },

  carModel: {
    color: "#FFFFFF",

    fontSize: 23,
    lineHeight: 26,

    fontWeight: "900",

    marginTop: 1,

    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: {
      width: 1,
      height: 2,
    },
    textShadowRadius: 5,
  },

  /*
   * =====================================================
   * STATS
   * =====================================================
   */

  stats: {
    minHeight: 66,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 9,

    backgroundColor: "rgba(3, 17, 19, 0.82)",

    borderTopWidth: 1,
    borderBottomWidth: 1,

    borderColor: "rgba(255,255,255,0.055)",
  },

  stat: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",
  },

  statDivider: {
    width: 1,
    height: 32,

    backgroundColor: "rgba(255,255,255,0.10)",
  },

  statLabel: {
    color: "#7F9691",
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 3,
  },

  statValue: {
    color: colors.textMain,
    fontSize: 13,
    fontWeight: "bold",
  },

  priceValue: {
    color: colors.textGold,
    fontSize: 13,
    fontWeight: "bold",
  },

  /*
   * =====================================================
   * CONDITION
   * =====================================================
   */

  condition: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },

  conditionHeader: {
    flexDirection: "row",

    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 7,
  },

  conditionEyebrow: {
    color: "#718883",

    fontSize: 7,
    fontWeight: "900",

    letterSpacing: 1,
  },

  conditionTitle: {
    color: "#EEF1EC",

    fontSize: 13,
    fontWeight: "900",

    marginTop: 1,
  },

  defectBadge: {
    minWidth: 28,
    height: 28,

    borderRadius: 8,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
  },

  defectBadgeWarning: {
    backgroundColor: "rgba(224, 88, 65, 0.13)",
    borderColor: "rgba(224, 88, 65, 0.34)",
  },

  defectBadgeGood: {
    backgroundColor: "rgba(80, 195, 111, 0.12)",
    borderColor: colors.greenButton,
  },

  defectBadgeText: {
    fontSize: 11,
    fontWeight: "900",
  },

  defectBadgeTextWarning: {
    color: "#F07862",
  },

  defectBadgeTextGood: {
    color: colors.textGreen,
  },

  defectsContainer: {
    height: 58,

    overflow: "hidden",

    borderRadius: 11,

    backgroundColor: "rgba(0,0,0,0.16)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.045)",
  },

  listContent: {
    paddingVertical: 3,
  },

  noDefects: {
    flex: 1,

    minHeight: 56,

    paddingHorizontal: 9,

    flexDirection: "row",
    alignItems: "center",
  },

  successIcon: {
    width: 27,
    height: 27,

    borderRadius: 8,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(77, 198, 111, 0.16)",

    borderWidth: 1,
    borderColor: colors.greenButton,
  },

  successIconText: {
    color: colors.textGreen,

    fontSize: 14,
    fontWeight: "900",
  },

  noDefectsContent: {
    marginLeft: 8,
  },

  noDefectsTitle: {
    color: "#EAF0EA",

    fontSize: 10,
    fontWeight: "900",
  },

  noDefectsText: {
    color: "#728782",

    fontSize: 8,

    marginTop: 2,
  },

  /*
   * =====================================================
   * ACTIONS
   * =====================================================
   */

  actions: {
    paddingHorizontal: 12,
    paddingBottom: 12,

    gap: 8,
  },

  mainActions: {
    flexDirection: "row",

    gap: 6,
  },

  /*
   * SELL
   */

  sellButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.greenButton,
    borderWidth: 1,
    borderColor: "#368d4b",

    shadowColor: "#368d4b",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.38,
    shadowRadius: 5,
    elevation: 4,
  },

  sellButtonText: {
    color: colors.textMain,
    fontSize: 12,
    fontWeight: "bold",
  },

  /*
   * REPAIR
   */

  repairButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orangeButtonColor,
    borderWidth: 1,
    borderColor: "#d48d29",
  },

  repairButtonText: {
    color: colors.textMain,
    fontSize: 12,
    fontWeight: "bold",
  },

  /*
   * DISABLED
   */

  disabledButton: {
    backgroundColor: "rgba(110, 122, 119, 0.22)",

    borderColor: "rgba(255,255,255,0.07)",

    shadowOpacity: 0,
    elevation: 0,
  },

  disabledButtonText: {
    color: "#6E7C79",
  },

  /*
   * INSPECT
   */

  inspectButton: {
    minHeight: 40,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    backgroundColor: colors.blueButtonColor,
    borderWidth: 1,
    borderColor: "#1580d2",
  },

  inspectTitle: {
    color: colors.textMain,
    fontSize: 12,
    fontWeight: "bold",
  },

  /*
   * =====================================================
   * LISTING
   * =====================================================
   */

  listingButton: {
    minHeight: 44,

    paddingLeft: 10,
    paddingRight: 5,

    borderRadius: 8,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "rgba(55, 147, 91, 0.10)",

    borderWidth: 1,
    borderColor: colors.greenButton,
  },

  listingLeft: {
    flex: 1,

    flexDirection: "row",
    alignItems: "center",
  },

  listingDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: "#63D88A",
  },

  listingTitle: {
    color: colors.textGreen,
    fontSize: 9,
    fontWeight: "bold",
    marginLeft: 7,
  },

  listingPrice: {
    color: colors.textGold,
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 7,
    marginTop: 1,
  },

  cancelButton: {
    height: 32,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.redButtonColor,
    borderWidth: 1,
    borderColor: "rgba(195, 58, 43, 0.25)"
  },

  cancelButtonText: {
    color: colors.textMain,
    fontSize: 12,
    fontWeight: "bold",
  },

  /*
   * =====================================================
   * INQUIRY
   * =====================================================
   */

  inquiryButton: {
    minHeight: 48,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "rgba(242, 184, 63, 0.10)",

    borderWidth: 1,
    borderColor: colors.textGold,

    shadowColor: "#D79820",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.16,
    shadowRadius: 5,

    elevation: 3,
  },

  inquiryButtonFallback: {
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "rgba(243, 204, 120, 0.1)",

    borderWidth: 1,
    borderColor: colors.textGray,

    shadowColor: "#D79820",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.16,
    shadowRadius: 5,

    elevation: 3,
  },

  inquiryIcon: {
    width: 29,
    height: 29,

    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#D99A24",

    borderWidth: 1,
    borderColor: "#F3C85C",
  },

  inquiryIconFallback: {
    width: 29,
    height: 29,

    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.greyButton,

    borderWidth: 1,
    borderColor: "#585a5b",
  },

  inquiryIconText: {
    color: "#17231E",

    fontSize: 15,
    fontWeight: "900",
  },

  inquiryContent: {
    flex: 1,
    marginLeft: 8,
  },

  inquiryTitle: {
    color: colors.textGold,
    fontSize: 9,
    fontWeight: "bold",
  },

  inquiryTitleFallback: {
    color: colors.textMain,
    fontSize: 11
  },

  inquiryPrice: {
    color: colors.textMain,
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 1,
  },

  inquiryArrow: {
    color: colors.textGold,
    fontSize: 18,
    fontWeight: "900",
  },

  /*
   * =====================================================
   * PRESS
   * =====================================================
   */

  pressedButton: {
    opacity: 0.78,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },
});