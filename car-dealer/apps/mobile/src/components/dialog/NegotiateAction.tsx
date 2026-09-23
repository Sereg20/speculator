import { colors } from "@/theme/colors";
import {
  Text,
  StyleSheet,
  Pressable,
} from "react-native";


interface NegotiateActionProps {
  color: string,
  text: string,
  energyCost: number,
  disabled: boolean,
  onPress: () => void;
}

export function NegotiateAction({
  color, text, onPress, disabled, energyCost
}: NegotiateActionProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: color },
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >

      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  text: {
    color: colors.textMain,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  }

});