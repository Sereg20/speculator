import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "./client";

export type Player = {
  id: string;
  display_name: string;
  cash: number;
  xp: number;
  level: number;
  reputation_score: number;
  energy_current: number;
  garage_slots: number;
  in_game_day: number;
  reputation_tier: string;
  xp_to_next_level: number;
};

type PlayerResponse = {
  data: Player;
  error: string | null;
  meta: unknown;
};

export async function getPlayer(): Promise<Player> {
  const response = await apiClient<PlayerResponse>("/player/me");

  return response.data;
}

export const playerQuery = () =>
  queryOptions({
    queryKey: ["player", "me"],
    queryFn: getPlayer,
    staleTime: 30_000,
  });

export type PlayerSkill = {
  id: string;
  name: string;
  description: string;
  level_required: number;
  byn_price: number;
  skill_type: string;
  tier: number;
  prerequisites: string[];
  owned: boolean;
};

type PlayerSkillsResponse = {
  data: {
    skills: PlayerSkill[];
  };
  error: string | null;
  meta: unknown;
};

export async function getPlayerSkills(): Promise<PlayerSkill[]> {
  const response = await apiClient<PlayerSkillsResponse>("/player/skills");

  return response.data.skills;
}

export const playerSkillsQuery = () =>
  queryOptions({
    queryKey: ["player", "skills"],
    queryFn: getPlayerSkills,
  });


export type PlayerEquipment = {
  id: string;
  name: string;
  purchase_price: number;
  level_required: number;
  monthly_upkeep: number;
  detection_tier: number;
  detection_bonus: string;
  defect_categories_targeted: string[];
  owned: boolean;
};

type PlayerEquipmentResponse = {
  data: {
    equipment: PlayerEquipment[];
  };
  error: string | null;
  meta: unknown;
};

export async function getPlayerEquipment(): Promise<PlayerEquipment[]> {
  const response = await apiClient<PlayerEquipmentResponse>(
    "/player/equipment"
  );

  return response.data.equipment;
}

export const playerEquipmentQuery = () =>
  queryOptions({
    queryKey: ["player", "equipment"],
    queryFn: getPlayerEquipment,
  });

export type PurchaseSkillResponse = {
  data: PlayerSkill;
  error: string | null;
  meta: unknown;
};

export async function purchaseSkill(
  skillId: string
): Promise<PlayerSkill> {
  const response = await apiClient<PurchaseSkillResponse>(
    `/player/skills/${skillId}/purchase`,
    {
      method: "POST",
      body: JSON.stringify({})
    }
  );

  return response.data;
}

export type PurchaseEquipmentResponse = {
  data: PlayerEquipment;
  error: string | null;
  meta: unknown;
};

export async function purchaseEquipment(
  equipmentId: string
): Promise<PlayerEquipment> {
  const response = await apiClient<PurchaseEquipmentResponse>(
    `/player/equipment/${equipmentId}/purchase`,
    {
      method: "POST",
      body: JSON.stringify({})
    }
  );

  return response.data;
}