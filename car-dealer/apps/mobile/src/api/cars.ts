import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "./client";
import { CategoryId, DefectSeverity } from "./market";

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
  repair_time_minutes: number;
  resale_impact: string;
  is_odometer_fraud: boolean;
  label: string;
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
  activeRepair?: [],
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