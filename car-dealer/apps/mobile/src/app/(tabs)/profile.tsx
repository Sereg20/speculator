// src/app/(tabs)/profile.tsx

import { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery, queryOptions } from "@tanstack/react-query";

import { playerQuery } from "@/api/player";
import {
  playerSkillsQuery,
  type PlayerSkill,
} from "@/api/player";
import {
  getPlayerEquipment,
  type PlayerEquipment,
} from "@/api/player";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { typography } from "@/theme/typography";

const playerAvatar = require("../../../assets/images/playerAvatar.png");

const playerEquipmentQuery = () =>
  queryOptions({
    queryKey: ["player", "equipment"],
    queryFn: getPlayerEquipment,
  });

function formatNumber(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatMoney(value: number): string {
  return `${formatNumber(value)} BYN`;
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>

      <Text style={styles.statValue}>
        {value}
      </Text>
    </View>
  );
}

function SkillItem({
  skill,
}: {
  skill: PlayerSkill;
}) {
  return (
    <View style={styles.listItem}>
      <View style={styles.listItemIcon}>
        <Text style={styles.listItemIconText}>✓</Text>
      </View>

      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>
          {skill.name}
        </Text>

        <Text style={styles.listItemDescription}>
          {skill.description}
        </Text>

        <View style={styles.badgesRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              Уровень {skill.tier}
            </Text>
          </View>

          {skill.skill_type ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {skill.skill_type}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function EquipmentItem({
  equipment,
}: {
  equipment: PlayerEquipment;
}) {
  return (
    <View style={styles.listItem}>
      <View style={styles.listItemIcon}>
        <Text style={styles.listItemIconText}>⚙</Text>
      </View>

      <View style={styles.listItemContent}>
        <Text style={styles.listItemTitle}>
          {equipment.name}
        </Text>

        <Text style={styles.listItemDescription}>
          {equipment.detection_bonus}
        </Text>

        {equipment.defect_categories_targeted.length > 0 ? (
          <View style={styles.badgesRow}>
            {equipment.defect_categories_targeted.map(
              (category) => (
                <View
                  key={category}
                  style={styles.badge}
                >
                  <Text style={styles.badgeText}>
                    {category}
                  </Text>
                </View>
              ),
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const {
    data: player,
    isLoading: isPlayerLoading,
    error: playerError,
  } = useQuery(playerQuery());

  const {
    data: skills = [],
    isLoading: isSkillsLoading,
  } = useQuery(playerSkillsQuery());

  const {
    data: equipment = [],
    isLoading: isEquipmentLoading,
  } = useQuery(playerEquipmentQuery());

  const ownedSkills = useMemo(
    () => skills.filter((skill) => skill.owned),
    [skills],
  );

  const ownedEquipment = useMemo(
    () => equipment.filter((item) => item.owned),
    [equipment],
  );

  if (isPlayerLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors.blueButtonColor}
        />

        <Text style={styles.loadingText}>
          Загрузка профиля...
        </Text>
      </View>
    );
  }

  if (playerError || !player) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>
          Не удалось загрузить профиль
        </Text>

        <Text style={styles.errorText}>
          Попробуйте открыть профиль ещё раз.
        </Text>
      </View>
    );
  }

  const xpProgress =
    player.xp_to_next_level > 0
      ? Math.max(
          0,
          Math.min(
            1,
            (player.xp % player.xp_to_next_level) /
              player.xp_to_next_level,
          ),
        )
      : 1;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Профиль
        </Text>

        <Text style={styles.subtitle}>
          Твоя статистика и достижения
        </Text>
      </View>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <Image
            source={playerAvatar}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.username}>
            {player.display_name}
          </Text>

          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>
              УРОВЕНЬ {player.level}
            </Text>
          </View>

          <Text style={styles.reputation}>
            Репутация:{" "}
            <Text style={styles.reputationValue}>
              {player.reputation_tier}
            </Text>
          </Text>
        </View>
      </View>

      {/* XP */}
      <View style={styles.xpCard}>
        <View style={styles.xpHeader}>
          <Text style={styles.sectionLabel}>
            Опыт
          </Text>

          <Text style={styles.xpValue}>
            {formatNumber(player.xp)} XP
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${xpProgress * 100}%`,
              },
            ]}
          />
        </View>

        <Text style={styles.xpHint}>
          До следующего уровня:{" "}
          {formatNumber(player.xp_to_next_level)} XP
        </Text>
      </View>

      {/* Main stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Основная информация
        </Text>

        <View style={styles.statsGrid}>
          <StatCard
            label="Деньги"
            value={formatMoney(player.cash)}
          />

          <StatCard
            label="Энергия"
            value={`${player.energy_current} / ${player.energy_max}`}
          />

          <StatCard
            label="Размер гаража"
            value={`${player.garage_slots}`}
          />

          <StatCard
            label="Игровой день"
            value={`${player.in_game_day}`}
          />
        </View>
      </View>

      {/* Skills */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Изученные навыки
          </Text>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {ownedSkills.length}
            </Text>
          </View>
        </View>

        {isSkillsLoading ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator
              color={colors.blueButtonColor}
            />
          </View>
        ) : ownedSkills.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Навыков пока нет
            </Text>

            <Text style={styles.emptyText}>
              Изучай навыки, чтобы получить новые возможности.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {ownedSkills.map((skill) => (
              <SkillItem
                key={skill.id}
                skill={skill}
              />
            ))}
          </View>
        )}
      </View>

      {/* Equipment */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Оборудование
          </Text>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>
              {ownedEquipment.length}
            </Text>
          </View>
        </View>

        {isEquipmentLoading ? (
          <View style={styles.inlineLoading}>
            <ActivityIndicator
              color={colors.blueButtonColor}
            />
          </View>
        ) : ownedEquipment.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              Оборудования пока нет
            </Text>

            <Text style={styles.emptyText}>
              Покупай инструменты, чтобы улучшить диагностику автомобилей.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {ownedEquipment.map((item) => (
              <EquipmentItem
                key={item.id}
                equipment={item}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.mainBackground,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: colors.mainBackground,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },

  loadingText: {
    ...typography.body,
    color: colors.greyColor,
    marginTop: spacing.md,
  },

  errorTitle: {
    ...typography.title,
    color: colors.textMain,
    textAlign: "center",
  },

  errorText: {
    ...typography.body,
    color: colors.greyColor,
    textAlign: "center",
    marginTop: spacing.sm,
  },

  header: {
    marginBottom: spacing.lg,
  },

  title: {
    ...typography.heading,
    color: colors.textMain,
  },

  subtitle: {
    ...typography.body,
    color: colors.greyColor,
    marginTop: spacing.xs,
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: 16,
    backgroundColor: colors.darkBackground,
    borderWidth: 1,
    borderColor: "#343434",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.25)",
  },

  avatarWrapper: {
    width: 88,
    height: 88,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.blueButtonColor,
    borderWidth: 2,
    borderColor: colors.blueButtonColor,
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  profileInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },

  username: {
    ...typography.title,
    color: colors.textMain,
  },

  levelBadge: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.blueButtonColor,
  },

  levelBadgeText: {
    ...typography.button,
    color: "#FFFFFF",
    fontSize: 11,
  },

  reputation: {
    ...typography.bodyMedium,
    color: colors.greyColor,
    marginTop: spacing.sm,
  },

  reputationValue: {
    color: colors.textMain,
  },

  xpCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.darkBackground,
    borderWidth: 1,
    borderColor: "#343434",
  },

  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionLabel: {
    ...typography.bodyMedium,
    color: colors.textMain,
  },

  xpValue: {
    ...typography.bodyMedium,
    color: colors.textMain,
  },

  progressTrack: {
    height: 8,
    marginTop: spacing.sm,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#3A3A3A",
  },

  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.blueButtonColor,
  },

  xpHint: {
    ...typography.body,
    fontSize: 12,
    color: colors.greyColor,
    marginTop: spacing.xs,
  },

  section: {
    marginTop: spacing.xl,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  sectionTitle: {
    ...typography.title,
    color: colors.textMain,
    fontSize: 20,
  },

  countBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
  },

  countBadgeText: {
    ...typography.bodyMedium,
    color: colors.textMain,
    fontSize: 13,
  },

  statsGrid: {
    marginTop: spacing.xs,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  statCard: {
    width: "48%",
    minHeight: 92,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.darkBackground,
    borderWidth: 1,
    borderColor: "#343434",
    justifyContent: "center",
  },

  statLabel: {
    ...typography.body,
    color: colors.greyColor,
    fontSize: 13,
  },

  statValue: {
    ...typography.bodyMedium,
    color: colors.textMain,
    fontSize: 18,
    marginTop: spacing.xs,
  },

  list: {
    gap: spacing.sm,
  },

  listItem: {
    flexDirection: "row",
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.darkBackground,
    borderWidth: 1,
    borderColor: "#343434",
  },

  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
  },

  listItemIconText: {
    color: colors.blueButtonColor,
    fontSize: 20,
    fontWeight: "700",
  },

  listItemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  listItemTitle: {
    ...typography.bodyMedium,
    color: colors.textMain,
    fontSize: 16,
  },

  listItemDescription: {
    ...typography.body,
    color: colors.greyColor,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: spacing.sm,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#303030",
  },

  badgeText: {
    ...typography.body,
    color: colors.greyColor,
    fontSize: 11,
  },

  emptyCard: {
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.darkBackground,
    borderWidth: 1,
    borderColor: "#343434",
  },

  emptyTitle: {
    ...typography.bodyMedium,
    color: colors.textMain,
  },

  emptyText: {
    ...typography.body,
    color: colors.greyColor,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },

  inlineLoading: {
    minHeight: 80,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.darkBackground,
  },
});