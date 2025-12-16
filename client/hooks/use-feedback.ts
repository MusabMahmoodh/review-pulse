"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbackApi } from "@/lib/api-client";
import type { CustomerFeedback } from "@/lib/types";

export function useFeedbackList(restaurantId: string | null) {
  return useQuery<{ feedback: CustomerFeedback[] }>({
    queryKey: ["feedback", restaurantId],
    queryFn: async () => {
      const response = await feedbackApi.list(restaurantId!);
      return {
        feedback: response.feedback.map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        })) as CustomerFeedback[],
      };
    },
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







