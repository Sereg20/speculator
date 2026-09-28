import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ActiveDefect, Car, carsQuery } from "@/api/cars";
import { SellingPriceSelectorDialog } from "@/features/selling/SellingPriceSelectorDialog";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createListing, deleteListing } from "@/api/listings";
import { RepairDialog } from "@/features/repair/RepairDialog";
import { ActiveDefectsDialog } from "@/features/repair/ActiveDefects";
import { RepairType, repairCar } from "@/api/repair";
import { router } from "expo-router";
import { playerQuery } from "@/api/player";
import { GarageSlots } from "@/components/garage/GarageSlots";
import { SkipActiveRepairDialog } from "@/features/repair/SkipActiveRepairDialog";
import { getGarageBackground } from "@/assets/images/backgrounds/garage/garageBackground";
import { InspectDialog } from "@/features/inspection/InspectDialog";
import { updatePlayerState } from "@/api/playerState";


export default function GarageScreen() {
  const [isSellingPriceSelectorDialogVisible, setSellingPriceSelectorDialogVisible] = useState<boolean>(false);
  const [isActiveDefectsDialogVisible, setActiveDefectsDialogVisible] = useState<boolean>(false);
  const [isRepairDialogVisible, setRepairDialogVisible] = useState<boolean>(false);
  const [isInspectDialogVisible, setInspectDialogVisible] = useState<boolean>(false);
  const [isSkipActiveRepairDialogVisible, setSkipActiveRepairDialogVisible] = useState<boolean>(false);
  const [minSellingPrice, setMinSellingPrice] = useState<number | null>(null);
  const [maxSellingPrice, setMaxSellingPrice] = useState<number | null>(null);
  const [initialSellingPrice, setInitialSellingPrice] = useState<number | null>(null);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [selectedDefect, setSelectedDefect] = useState<ActiveDefect | null>(null);

  const queryClient = useQueryClient();
  const { data: player } = useQuery(playerQuery());
  const { data: cars = [], isLoading, error } = useQuery(carsQuery());
  const background = getGarageBackground(player?.garage_slots || 1);

  const garageSlots = useMemo(() => {
    const slots = player?.garage_slots ?? 0;

    return Array.from({ length: slots }, (_, index) => ({
      id: `garage-slot-${index}`,
      car: cars[index] ?? null,
    }));
  }, [player?.garage_slots, cars]);


  // listings request
  const createListingMutation = useMutation({
    mutationFn: createListing,

    onSuccess: (result) => {
      updatePlayerState(
        queryClient,
        result.meta.playerState
      );

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
    onSuccess: (result) => {
      updatePlayerState(
        queryClient,
        result.meta.playerState
      );

      queryClient.invalidateQueries({
        queryKey: ["cars"],
      });
      setRepairDialogVisible(false);
      setSelectedDefect(null);

    },
    onError: () => {

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
    if (defect.is_repairing) {
      setSkipActiveRepairDialogVisible(true);
    } else {
      setRepairDialogVisible(true);
    }
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

  // inspect dialog
  function onInspect(selectedCar: Car) {
    setInspectDialogVisible(true);
    setSelectedCar(selectedCar);
  }

  function onInspectConfirm() {

  }

  function onInspectDialogClose() {
    setInspectDialogVisible(false);
    setSelectedCar(null);
  }
  // -----------------


  function onCancelListing(listingId: string) {
    deleteListingMutation.mutate(listingId);
  }

  function onSkipRepairConfirm() {

  }

  function onMarket() {
    router.push({
      pathname: "/market"
    });
  }

  return (
    <ImageBackground
      source={background}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.content}>
        <GarageSlots
          slots={garageSlots}
          onSell={onCarSell}
          onCancelListing={onCancelListing}
          onRepair={onRepair}
          onMarket={onMarket}
          onInspect={onInspect}
        />

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
          activeRepairs={selectedCar?.activeRepairs || []}
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
      {isSkipActiveRepairDialogVisible && (
        <SkipActiveRepairDialog 
          onClose={() => {setSkipActiveRepairDialogVisible(false)}}
          onConfirm={onSkipRepairConfirm}/>
      )}
      {isInspectDialogVisible && (
        <InspectDialog listingId="" visible={isInspectDialogVisible} onClose={onInspectDialogClose} onPreInspect={onInspectConfirm}/>
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
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },

});