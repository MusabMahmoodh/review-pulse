"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiApi, TimePeriod } from "@/lib/api-client";

export function useAIInsights(restaurantId: string | null, timePeriod?: TimePeriod) {
  return useQuery({
    queryKey: ["ai", "insights", restaurantId, timePeriod],
    queryFn: () => aiApi.getInsights(restaurantId!, timePeriod),
    enabled: !!restaurantId,
  });
}

export function useGenerateInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ restaurantId, timePeriod = "month" }: { restaurantId: string; timePeriod?: TimePeriod }) =>
      aiApi.generateInsights(restaurantId, timePeriod),
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

/**
 * Hook for streaming AI chat
 * @param onChunk - Callback function called with each chunk of the stream
 */
export function useAIChatStream() {
  return {
    chatStream: async (
      restaurantId: string,
      message: string,
      onChunk: (chunk: string) => void
    ): Promise<void> => {
      return aiApi.chatStream(restaurantId, message, onChunk);
    },
  };
}

