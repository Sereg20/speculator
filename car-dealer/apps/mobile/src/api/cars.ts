import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "./client";

export type Car = {
  id: string;
  make: string;
  model: string;
  year: string;
  mileage: string;
  color: string;
  condition_tier: string;
  purchase_price: number;
  is_turbo: boolean;
  state: string;
  image: string;
  level: number;
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
  const response = await apiClient<CarsResponse>("/cars");
  return response.data.cars;
};

export const carsQuery = () =>
  queryOptions({
    queryKey: ["cars"],
    queryFn: getCars,
  });