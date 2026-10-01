import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { EquipmentTabs } from "@/features/equipment/EquipmentTab";
import { SkillsList } from "@/features/equipment/SkillsList";
import { EquipmentList } from "@/features/equipment/EquipmentList";
import { colors } from "@/theme/colors";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  PlayerEquipment,
  playerEquipmentQuery,
  PlayerSkill,
  playerSkillsQuery,
  purchaseEquipment,
  purchaseSkill,
} from "@/api/player";
import { PurchaseSkillConfirmDialog } from "@/features/equipment/PurchaseSkillConfirmDialog";
import { PurchaseEquipmentConfirmDialog } from "@/features/equipment/PurchaseEquipmentConfirmDialog";
import { updatePlayerState } from "@/api/playerState";

type EquipmentTab = "skills" | "equipment";

export default function EquipmentScreen() {
  const [activeTab, setActiveTab] = useState<EquipmentTab>("skills");
  const [isPurchaseSkillConfirmDialogVisible, setPurchaseSkillConfirmDialogVisible] = useState<boolean>(false);
  const [isPurchaseEquipmentConfirmDialogVisible, setPurchaseEquipmentConfirmDialogVisible] = useState<boolean>(false);
  const [selectedSkill, setSelectedSkill] = useState<PlayerSkill | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<PlayerEquipment | null>(null);

  const queryClient = useQueryClient();

  const {
    data: skills = [],
    isLoading: isSkillsLoading,
    error: skillsError,
  } = useQuery(playerSkillsQuery());

  const {
    data: equipment = [],
    isLoading: isEquipmentLoading,
    error: equipmentError,
  } = useQuery(playerEquipmentQuery());

  // purchase skill request
  const purchaseSkillMutation = useMutation({
    mutationFn: purchaseSkill,

    onSuccess: (result) => {
      updatePlayerState(
        queryClient,
        result.meta.playerState
      );
      queryClient.invalidateQueries({
        queryKey: ["player", "skills"],
      });

      setPurchaseSkillConfirmDialogVisible(false);
      setSelectedSkill(null);

    },
    onError: () => {

    }
  });

  // purchase equipment request
  const purchaseEquipmentMutation = useMutation({
    mutationFn: purchaseEquipment,

    onSuccess: (result) => {
      updatePlayerState(
        queryClient,
        result.meta.playerState
      );
      queryClient.invalidateQueries({
        queryKey: ["player", "equipment"],
      });

      setPurchaseEquipmentConfirmDialogVisible(false);
      setSelectedEquipment(null);
    },
    onError: () => {
      
    }
  });

  function onSkillPress(selectedSkill: PlayerSkill) {
    setSelectedSkill(selectedSkill);
    setPurchaseSkillConfirmDialogVisible(true);
  }

  function onPurchaseSkillConfirm(id: string) {
    purchaseSkillMutation.mutate(id);
  }

  function onPurchaseSkillConfirmDialogClose() {
    setSelectedSkill(null);
    setPurchaseSkillConfirmDialogVisible(false);
  }

  function onEquipmentPress(selectedEquipment: PlayerEquipment) {
    setSelectedEquipment(selectedEquipment);
    setPurchaseEquipmentConfirmDialogVisible(true);
  }

  function onPurchaseEquipmentConfirm(id: string) {
    purchaseEquipmentMutation.mutate(id);
  }

  function onPurchaseEquipmentConfirmDialogClose() {
    setSelectedEquipment(null);
    setPurchaseEquipmentConfirmDialogVisible(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>НАВЫКИ И ОБОРУДОВАНИЕ</Text>

      <EquipmentTabs
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <View style={styles.content}>
        {activeTab === "skills" ? (
          <SkillsList
            skills={skills}
            isLoading={isSkillsLoading}
            error={skillsError}
            onSkillPress={onSkillPress}
          />
        ) : (
          <EquipmentList
            equipment={equipment}
            isLoading={isEquipmentLoading}
            error={equipmentError}
            onEquipmentPress={onEquipmentPress}
          />
        )}
      </View>

      {isPurchaseSkillConfirmDialogVisible && selectedSkill && (
        <PurchaseSkillConfirmDialog
          skill={selectedSkill}
          visible={isPurchaseSkillConfirmDialogVisible}
          onClose={onPurchaseSkillConfirmDialogClose}
          onConfirm={onPurchaseSkillConfirm}/>
      )}

      {isPurchaseEquipmentConfirmDialogVisible && selectedEquipment && (
        <PurchaseEquipmentConfirmDialog
          equipment={selectedEquipment}
          visible={isPurchaseEquipmentConfirmDialogVisible}
          onClose={onPurchaseEquipmentConfirmDialogClose}
          onConfirm={onPurchaseEquipmentConfirm}/>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.mainBackground
  },

  title: {
    color: colors.textMain,
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },

  content: {
    flex: 1,
    marginTop: 16,
  },
});