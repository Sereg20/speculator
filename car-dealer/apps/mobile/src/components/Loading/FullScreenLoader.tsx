import {
  View,
  Text,
  StyleSheet,
  Image,
} from "react-native";
import { colors } from "@/theme/colors";


export function FullScreenLoader() {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
      <Image
      source={require("@/../assets/images/icon_formatter.webp")}
      style={styles.image}
      resizeMode="cover"/>
      </View>
      <Text style={styles.text}>ЗАГРУЗКА</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.mainBackground,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4
  },

  imageContainer: {
    overflow: 'hidden',
    width: 120,
    height: 120,
    borderWidth: 2,
    borderRadius: 16,
    borderColor: 'rgba(73, 225, 255, 0.8)',
    boxShadow: "0px 0px 10px rgba(73, 225, 255, 0.4)",
  },

  image: {
    width: '100%',
    height: '100%'
  },

  text: {
    color: colors.textGold,
    fontSize: 20,
    letterSpacing: 1.2,
    fontWeight: 'bold',
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  }
});