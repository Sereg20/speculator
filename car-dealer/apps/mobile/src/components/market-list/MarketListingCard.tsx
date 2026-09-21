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


interface MarketListCardProps {
  listing: MarketListing
}

export function MarketListingCard({
  listing
}: MarketListCardProps) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("@/../assets/images/backgrounds/background_listing_item.png")}
        style={styles.backgroundListItem}
        imageStyle={styles.backgroundListImage}
        resizeMode="cover"
      >
      </ImageBackground>
      <View style={styles.info}>
        <Text style={styles.title}>{listing.make} {listing.model}</Text>
        <Text style={styles.details}>Пробег: {listing.mileage}</Text>
        <Text style={styles.details}>Год: {listing.year}</Text>

        <View style={styles.footer}>
          <Text style={styles.price}>{listing.asking_price} BYN</Text>

          <Pressable 
            style={({ pressed }) => [
              styles.viewButton,
              pressed && styles.viewButtonPressed,
            ]}  
            onPress={() => {
              router.push({
                pathname: "/market/[id]",
                params: {
                  id: listing.id,
                },
              });
            }}
          >
            <Text style={styles.viewText}>ОСМОТРЕТЬ</Text>
          </Pressable>
        </View>

        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 10,
  },

  backgroundListItem: {
    backgroundColor: colors.mainBackground,
    width: '33%',
    height: '100%'
  },

  backgroundListImage: {
    width: "100%",
    height: "100%",
  },

  info: {
    paddingVertical: 4,
    flex: 1
  },

  title: {
    color: colors.textBlack,
    fontWeight: 'bold',
    fontSize: 18
  },

  details: {
    color: colors.textBlack,
    fontSize: 16
  },

  footer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 4
  },

  price: {
    color: colors.textBlack,
    fontWeight: 'bold',
    fontSize: 20,
    paddingVertical: 5
  },

  viewButton: {
    backgroundColor: colors.blueButtonColor,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 6,
    height: '100%'
  },

  viewButtonPressed: {
    backgroundColor: colors.blueButtonColorPressed
  },

  viewText: {
    color: colors.textMain,
    fontWeight: 'bold',
    fontSize: 16
  }
 
});