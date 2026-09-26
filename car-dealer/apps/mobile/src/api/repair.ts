import { apiClient } from "./client";

export type RepairType = "proper" | "quick_fix";

export type RepairPayload = {
  defectId: string;
  repairType: RepairType;
};

type RepairResponse = {
  data: unknown;
  error: string | null;
  meta: unknown;
};

export async function repairCar(
  carId: string,
  payload: RepairPayload
): Promise<RepairResponse["data"]> {
  const response = await apiClient<RepairResponse>(
    `/cars/${carId}/repairs`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

  return response.data;
}