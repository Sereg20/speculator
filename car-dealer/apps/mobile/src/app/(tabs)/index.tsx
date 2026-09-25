import { CarSlot } from "@/components/car-slot/CarSlot";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { carsQuery } from "@/api/cars";
import { SellingPriceSelectorDialog } from "@/features/selling/SellingPriceSelectorDialog";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createListing, deleteListing } from "@/api/listings";

const garageBackground = require("@/../assets/images/backgrounds/background_garage1.png");

export default function GarageScreen() {
  const [isSellingPriceSelectorDialogVisible, setSellingPriceSelectorDialogVisible] = useState<boolean>(false);
  const [minSellingPrice, setMinSellingPrice] = useState<number | null>(null);
  const [maxSellingPrice, setMaxSellingPrice] = useState<number | null>(null);
  const [initialSellingPrice, setInitialSellingPrice] = useState<number | null>(null);
  const [sellingCarId, setSellingCarId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const {
    data: cars = [],
    isLoading,
    error,
  } = useQuery(carsQuery());

  // listings request
  const createListingMutation = useMutation({
    mutationFn: createListing,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cars"],
      });

      setSellingPriceSelectorDialogVisible(false);
    },
    onError: () => {
      
    }
  });

  // delete listings request
  const deleteListingMutation = useMutation({
    mutationFn: deleteListing,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cars"],
      });
    },
    onError: () => {

    }
  });

  if(isLoading) {
    return <View><Text>Loading</Text></View>;
  }

  if (error) {
    return <View><Text>Error</Text></View>;
  }

  function onCarSell (carId: string, marketValue: number, purchasePrice: number) {
    const minPrice = Math.ceil(marketValue * 0.7);
    const maxPrice = Math.ceil(marketValue * 1.3);

    setSellingCarId(carId);
    setMinSellingPrice(minPrice);
    setMaxSellingPrice(maxPrice);
    setInitialSellingPrice(marketValue);

    setSellingPriceSelectorDialogVisible(true);
  }

  function onConfirmSelling(askingPrice: number) {
    if (!sellingCarId) {
      return;
    }

    createListingMutation.mutate({
      carId: sellingCarId,
      askingPrice,
    });
  }

  function onCancelListing(listingId: string) {
    deleteListingMutation.mutate(listingId);
  }

  return (
    <ImageBackground
      source={garageBackground}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.content}>
        {cars?.map((car) => (
          <CarSlot key={car.id} car={car} onSell={onCarSell} onCancelListing={onCancelListing}/>
        ))}
      </View>

      {isSellingPriceSelectorDialogVisible && (
        <SellingPriceSelectorDialog
          initialPrice={initialSellingPrice}
          minPrice={minSellingPrice}
          maxPrice={maxSellingPrice}
          onClose={() => setSellingPriceSelectorDialogVisible(false)}
          onConfirm={onConfirmSelling}
        />
      )}
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
    justifyContent: 'center',
    alignItems: 'center'
  },
  
});