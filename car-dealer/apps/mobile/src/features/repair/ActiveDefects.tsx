
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ActiveDefect, ActiveRepair } from "@/api/cars";
import { GameModalWithoutHeader } from "@/components/modal/GameModalWithoutHeader";
import { colors } from "@/theme/colors";
import { DefectToBeRepairedItem } from "./DefectToBeRepairedItem";
import { useMemo } from "react";
import { ListItem } from "@/components/list-item/ListItem";


interface ActiveDefectsDialogProps {
  defects: ActiveDefect[],
  activeRepairs: ActiveRepair[],
  carMake: string,
  carModel: string,
  onClose: () => void,
  onDefectPress: (defect: ActiveDefect) => void,
  onRepairComplete: () => void;
}

export function ActiveDefectsDialog({
  onClose, defects, activeRepairs, carMake, carModel, onDefectPress, onRepairComplete
}: ActiveDefectsDialogProps) {

  const repairsByDefectId = useMemo(() => {
    return new Map(
      activeRepairs.map((repair) => [repair.defect_id, repair])
    );
  }, [activeRepairs]);

  return (
    <GameModalWithoutHeader
      visible
      onClose={onClose}
      confirmHidden={true}
      closeColor={colors.greyButton}
      closeText="ЗАКРЫТЬ"
    >
      <View style={styles.container}>
        <Text style={styles.title}>НЕИСПРАВНОСТИ</Text>
        <Text style={styles.carInfo}>{carMake} {carModel}</Text>
        <FlatList
          data={defects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DefectToBeRepairedItem defect={item} activeRepair={repairsByDefectId.get(item.id)} onPress={onDefectPress} onRepairComplete={onRepairComplete} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={false}
          onRefresh={() => { }}
          ListEmptyComponent={
            <ListItem style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Неисправностей не обнаружено
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
    width: '100%',
  },

  title: {
    fontWeight: 'bold',
    fontSize: 22,
    color: colors.textGold,
    textAlign: 'center',
  },

  carInfo: {
    fontSize: 18,
    textAlign: 'center',
    color: colors.textMain
  },

  listContent: {
    marginTop: 12
  },

  emptyContainer: {
    backgroundColor: colors.darkBackground,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
    borderRadius: 8
  },

  emptyText: {
    color: colors.textMain,
    fontSize: 18,
    textAlign: 'center'

  }
});