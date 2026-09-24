import {  Image, Pressable, StyleSheet,  Text, View, type GestureResponderEvent } from "react-native";
import { colors } from "@/theme/colors";
import { InspectionTool, RevealedDefect } from "@/api/market";
import { ListItem } from "@/components/list-item/ListItem";
import { defectIcons } from "@/assets/images/icons/defects/defectIcon";

interface DefectItemProps {
  defect: RevealedDefect
}

export function DefectItem({
  defect
}: DefectItemProps) {
  const icon = defectIcons[defect.category][defect.severity];

  return (
    <ListItem>
      <View style={styles.container}>
        <Image
          source={icon}
          style={styles.icon}
          resizeMode="cover"
        />
        <Text style={styles.text}>{defect.label}</Text>
      </View>
    </ListItem>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: "center",

  },

  text: {
    color: colors.textGold,
    fontSize: 20
  },

  icon: {
    borderRadius: 8,
    height: 60,
    width: 60,
    marginRight: 12
  }
});