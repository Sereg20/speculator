import { colors } from "@/theme/colors";
import {
  Text,
  StyleSheet,
  Pressable,
  View,
} from "react-native";
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';


interface InspectDialogActionProps {
  color: string,
  text: string,
  energyCost: number,
  disabled: boolean,
  onPress: () => void;
}

export function InspectDialogAction({
  color, text, energyCost, onPress, disabled
}: InspectDialogActionProps) {
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
      <View style={styles.energyContainer}>
        ⚡ <Text style={styles.energyCost}>{energyCost}</Text>
      </View>
      
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 80,
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
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
    marginTop: 4,
    textAlign: 'center'
  },

  energyContainer: {
    flexDirection: 'row'
  },

  energyCost: {
    color: colors.textMain,
    fontWeight: 'bold'
  }

});