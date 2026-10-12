import { StyleSheet, Text, View } from "react-native";

import type { PlayerSkill } from "@/api/player";
import { ListItem } from "@/components/list-item/ListItem";
import { colors } from "@/theme/colors";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';


interface SkillListItemProps {
  skill: PlayerSkill,
  onPress: (skill: PlayerSkill) => void
}

function getTierTitle(tier: number) {
  switch (tier) {
    case 0:
      return 'Базовый';
    case 1:
      return 'Очевидный';
    case 2:
      return 'Заметный';
    case 3:
      return 'Скрытый';
    default:
      return '';
  }
}

function getTierColor(tier: number) {
  switch (tier) {
    case 0:
      return colors.blueButtonColor;
    case 1:
      return colors.textGreen;
    case 2:
      return colors.orangeButtonColor;
    case 3:
      return colors.textRed;
    default:
      return colors.textMain;
  }
}

function getSkillTypeText(skillType: string) {
  switch (skillType) {
    case 'inspection':
      return 'диагностика'
    case 'negotiation':
      return 'торг';
    case 'repair':
      return 'ремонт'
  }
}


export function SkillListItem({
  skill, onPress
}: SkillListItemProps) {
  return (
    <ListItem onPress={() => {onPress(skill)}} disabled={skill.owned}>
      <View style={styles.container}>
        <View style={styles.info}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {skill.name}
              </Text>
              <Text style={styles.skillType}>{getSkillTypeText(skill.skill_type)}</Text>
            </View>

            {skill.owned ? (
              <Text style={styles.owned}>
                ИЗУЧЕНО
              </Text>
            ) : (
              <Text style={styles.requirement}>
                Ур: {skill.level_required}
              </Text>
            )}
          </View>

          <Text style={styles.description}>
            {skill.description}
          </Text>

          
            <View style={styles.footer}>
              {(skill.skill_type === 'inspection' || skill.skill_type === 'repair') ? <View style={styles.tierContainer}>
                <Text style={styles.tier}><Text style={{fontWeight: 'bold', color: getTierColor(skill.tier)}}>{getTierTitle(skill.tier)}</Text></Text>
              </View> : <View></View>}
              {!skill.owned && (
                <View style={styles.priceContainer}>
                  <FontAwesome5 name="bitcoin" size={14} color={colors.textGold} />
                  <Text style={styles.price}> {skill.byn_price} BYN</Text>
                </View>
              )}
            </View>
          
        </View>
      </View>
    </ListItem>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 100
  },

  info: {
    gap: 8,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },

  title: {
    flex: 1,
    color: colors.textMain,
    fontSize: 16,
    fontWeight: "bold",
  },

  skillType: {
    color: colors.textGray,
    fontSize: 11,
  },

  owned: {
    color: "#84d78c",
    fontSize: 11,
    fontWeight: "bold",
  },

  description: {
    color: colors.textMain,
    opacity: 0.8,
    lineHeight: 20,
    fontSize: 12
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  requirement: {
    color: colors.textMain,
    fontSize: 13,
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },

  price: {
    color: colors.textGold,
    fontWeight: "bold",
    fontSize: 13
  },

  tierContainer: {
    backgroundColor: "#4c5052",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2
  },

  tier: {
    color: colors.textMain,
    fontSize: 13
  }
});