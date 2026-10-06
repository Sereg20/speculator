import { apiClient } from "./client";
import { ApiMeta } from "./player";

export type RepairType = "proper" | "quick_fix";

export type RepairPayload = {
  defectId: string;
  repairType: RepairType;
};

type RepairResponse = {
  data: unknown;
  error: string | null;
  meta: ApiMeta;
};

export async function repairCar(
  carId: string,
  payload: RepairPayload
): Promise<RepairResponse> {
  const response = await apiClient<RepairResponse>(
    `/cars/${carId}/repairs`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return response;
}

/**
 * POST /cars/:carId/repairs/:jobId/skip
 *
 * Immediately completes an active repair job in exchange for energy.
 */
export type SkipRepairResponse = {
  data: unknown;
  error: string | null;
  meta: ApiMeta;
};

export async function skipRepair(
  carId: string,
  jobId: string,
): Promise<SkipRepairResponse> {
  return apiClient<SkipRepairResponse>(
    `/cars/${carId}/repairs/${jobId}/skip`,
    {
      method: "POST",
      body: JSON.stringify({})
    },
  );
}