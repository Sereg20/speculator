import { queryOptions } from "@tanstack/react-query";
import { apiClient } from "./client";

/**
 * Car available for purchase on the market.
 */

export type SellerArchetype =
  | "merchant"
  | "enthusiast"
  | "old_man"
  | "private_owner"
  | "shady_dealer"
  | "urgent_sale";

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
  seller_archetype: SellerArchetype;
  seller_name: string;
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
  dialogue: string;
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
export type DefectHint = {
  defectType: string;
  category: string;
  severity: string;
};

export type ChatResult = {
  dialogue: string;
  hints: DefectHint[];  // empty array = seller revealed nothing
};

type ChatResponse = {
  data: ChatResult;
  error: unknown | null;
  meta: { hintsRevealed: number };
};

export const chatWithSeller = async (
  id: string
): Promise<ChatResult> => {
  const response = await apiClient<ChatResponse>(
    `/market/listings/${id}/chat`,
    {
      method: "POST",
      body: JSON.stringify({})
    }
  );

  return response.data;
};

/**
 * POST /market/listings/:id/negotiate
 */
export type NegotiateResult = {
  outcome: string;
  finalPrice?: number;
  sellerCounterPrice?: number;
  message: string;
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
      body: JSON.stringify({})
    }
  );

  return response.data;
};

/**
 * POST /market/listings/:id/pre-inspect
 */

export type InspectionActionId =
  | "visual_walkaround"
  | "listen_engine"
  | "cold_start_test"
  | "interior_smell"
  | "panel_feel"
  | "tap_test"
  | "fluid_check"
  | "tyre_brake_visual"
  | "undercar_crawl"
  | "test_drive"
  | "obd_basic"
  | "obd_live"
  | "obd_pro"
  | "compression_test"
  | "stethoscope"
  | "smoke_test"
  | "paint_gauge"
  | "brake_fluid_test"
  | "battery_test"
  | "oscilloscope"
  | "lift_ramp"
  | "full_diagnostic";

type RevealedDefect = {
  id: string;
  defect_type: string;
  category: string;
  severity: string;
  detection_tier: number;
  proper_repair_cost: number | null;
  quick_fix_cost: number | null;
  repair_time_minutes: number;
  resale_impact: number;
  is_odometer_fraud: boolean;
};

export type PreInspectResult = {
  revealed: RevealedDefect[];
};

type PreInspectResponse = {
  data: PreInspectResult;
  error: unknown | null;
  meta: { actionId: string; newlyRevealedCount: number; energySpent: number; xpAwarded: number };
};

export const preInspectListing = async (
  id: string,
  actionId: InspectionActionId,
): Promise<PreInspectResult> => {
  const response = await apiClient<PreInspectResponse>(
    `/market/listings/${id}/pre-inspect`,
    {
      method: "POST",
      body: JSON.stringify({ actionId }),
    }
  );

  return response.data;
};