import {
  Pressable,
  StyleSheet,
  Text,
  type GestureResponderEvent,
} from "react-native";
import { colors } from "@/theme/colors";
import { InspectionTool } from "@/api/market";

interface InspectionItemProps {
  item: InspectionTool,
  selected: boolean;
  onPress: (event: GestureResponderEvent) => void;
}

export function InspectionItem({
  item,
  selected = false,
  onPress,
}: InspectionItemProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.title}>{item.label}</Text>

    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.greyColor,
    borderRadius: 8,
    overflow: "hidden",
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  selected: {
    backgroundColor: colors.blueButtonColor,
  },

  pressed: {
    opacity: 0.7,
  },

  title: {
    color: colors.textMain,
    fontWeight: "bold",
    
  },

  energy: {
    marginTop: 4,
    color: colors.textMain,
    fontSize: 12,
  },
});