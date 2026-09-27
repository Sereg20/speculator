import { StyleSheet, Text, View } from "react-native";

import type { PlayerSkill } from "@/api/player";
import { ListItem } from "@/components/list-item/ListItem";
import { colors } from "@/theme/colors";
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';


interface SkillListItemProps {
  skill: PlayerSkill,
  onPress: (skill: PlayerSkill) => void
}

export function SkillListItem({
  skill, onPress
}: SkillListItemProps) {
  return (
    <ListItem onPress={() => {onPress(skill)}} disabled={skill.owned}>
      <View style={styles.container}>
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {skill.name}
            </Text>

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

          {!skill.owned && (
            <View style={styles.footer}>
              <FontAwesome5 name="bitcoin" size={16} color={colors.textGold} />
              <Text style={styles.price}> {skill.byn_price} BYN</Text>
            </View>
          )}
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  title: {
    flex: 1,
    color: colors.textMain,
    fontSize: 17,
    fontWeight: "bold",
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
  },

  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 4,
  },

  requirement: {
    color: colors.textMain,
    fontSize: 13,
  },

  price: {
    color: colors.textGold,
    fontWeight: "bold",
  },
});