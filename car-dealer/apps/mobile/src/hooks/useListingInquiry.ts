import { useQuery } from "@tanstack/react-query";

import { listingInquiriesQuery } from "@/api/listings";

export function useListingInquiry(listingId: string | null) {
  const query = useQuery({
    ...listingInquiriesQuery(listingId ?? ""),
    enabled: Boolean(listingId),
  });

  const inquiry =
    query.data?.find((item) => (item.status !== "expired" && item.status !== "rejected")) ?? null;

  return {
    inquiry,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}