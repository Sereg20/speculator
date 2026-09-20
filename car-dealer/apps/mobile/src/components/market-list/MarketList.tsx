import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from "react-native";

import type { MarketListing } from "@/api/market";
import { MarketListingCard } from "./MarketListingCard";
import { colors } from "@/theme/colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface MarketListProps {
  listings: MarketListing[];
  onRefresh: () => void;
  refreshing?: boolean;
}

export function MarketList({
  listings,
  onRefresh,
  refreshing = false,
}: MarketListProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>РЫНОК АВТОМОБИЛЕЙ</Text>

        <Pressable onPress={onRefresh} style={({ pressed }) => pressed && styles.refreshButtonPressed}>
          <MaterialIcons name="refresh" size={30} color={colors.textMain} />
        </Pressable>
      </View>

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MarketListingCard listing={item} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              На рынке сегодня выходной
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 12,
    marginTop: 6
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textMain,
  },

  refreshButtonPressed: {
    opacity: 0.8
  },

  listContent: {
    gap: 12,
    paddingBottom: 24,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  emptyText: {
    color: colors.textMain,
    fontSize: 20,
  },
});