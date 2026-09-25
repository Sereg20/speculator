import { apiClient } from "./client";

export type SaleListing = {
  id: string;
  carId: string;
  askingPrice: number;
};

type CreateListingResponse = {
  data: SaleListing;
  error: string | null;
  meta: unknown;
};

type CreateListingPayload = {
  carId: string;
  askingPrice: number;
};

export async function createListing(
  payload: CreateListingPayload
): Promise<SaleListing> {
  const response = await apiClient<CreateListingResponse>("/listings", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response.data;
}

type DeleteListingResponse = {
  data: {
    cancelled: boolean
  };
  error: string | null;
  meta: unknown;
};

export async function deleteListing(listingId: string): Promise<void> {
  await apiClient<DeleteListingResponse>(`/listings/${listingId}`, {
    method: "DELETE",
  });
}