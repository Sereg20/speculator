import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "./client";

export type Player = {
  id: string;
  name: string;
  level: number;
  xp: number;
  money: number;
};

export const getPlayer = () => {
  return apiClient<Player>("/player");
};

export const playerQuery = () =>
  queryOptions({
    queryKey: ["player"],
    queryFn: getPlayer,
  });