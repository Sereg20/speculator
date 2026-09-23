import {
  View,
  StyleSheet,
  Text,
  FlatList,
} from "react-native";
import { colors } from "@/theme/colors";
import { InspectionItem } from "./InspectionItem";
import { InspectionActionId, InspectionTool, InspectionToolWithStableId } from "@/api/market";


interface InspectionCategorySectionProps {
  title: string,
  icon: string,
  items: InspectionToolWithStableId[],
  refreshing: boolean,
  selectedItemId: string | null,
  onSelect: (id: string) => void
}

export function InspectionCategorySection({
  title, icon, items, refreshing = false, selectedItemId, onSelect
}: InspectionCategorySectionProps) {

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.toolsContainer}>
        <FlatList
                data={items}
                keyExtractor={(item) => item.stableId}
                renderItem={({ item }) => (
                  <InspectionItem selected={item.stableId === selectedItemId} item={item} onPress={() => onSelect(item.stableId)}/>
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshing={refreshing}
                onRefresh={() => {}}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      Нет доступных инструментов
                    </Text>
                  </View>
                }
              />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBackground,
    borderWidth: 2,
    borderRadius: 8,
    borderColor: colors.accentBlueColor,
    overflow: 'hidden',
  },

  header: {
    backgroundColor: '#0F1D26',
    paddingHorizontal: 4,
    paddingVertical: 2
  },

  title: {
    color: colors.textMain,
    fontSize: 16
  },

  toolsContainer: {
    padding: 6,
    backgroundColor: '#17232D',
    gap: 6,
    height: 120
  },

  listContent: {
    flex: 1,
    gap: 4
  },

  emptyContainer: {
   flex: 1,
   justifyContent: 'center'
  },

  emptyText: {
    color: colors.textMain,
    fontSize: 12,
    textAlign: 'center',
  }

});