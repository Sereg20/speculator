import { View, StyleSheet, Text, FlatList } from "react-native";
import { CategoryId, InspectionActionId, RevealedDefect, } from "@/api/market";
import { DefectItem } from "./DefectItem";
import { colors } from "@/theme/colors";
import { GameModalWithoutHeader } from "@/components/modal/GameModalWithoutHeader";
import { ListItem } from "@/components/list-item/ListItem";

interface RevealedDefectsDialogProps {
  visible: boolean,
  defects: RevealedDefect[],
  onClose: () => void
}

export function RevealedDefectsDialog({
  visible, defects, onClose
}: RevealedDefectsDialogProps) {


  return (
    <GameModalWithoutHeader
      visible={visible}
      onClose={onClose}
      confirmHidden={true}
      closeText="ЗАКРЫТЬ"
    >
      <View style={styles.container}>
        <Text style={styles.title}>РЕЗУЛЬТАТ ДИАГНОСТИКИ</Text>
        <Text style={styles.subtitle}>Audi 80</Text>
        <FlatList
          data={defects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DefectItem defect={item} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={false}
          onRefresh={() => { }}
          ListEmptyComponent={
            <ListItem style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Не обнаружено!
              </Text>
            </ListItem>
          }
        />
      </View>
    </GameModalWithoutHeader>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 450
  },
  title: {
    color: colors.textGold,
    fontWeight: 'bold',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 4
  },

  subtitle: {
    color: colors.textMain,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8
  },

  listContent: {
    gap: 8,
    flex: 1
  },

  emptyContainer: {
    backgroundColor: colors.darkBackground,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },

  emptyText: {
    color: colors.textGold,
    fontWeight: 'bold',
    fontSize: 22
  }

});