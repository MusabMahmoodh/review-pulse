"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/lib/api-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

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
    const loadAuth = async () => {
      try {
        const existingToken = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null;
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const sessionToken = data.session?.access_token || null;
        const activeToken = existingToken || sessionToken;

        if (!activeToken) {
          setIsLoading(false);
          return;
        }

        if (typeof window !== "undefined") {
          window.localStorage.setItem(TOKEN_KEY, activeToken);
        }

        setToken(activeToken);

        const res = await authApi.me(activeToken);
        setUser(res.restaurant);
      } catch (err: any) {
        console.error("Auth me error", err);
        setError(err?.data?.error || "Session expired");
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(TOKEN_KEY);
        }
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadAuth();
  }, []);

  const logout = () => {
    const supabase = getSupabaseBrowserClient();
    void supabase.auth.signOut();
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




