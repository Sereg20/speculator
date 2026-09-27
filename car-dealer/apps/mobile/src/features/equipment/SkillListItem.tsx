import { StyleSheet, Text, View } from "react-native";

import type { PlayerSkill } from "@/api/player";
import { ListItem } from "@/components/list-item/ListItem";
import { colors } from "@/theme/colors";

interface SkillListItemProps {
  skill: PlayerSkill;
}

export function SkillListItem({
  skill,
}: SkillListItemProps) {
  return (
    <ListItem
      disabled={skill.owned}
    >
      <View style={styles.container}>
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {skill.name}
            </Text>

            {skill.owned && (
              <Text style={styles.owned}>
                ИЗУЧЕНО
              </Text>
            )}
          </View>

          <Text style={styles.description}>
            {skill.description}
          </Text>

          {!skill.owned && (
            <View style={styles.footer}>
              <Text style={styles.requirement}>
                Уровень: {skill.level_required}
              </Text>

              <Text style={styles.price}>
                {skill.byn_price} BYN
              </Text>
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
    justifyContent: "space-between",
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