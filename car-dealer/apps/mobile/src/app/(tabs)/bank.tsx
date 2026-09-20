// app/(tabs)/bank.tsx

import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
} from "react-native";

const bankBackground = require("@/../assets/images/backgrounds/background_bank.png");

export default function BankScreen() {
  return (
    <ImageBackground
      source={bankBackground}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.content}>
        {/* Your garage content */}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#111111",
  },

  backgroundImage: {
    width: "100%",
    height: "100%",
  },

  content: {
    flex: 1,
    padding: 20,
  }
});