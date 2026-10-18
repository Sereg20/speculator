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
      <Image
      source={require("@/../assets/images/icon.png")}
      style={styles.image}
      resizeMode="cover"/>
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
    justifyContent: 'center'
  },

  image: {
    width: 120,
    height: 120,
    borderWidth: 2,
    borderRadius: 26,
    borderColor: colors.darkBackground,
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