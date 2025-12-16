"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-client";

export function useAdminLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      adminApi.login(email, password),
  });
}

export function useAdminRestaurants() {
  return useQuery({
    queryKey: ["admin", "restaurants"],
    queryFn: adminApi.getRestaurants,
  });
}

export function useUpdateRestaurantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ restaurantId, status }: { restaurantId: string; status: "active" | "blocked" }) =>
      adminApi.updateRestaurantStatus(restaurantId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "restaurants"] });
    },
  });
}

export function usePromoteToPremium() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ restaurantId, months }: { restaurantId: string; months?: number | null }) =>
      adminApi.promoteToPremium(restaurantId, months),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "restaurants"] });
    },
  });
}







