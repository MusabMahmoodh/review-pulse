"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { organizationsApi } from "@/lib/api-client";

export function useOrganizationTeachers() {
  return useQuery({
    queryKey: ["organizations", "teachers"],
    queryFn: () => organizationsApi.getTeachers(),
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationsApi.createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations", "teachers"] });
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, data }: { teacherId: string; data: any }) =>
      organizationsApi.updateTeacher(teacherId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations", "teachers"] });
      queryClient.invalidateQueries({ queryKey: ["organizations", "feedback"] });
      queryClient.invalidateQueries({ queryKey: ["organizations", "stats"] });
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationsApi.deleteTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations", "teachers"] });
      queryClient.invalidateQueries({ queryKey: ["organizations", "feedback"] });
      queryClient.invalidateQueries({ queryKey: ["organizations", "stats"] });
    },
  });
}

export function useOrganizationFeedback(params?: { teacherId?: string; tagId?: string }) {
  return useQuery({
    queryKey: ["organizations", "feedback", params?.teacherId, params?.tagId],
    queryFn: () => organizationsApi.getFeedback(params),
  });
}

export function useOrganizationStats() {
  return useQuery({
    queryKey: ["organizations", "stats"],
    queryFn: () => organizationsApi.getStats(),
  });
}

