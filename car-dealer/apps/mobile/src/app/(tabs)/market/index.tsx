// app/(tabs)/market.tsx

import {
  View,
  StyleSheet,
  Image,
} from "react-native";
import { useMutation, useQuery, useQueryClient  } from "@tanstack/react-query";
import { marketListingsQuery, refreshListings } from "@/api/market";
import { colors } from "@/theme/colors";
import { MarketList } from "@/components/market-list/MarketList";


export default function MarketScreen() {
  const queryClient = useQueryClient();
  const {
    data: listings = [],
    isLoading,
    error,
  } = useQuery(marketListingsQuery());

  // /refresh request
  const refreshMutation = useMutation({
    mutationFn: () => refreshListings(),

    onSuccess: (data) => {
      queryClient.setQueryData(
        ["market", "listings"],
        data
      );
    },

    onError: (error) => {
      
    },
  });
    
  return (
    <View style={styles.container}>
      <Image
        source={require("@/../assets/images/backgrounds/background_market.png")}
        style={styles.marketImg}
        resizeMode="cover"
      />
      <MarketList listings={listings} onRefresh={() =>{refreshMutation.mutate()}}/>
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