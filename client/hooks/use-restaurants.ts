"use client";

import { useQuery } from "@tanstack/react-query";
import { teachersApi } from "@/lib/api-client";

export function useReviewPageSettings(teacherId: string | null) {
  return useQuery({
    queryKey: ["teachers", "review-page-settings", teacherId],
    queryFn: () => teachersApi.getReviewPageSettings(teacherId!),
    enabled: !!teacherId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Legacy alias for backward compatibility
export const useRestaurantKeywords = () => null; // Removed - keywords not used for teachers







