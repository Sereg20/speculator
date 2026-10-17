import { Image, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from "react-native";
import { colors } from "@/theme/colors";
import { ListItem } from "@/components/list-item/ListItem";
import { defectIcons } from "@/assets/images/icons/defects/defectIcon";
import { ActiveDefect, ActiveRepair } from "@/api/cars";
import { CountdownTimer } from "@/components/timer/CountdownTimer";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';


interface DefectToBeRepairedItemProps {
  defect: ActiveDefect;
  activeRepair?: ActiveRepair;
  onPress: (defect: ActiveDefect, activeRepair?: ActiveRepair) => void;
  onRepairComplete: () => void;
}

function getSeverityText(severity: string) {
  switch (severity) {
    case 'major':
      return 'критично';
    case 'minor':
      return 'некритично';
    case 'moderate':
      return 'умеренно';
  }
}

function getCategoryText(category: string) {
  switch (category) {
    case 'body':
      return 'кузов'
    case 'engine':
      return 'двигатель';
    case 'transmission':
      return 'трансмиссия';
    case 'electrical':
      return 'электрика'
    case 'interior':
      return 'салон';
    case 'suspension':
      return 'подвеска'
  }
}

export function DefectToBeRepairedItem({
  defect, onPress, activeRepair, onRepairComplete
}: DefectToBeRepairedItemProps) {
  const icon = defectIcons[defect.category][defect.severity];
  const isRepairing = Boolean(activeRepair);

  return (
    <ListItem onPress={() => onPress(defect, activeRepair)}>
      <View style={styles.container}>
        <Image
          source={icon}
          style={styles.icon}
          resizeMode="cover"
        />

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {defect.label}
          </Text>

          {!isRepairing && (
            <Text style={styles.category}>
              ({getCategoryText(defect.category)})
            </Text>
          )}

          {isRepairing && activeRepair && (
            <CountdownTimer
              style={styles.time}
              endsAt={activeRepair.completes_at}
              onComplete={onRepairComplete}
            />
          )}
        </View>

        <MaterialIcons
          name="navigate-next"
          size={26}
          color={colors.textGold}
          style={styles.nextIcon}
        />
      </View>
    </ListItem>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minWidth: 0,
    gap: 10,
  },
  
  textContainer: {
    flex: 1,
    minWidth: 0,
    height: '100%'
  },
  
  title: {
    color: colors.textGold,
    fontSize: 16,
    flexShrink: 1,
  },
  
  icon: {
    borderRadius: 8,
    height: 52,
    width: 52,
    flexShrink: 0,
  },
  
  nextIcon: {
    flexShrink: 0,
    width: 26,
    textAlign: 'center',
  },

  infoContainer: {
    flexDirection: 'row',
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0
  },

  category: {
    fontSize: 13,
    color: colors.textGray
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

  time: {
    color: colors.textMain
  }
});