import { MarketListing } from "@/api/market";
import { colors } from "@/theme/colors";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ImageBackground,
} from "react-native";
import { router } from "expo-router";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';


interface NegotiateActionProps {
  color: string,
  text: string,
  iconName: string,
  iconColor: string,
  disabled: boolean,
  onPress: () => void;
}

export function NegotiateAction({
  color, text, iconName, iconColor, onPress, disabled
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
      <FontAwesome5 name={iconName} size={20} color={iconColor} />
      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '23%',
    height: '100%',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },

  buttonPressed: {

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
  }

});