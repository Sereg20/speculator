import { Image, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from "react-native";
import { colors } from "@/theme/colors";
import { ListItem } from "@/components/list-item/ListItem";
import { defectIcons } from "@/assets/images/icons/defects/defectIcon";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { ActiveDefect, ActiveRepair } from "@/api/cars";
import { CountdownTimer } from "@/components/timer/CountdownTimer";


interface DefectToBeRepairedItemProps {
  defect: ActiveDefect;
  activeRepair?: ActiveRepair;
  onPress: (defect: ActiveDefect, activeRepair?: ActiveRepair) => void;
  onRepairComplete: () => void;
}

export function DefectToBeRepairedItem({
  defect, onPress, activeRepair, onRepairComplete
}: DefectToBeRepairedItemProps) {
  const icon = defectIcons[defect.category][defect.severity];
  const isRepairing = Boolean(activeRepair);

  console.log("DEFECT", defect.id, {
    is_repairing: defect.is_repairing,
    activeRepair,
  });

  return (
    <ListItem onPress={() => { onPress(defect, activeRepair) }}>
      <View style={styles.container}>
        <Image
          source={icon}
          style={styles.icon}
          resizeMode="cover"
        />
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{defect.label}</Text>
          {!isRepairing &&
            <View>
              <View style={styles.priceContainer}>
                <Text style={styles.priceInfo}>Качественный Ремонт:  </Text>
                <FontAwesome5 name="bitcoin" size={14} color={colors.textGold} />
                <Text style={styles.price}> {defect.proper_repair_cost} BYN</Text>
              </View>
              {defect.quick_fix_cost && (
                <View style={styles.priceContainer}>
                  <Text style={styles.priceInfo}>Ремонт на скорую руку:  </Text>
                  <FontAwesome5 name="bitcoin" size={14} color={colors.textGold} />
                  <Text style={styles.price}> {defect.quick_fix_cost} BYN</Text>
                </View>
              )}
            </View>
          }
          {isRepairing && activeRepair &&
            <View>
              <CountdownTimer
                style={styles.time}
                endsAt={activeRepair.completes_at}
                onComplete={onRepairComplete}
              />
            </View>
          }
        </View>

      </View>
    </ListItem>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: "center",

  },

  infoContainer: {
    gap: 2
  },

  title: {
    color: colors.textGold,
    fontSize: 18,
    marginBottom: 4
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  priceInfo: {
    color: colors.textMain,
    fontSize: 12
  },

  price: {
    color: colors.textMain,
    fontSize: 12,
    fontWeight: 'bold'
  },

  icon: {
    borderRadius: 8,
    height: 54,
    width: 54,
    marginRight: 12
  },

  time: {
    color: colors.textMain
  }
});