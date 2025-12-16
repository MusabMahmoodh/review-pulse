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







