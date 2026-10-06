import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { ActiveDefect, ActiveRepair, Car, carsQuery, inspectCar } from "@/api/cars";
import { SellingPriceSelectorDialog } from "@/features/selling/SellingPriceSelectorDialog";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createListing, deleteListing } from "@/api/listings";
import { RepairDialog } from "@/features/repair/RepairDialog";
import { ActiveDefectsDialog } from "@/features/repair/ActiveDefects";
import { RepairType, repairCar, skipRepair } from "@/api/repair";
import { router } from "expo-router";
import { playerQuery } from "@/api/player";
import { GarageSlots } from "@/components/garage/GarageSlots";
import { SkipActiveRepairDialog } from "@/features/repair/SkipActiveRepairDialog";
import { getGarageBackground } from "@/assets/images/backgrounds/garage/garageBackground";
import { updatePlayerState } from "@/api/playerState";
import { PurchasedCarInspectDialog } from "@/features/inspection/PurchasedCarInspectDialog";
import { CategoryId, InspectionActionId } from "@/api/market";
import { useGame } from "@/app/context/GameContext";


export default function GarageScreen() {
  const { showError } = useGame();

  const [isSellingPriceSelectorDialogVisible, setSellingPriceSelectorDialogVisible] = useState(false);
  const [isActiveDefectsDialogVisible, setActiveDefectsDialogVisible] = useState(false);
  const [isRepairDialogVisible, setRepairDialogVisible] = useState(false);
  const [isInspectDialogVisible, setInspectDialogVisible] = useState(false);
  const [isSkipActiveRepairDialogVisible, setSkipActiveRepairDialogVisible] = useState(false);

  const [minSellingPrice, setMinSellingPrice] = useState<number | null>(null);
  const [maxSellingPrice, setMaxSellingPrice] = useState<number | null>(null);
  const [initialSellingPrice, setInitialSellingPrice] = useState<number | null>(null);

  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [activeRepairToBeSkiped, setActiveRepairToBeSkiped] = useState<ActiveRepair | null>(null);

  const queryClient = useQueryClient();

  const { data: player } = useQuery(playerQuery());

  const {
    data: cars = [],
    isLoading,
    error,
  } = useQuery(carsQuery());

  const selectedCar = useMemo(() => {
    if (!selectedCarId) {
      return null;
    }

    return cars.find((car) => car.id === selectedCarId) ?? null;
  }, [cars, selectedCarId]);

  const selectedDefect = useMemo(() => {
    if (!selectedCar || !selectedDefectId) {
      return null;
    }

    return (
      selectedCar.revealedDefects?.find(
        (defect) => defect.id === selectedDefectId
      ) ?? null
    );
  }, [selectedCar, selectedDefectId]);

  const background = getGarageBackground(player?.garage_slots || 1);

  const garageSlots = useMemo(() => {
    const slots = player?.garage_slots ?? 0;

    return Array.from({ length: slots }, (_, index) => ({
      id: `garage-slot-${index}`,
      index: index,
      car: cars[index] ?? null,
    }));
  }, [player?.garage_slots, cars]);

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
      setSelectedCarId(null);
    },

    onError: () => { },
  });

  const deleteListingMutation = useMutation({
    mutationFn: deleteListing,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cars"],
      });
    },

    onError: () => { },
  });

  const repairMutation = useMutation({
    mutationFn: ({
      carId,
      defectId,
      repairType,
    }: {
      carId: string;
      defectId: string;
      repairType: RepairType;
    }) =>
      repairCar(carId, {
        defectId,
        repairType,
      }),

    onSuccess: async (result) => {
      updatePlayerState(
        queryClient,
        result.meta.playerState
      );

      await queryClient.invalidateQueries({
        queryKey: ["cars"],
      });

      setRepairDialogVisible(false);
      setSelectedDefectId(null);
    },

    onError: () => { },
  });

  // /inspect request
  const inspectMutation = useMutation({
    mutationFn: ({
      carId,
      actionId,
      categoryId,
    }: {
      carId: string;
      actionId: InspectionActionId;
      categoryId: CategoryId;
    }) => inspectCar(carId, actionId, categoryId),

    onSuccess: (result) => {
      updatePlayerState(
        queryClient,
        result.meta.playerState
      );

    },

    onError: (error) => {

    },
  });

  const skipRepairMutation = useMutation({
    mutationFn: ({
      carId,
      jobId,
    }: {
      carId: string;
      jobId: string;
    }) => skipRepair(carId, jobId),

    onSuccess: (result, variables) => {
      onSkilActiveRepairDialogClose();

      updatePlayerState(
        queryClient,
        result.meta.playerState,
      );

      queryClient.invalidateQueries({
        queryKey: ["cars"],
      });

      // Если используешь inspection tools
      // queryClient.invalidateQueries({
      //   queryKey: [
      //     "cars",
      //     variables.carId,
      //     "inspection-tools",
      //   ],
      // });
    },

    onError: (error) => {
      showError(error.message);
    },
  });

  if (isLoading) {
    return (
      <View>
        <Text>Loading</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View>
        <Text>Error</Text>
      </View>
    );
  }

  function onCarSell(car: Car) {
    const marketValue = car.market_value;

    const minPrice = Math.ceil(marketValue * 0.7);
    const maxPrice = Math.ceil(marketValue * 1.3);

    setSelectedCarId(car.id);

    setMinSellingPrice(minPrice);
    setMaxSellingPrice(maxPrice);
    setInitialSellingPrice(marketValue);

    setSellingPriceSelectorDialogVisible(true);
  }

  function onSellingPriceSelectorDialogClose() {
    setSellingPriceSelectorDialogVisible(false);
    setSelectedCarId(null);
  }

  function onConfirmSelling(askingPrice: number) {
    if (!selectedCar) {
      return;
    }

    createListingMutation.mutate({
      carId: selectedCar.id,
      askingPrice,
    });
  }

  function onRepair(car: Car) {
    setSelectedCarId(car.id);
    setActiveDefectsDialogVisible(true);
  }

  function onActiveDefectsDialogClose() {
    setActiveDefectsDialogVisible(false);
    setSelectedCarId(null);
    setSelectedDefectId(null);
  }

  function onDefectSelect(defect: ActiveDefect, activeRepair?: ActiveRepair) {
    setSelectedDefectId(defect.id);

    if (defect.is_repairing && activeRepair) {
      setActiveRepairToBeSkiped(activeRepair);
      setSkipActiveRepairDialogVisible(true);
    } else {
      setRepairDialogVisible(true);
    }
  }

  function onRepairComplete() {
    queryClient.invalidateQueries({
      queryKey: ["cars"],
    });
  }

  function onRepairDialogClose() {
    setRepairDialogVisible(false);
    setSelectedDefectId(null);
  }

  function onRepairConfirm(repairType: RepairType) {
    if (!selectedCarId || !selectedDefect) {
      return;
    }

    repairMutation.mutate({
      carId: selectedCarId,
      defectId: selectedDefect.id,
      repairType,
    });
  }

  function onInspect(car: Car) {
    setSelectedCarId(car.id);
    setInspectDialogVisible(true);
  }

  function onInspectConfirm(actionId: InspectionActionId, categoryId: CategoryId) {
    if (!selectedCarId || !actionId || !categoryId) return;
    setInspectDialogVisible(false);
    inspectMutation.mutate({
      carId: selectedCarId,
      actionId,
      categoryId,
    });
  }

  function onInspectDialogClose() {
    setInspectDialogVisible(false);
    setSelectedCarId(null);
  }


  function onCancelListing(listingId: string) {
    deleteListingMutation.mutate(listingId);
  }


  function onSkipRepairConfirm() {
    if (!selectedCarId || !activeRepairToBeSkiped) return;
    skipRepairMutation.mutate({carId: selectedCarId, jobId: activeRepairToBeSkiped.id})
  }

  function onSkilActiveRepairDialogClose() {
    setActiveRepairToBeSkiped(null);
    setSkipActiveRepairDialogVisible(false);
  }

  function onMarket() {
    router.push({
      pathname: "/market",
    });
  }

  return (
    <ImageBackground
      source={background}
      style={styles.background}
      imageStyle={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <GarageSlots
          slots={garageSlots}
          onSell={onCarSell}
          onCancelListing={onCancelListing}
          onRepair={onRepair}
          onMarket={onMarket}
          onInspect={onInspect}
        />
      </View>

      {/* SELLING PRICE */}
      {isSellingPriceSelectorDialogVisible && selectedCar && (
        <SellingPriceSelectorDialog
          marketValue={selectedCar.market_value}
          purchasePrice={selectedCar.purchase_price}
          initialPrice={initialSellingPrice}
          minPrice={minSellingPrice}
          maxPrice={maxSellingPrice}
          onClose={onSellingPriceSelectorDialogClose}
          onConfirm={onConfirmSelling}
        />
      )}

      {/* ACTIVE DEFECTS */}
      {isActiveDefectsDialogVisible && selectedCar && (
        <ActiveDefectsDialog
          defects={
            selectedCar.revealedDefects?.filter(
              (defect) => !defect.is_quick_fixed
            ) ?? []
          }
          activeRepairs={selectedCar.activeRepairs ?? []}
          carMake={selectedCar.make}
          carModel={selectedCar.model}
          onClose={onActiveDefectsDialogClose}
          onDefectPress={onDefectSelect}
          onRepairComplete={onRepairComplete}
        />
      )}

      {/* REPAIR */}
      {isRepairDialogVisible && selectedDefect && (
        <RepairDialog
          defect={selectedDefect}
          onClose={onRepairDialogClose}
          onConfirm={onRepairConfirm}
        />
      )}

      {/* SKIP ACTIVE REPAIR */}
      {isSkipActiveRepairDialogVisible && (
        <SkipActiveRepairDialog
          skipEnergyCost={activeRepairToBeSkiped?.skipEnergyCost || 0}
          onClose={onSkilActiveRepairDialogClose}
          onConfirm={onSkipRepairConfirm}
        />
      )}

      {/* INSPECTION */}
      {isInspectDialogVisible && (
        <PurchasedCarInspectDialog
          carId={selectedCarId || ''}
          visible={isInspectDialogVisible}
          onClose={onInspectDialogClose}
          onInspect={onInspectConfirm}
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

  container: {
    flex: 1,
    justifyContent: 'center'
  }


});