import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "./client";
import { CategoryId, DefectSeverity, InspectionActionId, InspectionTool, RevealedDefect } from "./market";
import { RepairType } from "./repair";
import { ApiMeta } from "./player";

export type ActiveDefect = {
  id: string;
  car_id: string;
  defect_type: string;
  category: CategoryId;
  severity: DefectSeverity;
  detection_tier: number;
  is_quick_fixed: boolean;
  proper_repair_cost: number;
  quick_fix_cost: number;
  quick_fix_time_minutes: number;
  proper_repair_time_minutes: number;
  resale_impact: string;
  is_odometer_fraud: boolean;
  label: string;
  is_repairing: boolean;
}

export type ActiveRepair = {
  car_id: string;
  completes_at: string;
  defect_id: string;
  id: string;
  repair_type: RepairType;
  started_at: string;
  skipEnergyCost: number;
}

type ActiveListing = {
  id: string;
  asking_price: number;
  listed_at: string;
  expires_at: string;
}

export type Car = {
  id: string;
  make: string;
  model: string;
  year: string;
  mileage: string;
  color: string;
  condition_tier: string;
  purchase_price: number;
  market_value: number,
  asking_price: number;
  seller_archetype: string;
  is_turbo: boolean;
  state: string;
  days_held: number;
  image: string;
  level: number;
  revealedDefects?: ActiveDefect[];
  activeRepairs?: ActiveRepair[],
  activeListing?: ActiveListing
};

type CarsResponse = {
  data: {
    cars: Car[];
  };
  error: unknown | null;
  meta: {
    total: number;
  };
};

export const getCars = async (): Promise<Car[]> => {
  const response = await apiClient<CarsResponse>("/cars?include=defects,repairs,listing");
  return response.data.cars;
};

export const carsQuery = () =>
  queryOptions({
    queryKey: ["cars"],
    queryFn: getCars,
  });



type CarInspectionToolsResponse = {
  data: unknown;
  error: string | null;
  meta: {
    availableActions: InspectionTool[];
    [key: string]: unknown;
  };
};

export async function getCarInspectionTools(
  carId: string,
): Promise<InspectionTool[]> {
  const response = await apiClient<CarInspectionToolsResponse>(
    `/cars/${carId}/inspections`,
  );

  return response.meta.availableActions;
}

export const carInspectionToolsQuery = (carId: string) =>
  queryOptions({
    queryKey: ["cars", carId, "inspection-tools"],
    queryFn: () => getCarInspectionTools(carId),
    enabled: Boolean(carId),
    staleTime: 600_000,
  });


export type InspectCarPayload = {
  actionId: InspectionActionId;
};

type InspectCarResponse = {
  data: RevealedDefect[];
  error: string | null;
  meta: ApiMeta;
};

export async function inspectCar(
  carId: string,
  actionId: InspectionActionId,
  categoryId: CategoryId,
): Promise<InspectCarResponse> {
  const response = await apiClient<InspectCarResponse>(
    `/cars/${carId}/inspect`,
    {
      method: "POST",
      body: JSON.stringify({actionId, category: categoryId}),
    },
  );

  return response;
}