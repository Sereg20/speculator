
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ActiveDefect } from "@/api/cars";
import { GameModalWithoutHeader } from "@/components/modal/GameModalWithoutHeader";
import { colors } from "@/theme/colors";
import { DefectToBeRepairedItem } from "./DefectToBeRepairedItem";


interface ActiveDefectsDialogProps {
  defects: ActiveDefect[],
  carMake: string,
  carModel: string,
  onClose: () => void,
  onDefectPress: (defect: ActiveDefect) => void,
}

export function ActiveDefectsDialog({
  onClose, defects, carMake, carModel, onDefectPress
}: ActiveDefectsDialogProps) {

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
            <DefectToBeRepairedItem defect={item} onPress={onDefectPress}/>
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