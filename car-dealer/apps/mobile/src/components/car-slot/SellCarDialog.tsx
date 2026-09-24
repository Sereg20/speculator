import {  View, StyleSheet, Text } from "react-native";
import { CategoryId, InspectionActionId, inspectionToolsQuery } from "@/api/market";
import { colors } from "@/theme/colors";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { GameModal } from "../modal/GameModal";

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
    <GameModal
      title="ВЫСТАВИТЬ НА ПРОДАЖУ"
      visible={visible}
      onClose={onClose}
      onConfirm={onConfirm}
      confirmHidden={false}
      closeText="ОТМЕНА"
  
      confirmText="ВЫСТАВИТЬ"
    >
      <View style={styles.container}>
        
      </View>
    </GameModal>
  );
}

const styles = StyleSheet.create({
  container: {},


});