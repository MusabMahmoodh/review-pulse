"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teamMembersApi } from "@/lib/api-client";
import type { TeamMember } from "@/lib/types";

export function useTeamMembers(restaurantId: string | null) {
  return useQuery<{ members: TeamMember[] }>({
    queryKey: ["team-members", restaurantId],
    queryFn: async () => {
      const response = await teamMembersApi.list(restaurantId!);
      return {
        members: response.members.map((member) => ({
          ...member,
          createdAt: new Date(member.createdAt),
          updatedAt: new Date(member.updatedAt),
        })) as TeamMember[],
      };
    },
    enabled: !!restaurantId,
  });
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: teamMembersApi.create,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["team-members", variables.restaurantId] });
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof teamMembersApi.update>[1] }) =>
      teamMembersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: teamMembersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}



