import {
  View,
  StyleSheet,
  Text,
} from "react-native";
import { CategoryId, InspectionActionId, inspectionToolsQuery } from "@/api/market";
import { GameModalWithoutHeader } from "../../components/modal/GameModalWithoutHeader";
import { colors } from "@/theme/colors";
import { InspectionCategorySection } from "./InspectionCategorySection";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";


interface InspectDialogProps {
  listingId: string,
  visible: boolean,
  onClose: () => void,
  onPreInspect: (actionId: InspectionActionId | null, categoryId: CategoryId| null) => void
}

export function InspectDialog({
  listingId, visible, onClose, onPreInspect
}: InspectDialogProps) {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  const { data: tools = [], isLoading } = useQuery(
    inspectionToolsQuery(listingId)
  );

  useEffect(() => {
    setSelectedToolId(null);
  }, [visible]);

  if(isLoading) {
    
  }

  const getToolsForCategory = (category: string) =>
    tools.filter((tool) => tool.categories.includes(category)).map((tool) => ({
      ...tool,
      stableId: `${category}-${tool.id}`,
    })
  );

  const engineInspectionTools = getToolsForCategory("engine");
  const transmissionInspectionTools = getToolsForCategory("transmission");
  const suspensionInspectionTools = getToolsForCategory("suspension");
  const bodyInspectionTools = getToolsForCategory("body");
  const electricalInspectionTools = getToolsForCategory("electrical");
  const interiorInspectionTools = getToolsForCategory("interior");

  function onInspectionToolSelect (stableId: string) {
    setSelectedToolId(stableId);
  }

  function onConfirm () {
    const splitted = selectedToolId?.split('-') || [];
    const inspectionToolId = splitted.slice(-1)[0] || null;
    const categoryId = splitted[0] || null;
    
    onPreInspect(inspectionToolId as InspectionActionId, categoryId as CategoryId);
  }


  return (
    <GameModalWithoutHeader
      visible={visible}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmHidden={false}
      closeText="ОТМЕНА"
      closeColor="#787C7E"
      confirmText="НАЧАТЬ ОСМОТР"
      confirmColor={colors.blueButtonColor}
    >
      <View style={styles.container}>
        <Text style={styles.title}>ДИАГНОСТИКА АВТОМОБИЛЯ</Text>
        <Text style={styles.subtitle}>Выберите инструмент для проверки</Text>
        <View style={styles.cotegoriesContainer}>
          <View style={styles.categoriesRow}>
            <InspectionCategorySection selectedItemId={selectedToolId} onSelect={onInspectionToolSelect} refreshing={isLoading} title="МОТОР" icon="" items={engineInspectionTools}/>
            <InspectionCategorySection selectedItemId={selectedToolId} onSelect={onInspectionToolSelect} refreshing={isLoading} title="КОРОБКА" icon="" items={transmissionInspectionTools}/>
          </View>

          <View style={styles.categoriesRow}>
            <InspectionCategorySection selectedItemId={selectedToolId} onSelect={onInspectionToolSelect} refreshing={isLoading} title="КУЗОВ" icon="" items={bodyInspectionTools}/>
            <InspectionCategorySection selectedItemId={selectedToolId} onSelect={onInspectionToolSelect} refreshing={isLoading} title="ПОДВЕСКА" icon="" items={suspensionInspectionTools}/>
          </View>

          <View style={styles.categoriesRow}>
            <InspectionCategorySection selectedItemId={selectedToolId} onSelect={onInspectionToolSelect} refreshing={isLoading} title="ЭЛЕКТРИКА" icon="" items={electricalInspectionTools}/>
            <InspectionCategorySection selectedItemId={selectedToolId} onSelect={onInspectionToolSelect} refreshing={isLoading} title="САЛОН" icon="" items={interiorInspectionTools}/>
          </View>

        </View>
      </View>
    </GameModalWithoutHeader>
  );
}

const styles = StyleSheet.create({
  container: {},

  title: {
    color: colors.textMain,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  },

  subtitle: {
    color: colors.textMain,
    textAlign: 'center'
  },

  cotegoriesContainer: {
    marginTop: 12,
    gap: 8
  },

  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8

  },

});