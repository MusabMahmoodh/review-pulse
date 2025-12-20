"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiApi, TimePeriod } from "@/lib/api-client";

export function useAIInsights(teacherId: string | null, timePeriod?: TimePeriod) {
  return useQuery({
    queryKey: ["ai", "insights", teacherId, timePeriod],
    queryFn: () => aiApi.getInsights(teacherId!, timePeriod),
    enabled: !!teacherId,
  });
}

export function useGenerateInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, timePeriod = "month", filter = "overall" }: { teacherId: string; timePeriod?: TimePeriod; filter?: "external" | "internal" | "overall" }) =>
      aiApi.generateInsights(teacherId, timePeriod, filter),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ai", "insights", variables.teacherId] });
    },
  });
}

export function useAIChat() {
  return useMutation({
    mutationFn: ({ teacherId, message }: { teacherId: string; message: string }) =>
      aiApi.chat(teacherId, message),
  });
}

/**
 * Hook for streaming AI chat
 * @param onChunk - Callback function called with each chunk of the stream
 */
export function useAIChatStream() {
  return {
    chatStream: async (
      teacherId: string,
      message: string,
      onChunk: (chunk: string) => void
    ): Promise<void> => {
      return aiApi.chatStream(teacherId, message, onChunk);
    },
  };
}

