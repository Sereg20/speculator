import { Car } from "@/api/cars";
import { View } from "react-native";
import { CarSlot } from "../car-slot/CarSlot";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";

type GarageSlot = {
  id: string;
  index: number;
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
  const scrollX = useSharedValue(0);
  const garageLevel = slots.length;

  const onScrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    }
  })

  return (
    <View >
      <Animated.FlatList
        data={slots}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        pagingEnabled={true}
        renderItem={({ item, index }) => (
          <CarSlot
            car={item.car}
            onSell={onSell}
            onCancelListing={onCancelListing}
            onRepair={onRepair}
            onInspect={onInspect}
            onMarket={onMarket}
            index={index}
            scrollX={scrollX}
            garageLevel={garageLevel}
          />
        )}
        onScroll={onScrollHandler}
      />
    </View>
  );
}