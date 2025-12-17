"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { actionableItemsApi } from "@/lib/api-client";
import type { ActionableItem } from "@/lib/types";

export function useActionableItems(restaurantId: string | null, completed?: boolean) {
  return useQuery<{ items: ActionableItem[] }>({
    queryKey: ["actionable-items", restaurantId, completed],
    queryFn: async () => {
      const response = await actionableItemsApi.list(restaurantId!, completed);
      return {
        items: response.items.map((item) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        })) as ActionableItem[],
      };
    },
    enabled: !!restaurantId,
  });
}

export function useCreateActionableItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: actionableItemsApi.create,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["actionable-items", variables.restaurantId] });
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
    },
  });
}

export function useDeleteActionableItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: actionableItemsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actionable-items"] });
    },
  });
}

