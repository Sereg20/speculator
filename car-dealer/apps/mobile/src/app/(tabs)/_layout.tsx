import { View, StyleSheet, Text, Animated } from "react-native";
import { Tabs } from "expo-router";
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useQuery } from "@tanstack/react-query";
import { playerQuery } from "@/api/player";
import { router } from "expo-router";


import { GameHeader } from "../../components/game-header/GameHeader";
import { colors } from "@/theme/colors";
import { FullScreenLoader } from "@/components/Loading/FullScreenLoader";
import { useEffect, useRef, useState } from "react";

export default function TabsLayout() {
  const { isLoading, error } = useQuery(playerQuery());
  const [showLoader, setShowLoader] = useState(true);
  const loaderOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isLoading || !showLoader) return;

    Animated.timing(loaderOpacity, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setShowLoader(false);
      }
    });
  }, [isLoading, showLoader, loaderOpacity]);

  if (error) {
    return <Text>Error</Text>
  }

  function onLvlPress() {
    router.push({
      pathname: '/(tabs)/profile'
    })
  }

  function onCashPress() {
    router.push({
      pathname: '/(tabs)/bank'
    })
  }

  function onEnergyPress() {
    // add
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <GameHeader
          onCashPress={onCashPress}
          onEnergyPress={onEnergyPress}
          onLvlPress={onLvlPress}
        />

        <View style={styles.tabs}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarShowLabel: false,
              tabBarActiveTintColor: colors.blueButtonColor,
              tabBarInactiveTintColor: "#ffffff",
              tabBarStyle: {
                backgroundColor: colors.mainBackground,
                borderColor: colors.lightBackground,
                boxShadow: "0px -10px 27px 2px rgba(0, 0, 0, 0.50)",
              },
            }}
          >
            <Tabs.Screen
              name="market"
              options={{
                popToTopOnBlur: true,
                tabBarIcon: ({ color }) => (
                  <Ionicons name="storefront-outline" size={28} color={color} />
                ),
              }}
            />

            <Tabs.Screen
              name="bank"
              options={{
                tabBarIcon: ({ color }) => (
                  <FontAwesome name="bank" size={28} color={color} />
                ),
              }}
            />

            <Tabs.Screen
              name="(garage)"
              options={{
                tabBarIcon: ({ color }) => (
                  <Ionicons name="home" size={28} color={color} />
                ),
              }}
            />

            <Tabs.Screen
              name="equipments"
              options={{
                tabBarIcon: ({ color }) => (
                  <FontAwesome5 name="toolbox" size={28} color={color} />
                ),
              }}
            />

            <Tabs.Screen
              name="profile"
              options={{
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="person-3" size={28} color={color} />
                ),
              }}
            />
          </Tabs>
        </View>
      </View>

      {/* Загрузчик поверх контента плавно исчезает */}
      {showLoader && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { opacity: loaderOpacity, zIndex: 10 },
          ]}
        >
          <FullScreenLoader />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
  },

  tabs: {
    flex: 1,
  },
});