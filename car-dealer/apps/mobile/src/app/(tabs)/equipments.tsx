import { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";

import {
  playerEquipmentQuery,
  playerSkillsQuery,
} from "@/api/player";

import { EquipmentTabs } from "@/features/equipment/EquipmentTab";
import { SkillsList } from "@/features/equipment/SkillsList";
import { EquipmentList } from "@/features/equipment/EquipmentList";
import { colors } from "@/theme/colors";

type EquipmentTab = "skills" | "equipment";

export default function EquipmentScreen() {
  const [activeTab, setActiveTab] =
    useState<EquipmentTab>("skills");

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
            />
          ) : (
            <EquipmentList
              equipment={equipment}
              isLoading={isEquipmentLoading}
              error={equipmentError}
            />
          )}
        </View>
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