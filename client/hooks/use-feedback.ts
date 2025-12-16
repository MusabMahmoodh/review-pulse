"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbackApi } from "@/lib/api-client";

export function useFeedbackList(restaurantId: string | null) {
  return useQuery({
    queryKey: ["feedback", restaurantId],
    queryFn: () => feedbackApi.list(restaurantId!),
    enabled: !!restaurantId,
  });
}

export function useFeedbackStats(restaurantId: string | null) {
  return useQuery({
    queryKey: ["feedback", "stats", restaurantId],
    queryFn: () => feedbackApi.stats(restaurantId!),
    enabled: !!restaurantId,
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: feedbackApi.submit,
    onSuccess: (_, variables) => {
      // Invalidate feedback queries to refetch
      queryClient.invalidateQueries({ queryKey: ["feedback", variables.restaurantId] });
    },
  });
}







