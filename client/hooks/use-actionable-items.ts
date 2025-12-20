"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { actionableItemsApi } from "@/lib/api-client";
import type { ActionableItem } from "@/lib/types";

export function useActionableItems(teacherId: string | null, completed?: boolean) {
  return useQuery<{ items: ActionableItem[] }>({
    queryKey: ["actionable-items", teacherId, completed],
    queryFn: async () => {
      const response = await actionableItemsApi.list(teacherId!, completed);
      return {
      items: response.items.map((item) => ({
        ...item,
        deadline: item.deadline ? new Date(item.deadline) : undefined,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      })) as ActionableItem[],
      };
    },
    enabled: !!teacherId,
  });
}

export function useCreateActionableItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: actionableItemsApi.create,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["actionable-items", variables.teacherId] });
      // Also invalidate the by-source query so it shows "Linked" instead of "Convert"
      queryClient.invalidateQueries({ 
        queryKey: ["actionable-item", "by-source", variables.teacherId, variables.sourceType, variables.sourceId] 
      });
    },
  });
}

export function useUpdateActionableItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof actionableItemsApi.update>[1] }) =>
      actionableItemsApi.update(id, data),
    onSuccess: (data, variables) => {
      // Invalidate all actionable items queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["actionable-items"] });
      // Also invalidate by-source queries
      queryClient.invalidateQueries({ queryKey: ["actionable-item", "by-source"] });
    },
  });
}

export function useDeleteActionableItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: actionableItemsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionable-items"] });
      queryClient.invalidateQueries({ queryKey: ["actionable-item", "by-source"] });
    },
  });
}

export function useActionableItemBySource(
  teacherId: string | null,
  sourceType: "comment" | "ai_suggestion",
  sourceId: string | null
) {
  return useQuery<{ item: ActionableItem } | null>({
    queryKey: ["actionable-item", "by-source", teacherId, sourceType, sourceId],
    queryFn: async () => {
      try {
        const response = await actionableItemsApi.getBySource(teacherId!, sourceType, sourceId!);
        return {
        item: {
          ...response.item,
          deadline: response.item.deadline ? new Date(response.item.deadline) : undefined,
          createdAt: new Date(response.item.createdAt),
          updatedAt: new Date(response.item.updatedAt),
        } as ActionableItem,
        };
      } catch (error: any) {
        // 404 means no item is linked, which is fine - return null
        if (error?.status === 404) {
          return null;
        }
        // Re-throw other errors
        throw error;
      }
    },
    enabled: !!teacherId && !!sourceId,
    retry: false, // Don't retry on 404
  });
}

