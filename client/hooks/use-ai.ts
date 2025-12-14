"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiApi } from "@/lib/api-client";

export function useAIInsights(restaurantId: string | null) {
  return useQuery({
    queryKey: ["ai", "insights", restaurantId],
    queryFn: () => aiApi.getInsights(restaurantId!),
    enabled: !!restaurantId,
  });
}

export function useGenerateInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ restaurantId }: { restaurantId: string }) => aiApi.generateInsights(restaurantId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ai", "insights", variables.restaurantId] });
    },
  });
}

export function useAIChat() {
  return useMutation({
    mutationFn: ({ restaurantId, message }: { restaurantId: string; message: string }) =>
      aiApi.chat(restaurantId, message),
  });
}

