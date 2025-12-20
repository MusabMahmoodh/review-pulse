"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api-client";

const TOKEN_KEY = "rp_auth_token";

export function useRegister() {
  return useMutation({
    mutationFn: authApi.register,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const result = await authApi.login(email, password);
      if (typeof window !== "undefined" && result.token) {
        window.localStorage.setItem(TOKEN_KEY, result.token);
      }
      return result;
    },
  });
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{
    id: string;
    name: string;
    email: string;
    userType: "teacher" | "organization";
    organizationId?: string;
    subscription?: {
      id: string;
      plan: "free" | "basic" | "premium" | "enterprise";
      status: "active" | "cancelled" | "expired" | "trial";
      startDate: string;
      endDate: string | null;
      monthlyPrice: number;
    } | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existingToken = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
    if (!existingToken) {
      setIsLoading(false);
      return;
    }

    setToken(existingToken);

    authApi
      .me(existingToken)
      .then((res) => {
        if (res.teacher) {
          setUser({
            id: res.teacher.id,
            name: res.teacher.name,
            email: res.teacher.email,
            userType: "teacher",
            organizationId: res.teacher.organizationId,
            subscription: res.teacher.subscription || null,
          });
        } else if (res.organization) {
          setUser({
            id: res.organization.id,
            name: res.organization.name,
            email: res.organization.email,
            userType: "organization",
            subscription: res.organization.subscription || null,
          });
        }
      })
      .catch((err: any) => {
        console.error("Auth me error", err);
        setError(err?.data?.error || "Session expired");
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(TOKEN_KEY);
        }
        setToken(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const logout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
    }
    setToken(null);
    setUser(null);
  };

  return {
    token,
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout,
  };
}




