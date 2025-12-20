"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedbackApi } from "@/lib/api-client";
import type { StudentFeedback } from "@/lib/types";

export function useFeedbackList(teacherId: string | null, tagId?: string | null, filterTeacherId?: string | null) {
  return useQuery<{ feedback: StudentFeedback[] }>({
    queryKey: ["feedback", teacherId, tagId, filterTeacherId],
    queryFn: async () => {
      const params: any = {};
      if (filterTeacherId) params.filterTeacherId = filterTeacherId;
      if (tagId) params.tagId = tagId;
      
      const queryString = new URLSearchParams(params).toString();
      const response = await feedbackApi.list(teacherId!, queryString ? `?${queryString}` : undefined);
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

export function useFeedbackStats(teacherId: string | null, filterTeacherId?: string | null) {
  return useQuery({
    queryKey: ["feedback", "stats", teacherId, filterTeacherId],
    queryFn: () => {
      const params: any = {};
      if (filterTeacherId) params.filterTeacherId = filterTeacherId;
      const queryString = new URLSearchParams(params).toString();
      return feedbackApi.stats(teacherId!, queryString ? `?${queryString}` : undefined);
    },
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







