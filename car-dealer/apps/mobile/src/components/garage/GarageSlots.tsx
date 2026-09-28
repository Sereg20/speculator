import { ActiveDefect, Car } from "@/api/cars";
import { FlatList, StyleSheet, useWindowDimensions, View } from "react-native";
import { CarSlot } from "../car-slot/CarSlot";
import { CarSlotEmpty } from "../car-slot/CarSlotEmpty";

type GarageSlot = {
  id: string;
  car: Car | null;
};

interface GarageSlotsProps {
  slots: GarageSlot[];
  onSell: (selectedCar: Car) => void;
  onCancelListing: (listingId: string) => void;
  onRepair: (selectedCar: Car) => void;
  onMarket: () => void;
  onInspect: (selectedCar: Car) => void;
}

export function GarageSlots({
  slots,
  onSell,
  onCancelListing,
  onRepair,
  onMarket,
  onInspect
}: GarageSlotsProps) {
  const { width } = useWindowDimensions();

  const slotWidth = width * 0.85;
  const gap = 12;
  const snapInterval = slotWidth + gap;

  const sidePadding = (width - slotWidth) / 2;

  return (
    <FlatList
      data={slots}
      horizontal
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={snapInterval}
      snapToAlignment="start"
      disableIntervalMomentum
      contentContainerStyle={{
        paddingHorizontal: sidePadding,
      }}
      ItemSeparatorComponent={() => <View style={{ width: gap }} />}
      renderItem={({ item }) => (
        <View style={{ width: slotWidth }}>
          {item.car ? (
            <CarSlot
              car={item.car}
              onSell={onSell}
              onCancelListing={onCancelListing}
              onRepair={onRepair}
              onInspect={onInspect}
            />
          ) : (
            <CarSlotEmpty onMarket={onMarket} />
          )}
        </View>
      )}
    />
  );
}