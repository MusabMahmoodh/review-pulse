"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { externalReviewsApi } from "@/lib/api-client";

export function useExternalReviews(teacherId: string | null) {
  return useQuery({
    queryKey: ["external-reviews", teacherId],
    queryFn: () => externalReviewsApi.list(teacherId!),
    enabled: !!teacherId,
  });
}

export function useSyncExternalReviews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { teacherId: string; platforms?: string[] }) => 
      externalReviewsApi.sync(params.teacherId, params.platforms),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["external-reviews", variables.teacherId] });
    },
  });
}









