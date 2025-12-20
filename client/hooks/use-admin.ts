"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api-client";

export function useAdminLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      adminApi.login(email, password),
  });
}

export function useAdminTeachers() {
  return useQuery({
    queryKey: ["admin", "teachers"],
    queryFn: adminApi.getTeachers,
  });
}

// Legacy alias for backward compatibility
export const useAdminRestaurants = useAdminTeachers;

export function useUpdateTeacherStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teacherId, status }: { teacherId: string; status: "active" | "blocked" }) =>
      adminApi.updateTeacherStatus(teacherId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teachers"] });
    },
  });
}

// Legacy alias for backward compatibility
export const useUpdateRestaurantStatus = useUpdateTeacherStatus;

export function usePromoteToPremium() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      teacherId, 
      months, 
      discount, 
      amountPaid 
    }: { 
      teacherId: string; 
      months?: number | null;
      discount?: number;
      amountPaid?: number;
    }) =>
      adminApi.promoteToPremium(teacherId, months, discount, amountPaid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teachers"] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionId: string) =>
      adminApi.cancelSubscription(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teachers"] });
    },
  });
}

export function useAdminOrganizations() {
  return useQuery({
    queryKey: ["admin", "organizations"],
    queryFn: adminApi.getOrganizations,
  });
}

export function useUpdateOrganizationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, status }: { organizationId: string; status: "active" | "blocked" }) =>
      adminApi.updateOrganizationStatus(organizationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
    },
  });
}

export function usePromoteOrganizationToPremium() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      organizationId, 
      months, 
      discount, 
      amountPaid 
    }: { 
      organizationId: string; 
      months?: number | null;
      discount?: number;
      amountPaid?: number;
    }) =>
      adminApi.promoteOrganizationToPremium(organizationId, months, discount, amountPaid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
    },
  });
}

export function useCancelOrganizationSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionId: string) =>
      adminApi.cancelOrganizationSubscription(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "organizations"] });
    },
  });
}







