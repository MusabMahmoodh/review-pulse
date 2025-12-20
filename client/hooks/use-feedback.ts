"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbackApi } from "@/lib/api-client";
import type { StudentFeedback } from "@/lib/types";

export function useFeedbackList(teacherId: string | null) {
  return useQuery<{ feedback: StudentFeedback[] }>({
    queryKey: ["feedback", teacherId],
    queryFn: async () => {
      const response = await feedbackApi.list(teacherId!);
      return {
        feedback: response.feedback.map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        })) as StudentFeedback[],
      };
    },
    enabled: !!teacherId,
  });
}

export function useFeedbackStats(teacherId: string | null) {
  return useQuery({
    queryKey: ["feedback", "stats", teacherId],
    queryFn: () => feedbackApi.stats(teacherId!),
    enabled: !!teacherId,
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: feedbackApi.submit,
    onSuccess: (_, variables) => {
      // Invalidate feedback queries to refetch
      queryClient.invalidateQueries({ queryKey: ["feedback", variables.teacherId] });
    },
  });
}







