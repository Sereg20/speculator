import { CarSlot } from "@/components/car-slot/CarSlot";
import { View, Text, StyleSheet, ImageBackground } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { carsQuery } from "@/api/cars";

const garageBackground = require("@/../assets/images/backgrounds/background_garage1.png");

export default function GarageScreen() {
  const {
    data: cars = [],
    isLoading,
    error,
  } = useQuery(carsQuery());


  if(isLoading) {
    return <View><Text>Loading</Text></View>;
  }

  if (error) {
    return <View><Text>Error</Text></View>;
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
          <CarSlot key={car.id} car={car} />
        ))}
      </View>
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