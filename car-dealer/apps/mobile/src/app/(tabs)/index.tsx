import { CarSlot } from "@/components/car-slot/CarSlot";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ActiveDefect, Car, carsQuery } from "@/api/cars";
import { SellingPriceSelectorDialog } from "@/features/selling/SellingPriceSelectorDialog";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createListing, deleteListing } from "@/api/listings";
import { CarSlotEmpty } from "@/components/car-slot/CarSlotEmpty";
import { RepairDialog } from "@/features/repair/RepairDialog";
import { ActiveDefectsDialog } from "@/features/repair/ActiveDefects";
import { RepairType, repairCar } from "@/api/repair";

const garageBackground = require("@/../assets/images/backgrounds/background_garage1.png");

export default function GarageScreen() {
  const [isSellingPriceSelectorDialogVisible, setSellingPriceSelectorDialogVisible] = useState<boolean>(false);
  const [isActiveDefectsDialogVisible, setActiveDefectsDialogVisible] = useState<boolean>(false);
  const [isRepairDialogVisible, setRepairDialogVisible] = useState<boolean>(false);
  const [minSellingPrice, setMinSellingPrice] = useState<number | null>(null);
  const [maxSellingPrice, setMaxSellingPrice] = useState<number | null>(null);
  const [initialSellingPrice, setInitialSellingPrice] = useState<number | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [selectedDefect, setSelectedDefect] = useState<ActiveDefect | null>(null);

  const queryClient = useQueryClient();
  const { data: cars = [], isLoading, error } = useQuery(carsQuery());

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

  // repair request
  const repairMutation = useMutation({
    mutationFn: ({ carId, defectId, repairType }: {
      carId: string;
      defectId: string;
      repairType: RepairType;
    }) => repairCar(carId, { defectId, repairType }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cars"],
      });
      setRepairDialogVisible(false);
      setSelectedDefect(null);

      setSelectedDefect(null);
    },
    onError:  () => {

    }
  });

  if (isLoading) {
    return <View><Text>Loading</Text></View>;
  }

  if (error) {
    return <View><Text>Error</Text></View>;
  }

  // sell car dialog
  function onCarSell(selectedCar: Car) {
    const marketValue = selectedCar.market_value;
    const minPrice = Math.ceil(marketValue * 0.7);
    const maxPrice = Math.ceil(marketValue * 1.3);

    setSelectedCar(selectedCar);
    setMinSellingPrice(minPrice);
    setMaxSellingPrice(maxPrice);
    setInitialSellingPrice(marketValue);

    setSellingPriceSelectorDialogVisible(true);
  }

  function onSellingPriceSelectorDialogClose() {
    setSellingPriceSelectorDialogVisible(false);
    setSelectedCar(null);
  }

  function onConfirmSelling(askingPrice: number) {
    if (!selectedCar) return;

    createListingMutation.mutate({
      carId: selectedCar.id,
      askingPrice,
    });
  }
  //--------------------------------------

  // active defects dialog
  function onRepair(selectedCar: Car) {
    setActiveDefectsDialogVisible(true);
    setSelectedCar(selectedCar);
  }

  function onActiveDefectsDialogClose() {
    setActiveDefectsDialogVisible(false);
    setSelectedCar(null);
  }

  function onDefectSelect(defect: ActiveDefect) {
    setSelectedDefect(defect);
    setRepairDialogVisible(true)
  }
  // ---------------------

  // repair dialog
  function onRepairDialogClose() {
    setRepairDialogVisible(false);
    setSelectedDefect(null);
  }

  function onRepairConfirm(repairType: RepairType) {
    if (!selectedDefect || !selectedCar) return;

    repairMutation.mutate({
      carId: selectedCar.id,
      defectId: selectedDefect.id,
      repairType,
    });
  }
  // -----------------


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
        {cars.length > 0 ?
          cars?.map((car) => (
            <CarSlot key={car.id} car={car} onSell={onCarSell} onCancelListing={onCancelListing} onRepair={onRepair} />
          )) :
          <CarSlotEmpty onMarket={() => { }} />
        }
      </View>

      {isSellingPriceSelectorDialogVisible && selectedCar && (
        <SellingPriceSelectorDialog
          marketValue={selectedCar?.market_value}
          purchasePrice={selectedCar.purchase_price}
          initialPrice={initialSellingPrice}
          minPrice={minSellingPrice}
          maxPrice={maxSellingPrice}
          onClose={onSellingPriceSelectorDialogClose}
          onConfirm={onConfirmSelling}
        />
      )}
      {isActiveDefectsDialogVisible && (
        <ActiveDefectsDialog
          defects={selectedCar?.revealedDefects?.filter(defect => !defect.is_quick_fixed) || []}
          carMake={selectedCar?.make || ''}
          carModel={selectedCar?.model || ''}
          onClose={onActiveDefectsDialogClose}
          onDefectPress={onDefectSelect} />
      )}
      {isRepairDialogVisible && selectedDefect && (
        <RepairDialog
          defect={selectedDefect}
          onClose={onRepairDialogClose}
          onConfirm={onRepairConfirm} />
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