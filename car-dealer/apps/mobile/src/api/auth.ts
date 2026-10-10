import { apiClient } from "@/api/client";
import type { Player } from "@/api/player";

export type RegisterResponse = {
  token: string;
  player: Player;
};

type RegisterApiResponse = {
  data: RegisterResponse;
  error: string | null;
  meta: unknown;
};

export async function registerPlayer(params: {
  deviceId: string;
  displayName?: string;
}): Promise<RegisterResponse> {
  const response = await apiClient<RegisterApiResponse>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(params),
    },
  );

  return response.data;
}