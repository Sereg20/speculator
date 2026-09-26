
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


interface ActiveDefectsDialogProps {
  defects: ActiveDefect[],
  activeRepairs: ActiveRepair[],
  carMake: string,
  carModel: string,
  onClose: () => void,
  onDefectPress: (defect: ActiveDefect) => void,
}

export function ActiveDefectsDialog({
  onClose, defects, activeRepairs, carMake, carModel, onDefectPress
}: ActiveDefectsDialogProps) {

  // const repairsByDefectId = useMemo(() => {
  //   return new Map(
  //     activeRepairs.map((repair) => [repair.defect_id, repair])
  //   );
  // }, [activeRepairs]); 
  const repairsByDefectId = activeRepairs;

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
            <DefectToBeRepairedItem defect={item} activeRepair={repairsByDefectId} onPress={onDefectPress}/>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={false}
          onRefresh={() => {}}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Неисправностей не обнаружено
              </Text>
            </View>
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

  },

  emptyText: {

  }
});