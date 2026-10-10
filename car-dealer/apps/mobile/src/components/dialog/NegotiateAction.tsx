import { colors } from "@/theme/colors";
import {
  Text,
  StyleSheet,
  Pressable,
  View,
} from "react-native";
import AntDesign from '@expo/vector-icons/AntDesign';


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
      {energyCost > 0 &&
        <View style={styles.energyContainer}>
          <AntDesign name="thunderbolt" size={14} color={colors.textGold} style={styles.icon}/>
          <Text style={styles.energyCost}>{energyCost}</Text>
        </View>
      }
      
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
    flexDirection: 'row',
    gap: 6,
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
    textAlign: 'center',
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  },

  energyContainer: {
    flexDirection: 'row',
    gap: 1,
    alignItems: 'center'
  },

  energyCost: {
    color: colors.textGold,
    fontWeight: 'bold',
    fontSize: 14,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  },

  icon: {
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  }

});