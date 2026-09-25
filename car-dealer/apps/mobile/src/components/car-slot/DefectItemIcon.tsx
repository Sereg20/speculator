import {  Image, StyleSheet, View } from "react-native";
import { defectIcons } from "@/assets/images/icons/defects/defectIcon";
import { ActiveDefect } from "@/api/cars";

interface DefectItemIconProps {
  defect: ActiveDefect
}

export function DefectItemIcon({
  defect
}: DefectItemIconProps) {
  const icon = defectIcons[defect.category][defect.severity];

  return (
    <View style={styles.container}>
      <Image
        source={icon}
        style={styles.icon}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: "center",

  },

  icon: {
    borderRadius: 8,
    height: 30,
    width: 30,
  }
});