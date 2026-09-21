// app/(tabs)/market.tsx

import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { marketListingsQuery } from "@/api/market";
import { colors } from "@/theme/colors";
import { MarketList } from "@/components/market-list/MarketList";


export default function MarketScreen() {
  const {
    data: listings = [],
    isLoading,
    error,
  } = useQuery(marketListingsQuery());
    
  return (
    <View style={styles.container}>
      <Image
        source={require("@/../assets/images/backgrounds/background_market.png")}
        style={styles.marketImg}
        resizeMode="cover"
      />
      <MarketList listings={listings} onRefresh={() =>{}}/>
    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground
  },

  marketImg: {
    width: "100%",
    height: "35%",
  },

  content: {
    flex: 1,
    padding: 20,
  },
});