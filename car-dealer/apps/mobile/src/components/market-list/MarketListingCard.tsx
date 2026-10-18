import { MarketListing } from "@/api/market";
import { colors } from "@/theme/colors";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
} from "react-native";
import { router } from "expo-router";
import { getCarImage } from "@/assets/images/cars/carImages";


interface MarketListCardProps {
  listing: MarketListing
}

export function MarketListingCard({
  listing
}: MarketListCardProps) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={getCarImage(listing.imageKey)}
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
          <Text style={styles.price}>{listing.asking_price} USD</Text>

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
    width: '39%',
    height: '100%'
  },

  backgroundListImage: {
    width: "100%",
    height: "100%",
  },

  info: {
    paddingVertical: 3,
    flex: 1
  },

  title: {
    color: colors.textBlack,
    fontWeight: 'bold',
    fontSize: 17
  },

  details: {
    color: colors.textBlack,
    fontSize: 13
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
    fontSize: 17,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  },

  viewButton: {
    backgroundColor: colors.blueButtonColor,
    borderRadius: 4,
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 6
  },

  viewButtonPressed: {
    backgroundColor: colors.blueButtonColorPressed
  },

  viewText: {
    color: colors.textMain,
    fontWeight: 'bold',
    fontSize: 13,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: {
      width: 1,
      height: 1,
    },
    textShadowRadius: 4,
  }
 
});