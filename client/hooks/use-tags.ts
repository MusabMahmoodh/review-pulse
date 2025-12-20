"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tagsApi } from "@/lib/api-client";
import type { Tag } from "@/lib/types";

export function useTags(params?: {
  teacherId?: string | null;
  organizationId?: string | null;
  includeInactive?: boolean;
}) {
  return useQuery<{ tags: Tag[] }>({
    queryKey: ["tags", params?.teacherId, params?.organizationId, params?.includeInactive],
    queryFn: async () => {
      const response = await tagsApi.list({
        teacherId: params?.teacherId || undefined,
        organizationId: params?.organizationId || undefined,
        includeInactive: params?.includeInactive,
      });
      return {
        tags: response.tags.map((tag) => ({
          ...tag,
          createdAt: new Date(tag.createdAt),
          updatedAt: new Date(tag.updatedAt),
        })) as Tag[],
      };
    },
    enabled: !!(params?.teacherId || params?.organizationId),
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      color?: string;
      teacherId?: string;
      organizationId?: string;
    }) => tagsApi.create(data),
    onSuccess: (_, variables) => {
      // Invalidate tags queries
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tagId,
      data,
    }: {
      tagId: string;
      data: {
        name?: string;
        description?: string;
        color?: string;
        isActive?: boolean;
      };
    }) => tagsApi.update(tagId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => tagsApi.delete(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useTagStats(tagId: string | null) {
  return useQuery({
    queryKey: ["tag-stats", tagId],
    queryFn: () => tagsApi.getStats(tagId!),
    enabled: !!tagId,
  });
}

