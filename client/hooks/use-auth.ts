"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api-client";

export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
  });
}

