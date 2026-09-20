import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "./client";

/**
 * Car available for purchase on the market.
 */
export type MarketListing = {
  id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  color: string;
  condition_tier: string;
  purchase_price: number;
  asking_price: number | null;
  seller_archetype: string;
  is_turbo: boolean;
  state: string;
  created_at: string;
  updated_at: string;
  days_held: number;
};

/**
 * GET /market/listings
 */
type MarketListingsResponse = {
  data: {
    listings: MarketListing[];
  };
  error: unknown | null;
  meta: {
    total: number;
  };
};

export const getMarketListings = async (): Promise<MarketListing[]> => {
  const response = await apiClient<MarketListingsResponse>(
    "/market/listings"
  );

  return response.data.listings;
};

export const marketListingsQuery = () =>
  queryOptions({
    queryKey: ["market", "listings"],
    queryFn: getMarketListings,
  });

/**
 * GET /market/listings/:id/dialogue
 */
export type SellerDialogue = {
  message: string;
};

type SellerDialogueResponse = {
  data: SellerDialogue;
  error: unknown | null;
  meta: Record<string, unknown>;
};

export const getListingDialogue = async (
  id: string
): Promise<SellerDialogue> => {
  const response = await apiClient<SellerDialogueResponse>(
    `/market/listings/${id}/dialogue`
  );

  return response.data;
};

export const listingDialogueQuery = (id: string) =>
  queryOptions({
    queryKey: ["market", "listings", id, "dialogue"],
    queryFn: () => getListingDialogue(id),
    enabled: Boolean(id),
  });

/**
 * POST /market/listings/:id/chat
 */
export type ChatResult = {
  defects: string[];
};

type ChatResponse = {
  data: ChatResult;
  error: unknown | null;
  meta: Record<string, unknown>;
};

export const chatWithSeller = async (
  id: string
): Promise<ChatResult> => {
  const response = await apiClient<ChatResponse>(
    `/market/listings/${id}/chat`,
    {
      method: "POST",
    }
  );

  return response.data;
};

/**
 * POST /market/listings/:id/negotiate
 */
export type NegotiateResult = {
  accepted: boolean;
  price: number;
  message?: string;
};

type NegotiateResponse = {
  data: NegotiateResult;
  error: unknown | null;
  meta: Record<string, unknown>;
};

export const negotiateListing = async (
  id: string,
  proposedPrice: number
): Promise<NegotiateResult> => {
  const response = await apiClient<NegotiateResponse>(
    `/market/listings/${id}/negotiate`,
    {
      method: "POST",
      body: JSON.stringify({
        proposedPrice,
      }),
    }
  );

  return response.data;
};

/**
 * POST /market/listings/:id/purchase
 */
export type PurchaseResult = {
  success: boolean;
  car: MarketListing;
};

type PurchaseResponse = {
  data: PurchaseResult;
  error: unknown | null;
  meta: Record<string, unknown>;
};

export const purchaseListing = async (
  id: string
): Promise<PurchaseResult> => {
  const response = await apiClient<PurchaseResponse>(
    `/market/listings/${id}/purchase`,
    {
      method: "POST",
    }
  );

  return response.data;
};