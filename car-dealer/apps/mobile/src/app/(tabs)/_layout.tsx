import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { GameHeader } from "../../components/game-header/GameHeader";
import { colors } from "@/theme/colors";

export default function TabsLayout() {
  return (
    <View style={styles.container}>
      <GameHeader />

      <View style={styles.tabs}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarActiveTintColor: '#2775C3',
            tabBarInactiveTintColor: '#ffffff',
            tabBarStyle: {
              backgroundColor: colors.mainBackground,
              borderColor: '#31433B',
              boxShadow: '0px -10px 27px 2px rgba(0, 0, 0, 0.50)'
            }
          }}
        >
          

          <Tabs.Screen
            name="market"
            options={{
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name="storefront-outline" size={28} color={color} />
              ),
            }}
          />

          <Tabs.Screen
            name="bank"
            options={{
              tabBarIcon: ({ color, focused }) => (
                <FontAwesome name="bank" size={28} color={color} />
              ),
            }}
          />

          <Tabs.Screen
            name="index"
            options={{
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name="home" size={28} color={color} />
              ),
            }}
          />          

          <Tabs.Screen
            name="stats"
            options={{
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name="stats-chart" color={color} size={28} />
              ),
            }}
          />

          <Tabs.Screen
            name="profile"
            options={{
              tabBarIcon: ({ color, focused }) => (
                <MaterialIcons name="person-3" size={28} color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  tabs: {
    flex: 1,
  },
});