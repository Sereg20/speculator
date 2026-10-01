import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "./client";
import { ApiMeta } from "./player";

export type SaleListing = {
  id: string;
  carId: string;
  askingPrice: number;
};

type CreateListingResponse = {
  data: SaleListing;
  error: string | null;
  meta: ApiMeta;
};

type CreateListingPayload = {
  carId: string;
  askingPrice: number;
};

export async function createListing(
  payload: CreateListingPayload
): Promise<CreateListingResponse> {
  const response = await apiClient<CreateListingResponse>("/listings", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return response;
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

export type ListingInquiry = {
  id: string;
  buyer_archetype: string;
  buyer_name: string;
  offered_price: number;
  message_text: string;
  player_counter_offer: number | null;
  final_agreed_price: number | null;
  status: string;
  is_direct_buy: boolean;
  did_inspect: boolean;
  discovered_quick_fixes: boolean;
  negotiation_round: number;
  generated_at: string;
  expires_at: string;
};

type GetListingInquiriesResponse = {
  data: {
    inquiries: ListingInquiry[];
  };
  error: string | null;
  meta: {
    total: number;
  };
};

export async function getListingInquiries(
  listingId: string
): Promise<ListingInquiry[]> {
  const response = await apiClient<GetListingInquiriesResponse>(
    `/listings/${listingId}/inquiries`
  );

  return response.data.inquiries;
}

export type ActiveListing = {
  id: string;
  car_id: string;
  asking_price: number;
  listed_at: string;
  expires_at: string;
  status: string;
  final_sale_price: number | null;
  make: string;
  model: string;
  year: number;
  mileage: number;
  color: string;
  condition_tier: string;
  market_value: number;
}

export type GetListingResponse = {
  data: {
    listing: ActiveListing,
    inquiries: {
      total: number;
      pending: number;
      accepted: number;
    }
  },
  error: string | null;
  meta: unknown;
}

export const listingInquiriesQuery = (listingId: string) =>
  queryOptions({
    queryKey: ["listings", listingId, "inquiries"],
    queryFn: () => getListingInquiries(listingId),
    enabled: Boolean(listingId),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

export async function getListing(
  listingId: string
): Promise<ActiveListing> {
  const response = await apiClient<GetListingResponse>(
    `/listings/${listingId}`
  );

  return response.data.listing;
}
export const listingQuery = (listingId: string) =>
  queryOptions({
    queryKey: ["listings", listingId],
    queryFn: () => getListing(listingId),
    enabled: Boolean(listingId),
  });