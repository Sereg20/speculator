import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

type EquipmentTab = "skills" | "equipment";

interface EquipmentTabsProps {
  activeTab: EquipmentTab;
  onChange: (tab: EquipmentTab) => void;
}

export function EquipmentTabs({
  activeTab,
  onChange,
}: EquipmentTabsProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onChange("skills")}
        style={[
          styles.tab,
          activeTab === "skills" && styles.activeTab,
        ]}
      >
        <Text
          style={[
            styles.text,
            activeTab === "skills" && styles.activeText,
          ]}
        >
          Навыки
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange("equipment")}
        style={[
          styles.tab,
          activeTab === "equipment" && styles.activeTab,
        ]}
      >
        <Text
          style={[
            styles.text,
            activeTab === "equipment" && styles.activeText,
          ]}
        >
          Оборудование
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.darkBackground,
    borderRadius: 10,
    padding: 4,
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },

  activeTab: {
    backgroundColor: colors.blueButtonColor,
  },

  text: {
    color: colors.textMain,
    fontWeight: "bold",
  },

  activeText: {
    color: colors.textMain,
  },
});