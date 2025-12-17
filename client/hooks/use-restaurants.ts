"use client";

import { useQuery } from "@tanstack/react-query";
import { restaurantsApi } from "@/lib/api-client";

export function useRestaurantKeywords(restaurantId: string | null) {
  return useQuery({
    queryKey: ["restaurants", "keywords", restaurantId],
    queryFn: () => restaurantsApi.getKeywords(restaurantId!),
    enabled: !!restaurantId,
  });
}

export function useReviewPageSettings(restaurantId: string | null) {
  return useQuery({
    queryKey: ["restaurants", "review-page-settings", restaurantId],
    queryFn: () => restaurantsApi.getReviewPageSettings(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}







