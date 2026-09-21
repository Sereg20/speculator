import { colors } from "@/theme/colors";
import Slider from "@react-native-community/slider";
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

interface GameSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;

  minimumTrackColor?: string;
  maximumTrackColor?: string;
  thumbColor?: string;

  showValue?: boolean;
  valueFormatter?: (value: number) => string;

  style?: StyleProp<ViewStyle>;
}

export function GameSlider({
  value,
  min,
  max,
  step = 1,
  onChange,
  minimumTrackColor = colors.accentBlueColor,
  maximumTrackColor = "#334155",
  thumbColor = "#FFFFFF",
  showValue = true,
  valueFormatter = (value) => value.toString(),
  style,
}: GameSliderProps) {
  return (
    <View style={[styles.container, style]}>
      {showValue && (
        <Text style={styles.value}>
          {valueFormatter(value)}
        </Text>
      )}

      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={minimumTrackColor}
        maximumTrackTintColor={maximumTrackColor}
        thumbTintColor={thumbColor}
      />

      <View style={styles.range}>
        <Text style={styles.rangeText}>
          {valueFormatter(min)}
        </Text>

        <Text style={styles.rangeText}>
          {valueFormatter(max)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  value: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "bold",
    color: colors.textMain,
    marginBottom: 8,
  },

  slider: {
    width: "100%",
    height: 40,
  },

  range: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  rangeText: {
    color: "#94A3B8",
    fontSize: 12,
  },
});