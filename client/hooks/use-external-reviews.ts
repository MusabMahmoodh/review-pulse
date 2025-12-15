"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { externalReviewsApi } from "@/lib/api-client";

export function useExternalReviews(restaurantId: string | null) {
  return useQuery({
    queryKey: ["external-reviews", restaurantId],
    queryFn: () => externalReviewsApi.list(restaurantId!),
    enabled: !!restaurantId,
  });
}

export function useSyncExternalReviews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: externalReviewsApi.sync,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["external-reviews", variables.restaurantId] });
    },
  });
}


