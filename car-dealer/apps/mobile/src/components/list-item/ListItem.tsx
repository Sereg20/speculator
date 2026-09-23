import {
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import type { ReactNode } from "react";

interface ListItemProps {
  children: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ListItem({
  children,
  onPress,
  disabled = false,
  style,
}: ListItemProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.container,
        style,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#122026',
  },

  pressed: {
    opacity: 0.7,
  },
});
