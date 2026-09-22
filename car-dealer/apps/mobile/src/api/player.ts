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