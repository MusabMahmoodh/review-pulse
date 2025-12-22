import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formsApi } from "@/lib/api-client";

export function useForms(params?: {
  teacherId?: string;
  organizationId?: string;
  includeInactive?: boolean;
}) {
  return useQuery({
    queryKey: ["forms", params],
    queryFn: () => formsApi.getForms(params),
  });
}

export function useCreateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: formsApi.createForm,
    onSuccess: (_, variables) => {
      // Invalidate forms queries for the specific teacher/org
      queryClient.invalidateQueries({ 
        queryKey: ["forms"],
        exact: false,
      });
    },
  });
}

export function useUpdateForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formId, data }: { formId: string; data: any }) =>
      formsApi.updateForm(formId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}

export function useDeleteForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: formsApi.deleteForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}

export function useGetOrCreateGeneralForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: formsApi.getOrCreateGeneralForm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
}

