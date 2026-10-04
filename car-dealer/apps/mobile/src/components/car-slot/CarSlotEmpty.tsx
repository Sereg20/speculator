import { getGarageImage } from "@/assets/images/garage-bank/garageBank";
import { colors } from "@/theme/colors";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

interface CarSlotEmptyProps {
  onMarket: () => void;
  index: number,
  scrollX: SharedValue<number>;
  garageLevel: number;
}

export function CarSlotEmpty({
  onMarket,
  index,
  scrollX,
  garageLevel,
}: CarSlotEmptyProps) {
  const garageImg = getGarageImage(garageLevel);
  const { width, height } = Dimensions.get("screen");

  const rnAnimatedStyle = useAnimatedStyle(() => {
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
            Extrapolation.CLAMP,
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
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.carSlotContainer,
        { width },
        rnAnimatedStyle,
      ]}
    >
      <View style={[styles.carSlot, {
          height: height * 0.77,
          maxHeight: 525
        }]}>
        {/* Garage preview */}
        <View style={styles.preview}>
          <Image
            source={garageImg}
            style={styles.carSlotBackground}
            resizeMode="cover"
          />

          <View style={styles.previewOverlay} />

          {/* Slot number */}
          <View style={styles.carSlotIndex}>
            <Text style={styles.carSlotIndexText}>
              {String(index + 1).padStart(2, "0")}
            </Text>
          </View>

        
        </View>

        {/* Information */}
        <View style={styles.info}>
          <Text style={styles.title}>
            НЕТ АВТОМОБИЛЯ
          </Text>

          <Text style={styles.description}>
            Купи автомобиль на рынке
            и он появится здесь
          </Text>
        </View>

        {/* Action */}
        <View style={styles.actions}>
          <Pressable
            onPress={onMarket}
            style={({ pressed }) => [
              styles.onMarketBtn,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.btnText}>ПОЙТИ НА РЫНОК</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  carSlotContainer: {
    alignItems: "center",
  },

  carSlot: {
    width: "66%",
    height: 440,

    backgroundColor: "#202323",

    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(73, 226, 255, 0.45)",

    overflow: "hidden",

    boxShadow:
      "0px 6px 18px rgba(0, 0, 0, 0.45)",
  },

  preview: {
    height: "48%",
    position: "relative",
    overflow: "hidden",
  },

  carSlotBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  previewOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(10, 14, 15, 0.62)",
  },

  carSlotIndex: {
    position: "absolute",
    top: 0,
    left: 0,

    width: 48,
    height: 36,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(20, 24, 25, 0.9)",

    borderBottomRightRadius: 12,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(73, 226, 255, 0.35)",
  },

  carSlotIndexText: {
    color: colors.textMain,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },

  info: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  title: {
    color: colors.textMain,

    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },

  description: {
    marginTop: 8,

    color: "rgba(255, 255, 255, 0.5)",

    fontSize: 13,
    lineHeight: 18,

    textAlign: "center",
  },

  actions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  onMarketBtn: {
    minHeight: 44,
    borderRadius: 8,

    backgroundColor: colors.blueButtonColor,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 16,

    boxShadow:
      "0px 3px 8px rgba(0, 0, 0, 0.3)",
  },

  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  btnText: {
    color: colors.textMain,

    fontSize: 14,
    fontWeight: "bold",
  },
});