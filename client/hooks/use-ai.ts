"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { aiApi, TimePeriod } from "@/lib/api-client";

export function useAIInsights(teacherId: string | null, timePeriod?: TimePeriod, organizationId?: string) {
  return useQuery({
    queryKey: ["ai", "insights", teacherId, organizationId, timePeriod],
    queryFn: () => aiApi.getInsights(teacherId, timePeriod, organizationId),
    enabled: !!teacherId || !!organizationId,
  });
}

export function useGenerateInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, organizationId, timePeriod = "month", filter = "overall" }: { teacherId?: string | null; organizationId?: string; timePeriod?: TimePeriod; filter?: "external" | "internal" | "overall" }) =>
      aiApi.generateInsights(teacherId || null, timePeriod, filter, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ai", "insights", variables.teacherId, variables.organizationId] });
    },
  });
}

export function useAIChat() {
  return useMutation({
    mutationFn: ({ teacherId, organizationId, message }: { teacherId?: string | null; organizationId?: string; message: string }) =>
      aiApi.chat(teacherId || null, message, organizationId),
  });
}

/**
 * Hook for streaming AI chat
 * @param onChunk - Callback function called with each chunk of the stream
 */
export function useAIChatStream() {
  return {
    chatStream: async (
      teacherId: string | null,
      message: string,
      onChunk: (chunk: string) => void,
      organizationId?: string
    ): Promise<void> => {
      return aiApi.chatStream(teacherId, message, onChunk, organizationId);
    },
  };
}

