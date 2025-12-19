// API Client for backend server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = "ApiError";
  }
}

const TOKEN_KEY = "rp_auth_token";

function getBrowserToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit & { authToken?: string; timeout?: number }
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const { authToken, timeout, ...fetchOptions } = options || {};
  const token = authToken ?? getBrowserToken();

  // Create AbortController for timeout if specified
  const controller = timeout ? new AbortController() : undefined;
  const timeoutId = timeout
    ? setTimeout(() => controller!.abort(), timeout)
    : undefined;

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller?.signal,
      headers: {
        "Content-Type": "application/json",
        ...(fetchOptions as RequestInit | undefined)?.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401 && typeof window !== "undefined") {
        // Clear invalid token
        try {
          window.localStorage.removeItem(TOKEN_KEY);
        } catch {
          // Ignore localStorage errors
        }
        
        // Redirect to login page if not already there
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/register") {
          window.location.href = "/login";
        }
      }
      
      throw new ApiError(response.status, response.statusText, errorData);
    }

    return response.json();
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(408, "Request Timeout", { message: "Request timed out" });
    }
    throw error;
  }
}

// Auth API
export const authApi = {
  register: async (data: {
    restaurantName: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    socialKeywords?: string[];
  }) => {
    return fetchApi<{
      success: boolean;
      restaurantId: string;
      qrCodeUrl: string;
    }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  login: async (email: string, password: string) => {
    return fetchApi<{
      success: boolean;
      token: string;
      restaurantId: string;
      restaurant: {
        id: string;
        name: string;
        email: string;
      };
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  me: async (token: string) => {
    return fetchApi<{
      success: boolean;
      restaurant: {
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
      };
    }>("/api/auth/me", {
      authToken: token,
    });
  },
};

// Feedback API
export const feedbackApi = {
  submit: async (data: {
    restaurantId: string;
    customerName?: string;
    customerContact?: string;
    foodRating: number;
    staffRating: number;
    ambienceRating: number;
    overallRating: number;
    suggestions?: string;
  }) => {
    return fetchApi<{
      success: boolean;
      message: string;
    }>("/api/feedback/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  list: async (restaurantId: string) => {
    return fetchApi<{
      feedback: Array<{
        id: string;
        restaurantId: string;
        customerName?: string;
        customerContact?: string;
        foodRating: number;
        staffRating: number;
        ambienceRating: number;
        overallRating: number;
        suggestions?: string;
        createdAt: string;
      }>;
    }>(`/api/feedback/list?restaurantId=${restaurantId}`);
  },

  stats: async (restaurantId: string) => {
    return fetchApi<{
      stats: {
        totalFeedback: number;
        averageRatings: {
          food: number;
          staff: number;
          ambience: number;
          overall: number;
        };
        recentTrend: "improving" | "stable" | "declining";
        externalReviewsCount: {
          google: number;
          facebook: number;
          instagram: number;
        };
      };
    }>(`/api/feedback/stats?restaurantId=${restaurantId}`);
  },
};

// Restaurants API
export const restaurantsApi = {
  getKeywords: async (restaurantId: string) => {
    return fetchApi<{
      keywords: string[];
    }>(`/api/restaurants/keywords?restaurantId=${restaurantId}`);
  },

  updateKeywords: async (restaurantId: string, keywords: string[]) => {
    return fetchApi<{
      success: boolean;
      message: string;
      keywords: string[];
    }>("/api/restaurants/keywords", {
      method: "PUT",
      body: JSON.stringify({ restaurantId, keywords }),
    });
  },

  getMetaIntegration: async (restaurantId: string) => {
    return fetchApi<{
      connected: boolean;
      status: "active" | "expired" | "revoked" | null;
      lastSyncedAt: string | null;
      pageId: string | null;
      instagramBusinessAccountId: string | null;
    }>(`/api/restaurants/meta-integration?restaurantId=${restaurantId}`);
  },

  getReviewPageSettings: async (restaurantId: string) => {
    return fetchApi<{
      welcomeMessage: string;
      primaryColor: string;
      secondaryColor: string;
      backgroundColor: string;
      designVariation: string;
    }>(`/api/restaurants/review-page-settings?restaurantId=${restaurantId}`);
  },

  updateReviewPageSettings: async (
    restaurantId: string,
    settings: {
      welcomeMessage?: string;
      primaryColor?: string;
      secondaryColor?: string;
      backgroundColor?: string;
      designVariation?: string;
    }
  ) => {
    return fetchApi<{
      success: boolean;
      message: string;
      settings: {
        welcomeMessage: string;
        primaryColor: string;
        secondaryColor: string;
        backgroundColor: string;
        designVariation: string;
      };
    }>("/api/restaurants/review-page-settings", {
      method: "PUT",
      body: JSON.stringify({ restaurantId, ...settings }),
    });
  },

  getGooglePlaceId: async (restaurantId: string) => {
    return fetchApi<{
      success: boolean;
      placeId: string | null;
    }>(`/api/restaurants/google-place-id?restaurantId=${restaurantId}`);
  },

  updateGooglePlaceId: async (restaurantId: string, placeId: string) => {
    return fetchApi<{
      success: boolean;
      message: string;
      placeId: string;
    }>("/api/restaurants/google-place-id", {
      method: "PUT",
      body: JSON.stringify({ restaurantId, placeId }),
    });
  },
};

// Admin API
export const adminApi = {
  login: async (email: string, password: string) => {
    return fetchApi<{
      success: boolean;
      admin: {
        id: string;
        email: string;
        role: "super_admin" | "admin";
      };
    }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  getRestaurants: async () => {
    const data = await fetchApi<{
      restaurants: Array<{
        id: string;
        name: string;
        email: string;
        phone: string;
        address: string;
        status: "active" | "blocked";
        feedbackCount: number;
        averageRating: number;
        createdAt: string;
        updatedAt: string;
      }>;
    }>("/api/admin/restaurants");
    
    // Map backend response to include optional fields that might be missing
    return {
      restaurants: (data.restaurants || []).map((r: any) => ({
        ...r,
        socialKeywords: r.socialKeywords || [],
        subscription: r.subscription || undefined,
        lastActivity: r.lastActivity || undefined,
      })),
    };
  },

  updateRestaurantStatus: async (restaurantId: string, status: "active" | "blocked") => {
    return fetchApi<{
      success: boolean;
      restaurant: any;
    }>("/api/admin/restaurants/status", {
      method: "PATCH",
      body: JSON.stringify({ restaurantId, status }),
    });
  },

  promoteToPremium: async (
    restaurantId: string,
    months?: number | null,
    discount?: number,
    amountPaid?: number
  ) => {
    return fetchApi<{
      success: boolean;
      subscription: {
        id: string;
        restaurantId: string;
        plan: "premium" | "enterprise";
        status: "active";
        startDate: string;
        endDate: string | null;
        monthlyPrice: number;
        defaultPrice: number;
        discount?: number;
        finalPrice: number;
        amountPaid?: number;
      };
      message: string;
    }>("/api/admin/restaurants/promote-premium", {
      method: "POST",
      body: JSON.stringify({ restaurantId, months, discount, amountPaid }),
    });
  },

  cancelSubscription: async (subscriptionId: string) => {
    return fetchApi<{
      success: boolean;
      subscription: {
        id: string;
        restaurantId: string;
        plan: string;
        status: "cancelled";
      };
      message: string;
    }>("/api/admin/restaurants/cancel-subscription", {
      method: "POST",
      body: JSON.stringify({ subscriptionId }),
    });
  },
};

// External Reviews API
export const externalReviewsApi = {
  list: async (restaurantId: string) => {
    return fetchApi<{
      reviews: Array<{
        id: string;
        restaurantId: string;
        platform: "google" | "facebook" | "instagram";
        author: string;
        rating: number;
        comment: string;
        reviewDate: string;
        syncedAt: string;
      }>;
    }>(`/api/external-reviews/list?restaurantId=${restaurantId}`);
  },

  sync: async (restaurantId: string, platforms?: string[], placeId?: string) => {
    return fetchApi<{
      success: boolean;
      results: Record<string, { success: boolean; count: number; error?: string }>;
      totalSynced: number;
      syncedAt: string;
    }>("/api/external-reviews/sync", {
      method: "POST",
      body: JSON.stringify({ restaurantId, platforms, placeId }),
    });
  },
};

// Meta OAuth API
export const metaAuthApi = {
  authorize: (restaurantId: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    return `${backendUrl}/api/auth/meta/authorize?restaurantId=${restaurantId}`;
  },
};

// AI API
export type TimePeriod = "2days" | "week" | "month" | "2months" | "3months" | "4months" | "5months" | "6months";

export const aiApi = {
  getInsights: async (restaurantId: string, timePeriod?: TimePeriod) => {
    const params = new URLSearchParams({ restaurantId });
    if (timePeriod) {
      params.append("timePeriod", timePeriod);
    }
    return fetchApi<{
      insight: {
        id: string;
        restaurantId: string;
        summary: string;
        recommendations: string[];
        sentiment: "positive" | "neutral" | "negative";
        keyTopics: string[];
        generatedAt: string;
      } | null;
    }>(`/api/ai/insights?${params.toString()}`);
  },

  generateInsights: async (restaurantId: string, timePeriod: TimePeriod = "month") => {
    return fetchApi<{
      success: boolean;
      insight: any;
      message: string;
    }>("/api/ai/generate-insights", {
      method: "POST",
      body: JSON.stringify({ restaurantId, timePeriod }),
    });
  },

  chat: async (restaurantId: string, message: string) => {
    return fetchApi<{
      success: boolean;
      response: string;
    }>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ restaurantId, message }),
      timeout: 120000, // 2 minutes timeout for AI chat
    });
  },

  /**
   * Stream chat response from AI
   * @param restaurantId - Restaurant ID
   * @param message - User message
   * @param onChunk - Callback for each chunk of the stream
   * @returns Promise that resolves when stream completes
   */
  chatStream: async (
    restaurantId: string,
    message: string,
    onChunk: (chunk: string) => void
  ): Promise<void> => {
    const url = `${API_BASE_URL}/api/ai/chat/stream`;
    const token = getBrowserToken();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ restaurantId, message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401 && typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(TOKEN_KEY);
        } catch {
          // Ignore localStorage errors
        }
        
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/register") {
          window.location.href = "/login";
        }
      }
      
      throw new ApiError(response.status, response.statusText, errorData);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};

// Actionable Items API
export const actionableItemsApi = {
  list: async (restaurantId: string, completed?: boolean) => {
    const params = new URLSearchParams({ restaurantId });
    if (completed !== undefined) {
      params.append("completed", String(completed));
    }
    return fetchApi<{
      items: Array<{
        id: string;
        restaurantId: string;
        title: string;
        description?: string;
        completed: boolean;
        sourceType: "comment" | "ai_suggestion";
        sourceId: string;
        sourceText?: string;
        assignedTo?: string;
        deadline?: string;
        createdAt: string;
        updatedAt: string;
      }>;
    }>(`/api/actionable-items?${params.toString()}`);
  },

  create: async (data: {
    restaurantId: string;
    title: string;
    description?: string;
    sourceType: "comment" | "ai_suggestion";
    sourceId: string;
    sourceText?: string;
    assignedTo?: string;
    deadline?: string;
  }) => {
    return fetchApi<{
      success: boolean;
      item: {
        id: string;
        restaurantId: string;
        title: string;
        description?: string;
        completed: boolean;
        sourceType: "comment" | "ai_suggestion";
        sourceId: string;
        sourceText?: string;
        assignedTo?: string;
        deadline?: string;
        createdAt: string;
        updatedAt: string;
      };
    }>("/api/actionable-items", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    title?: string;
    description?: string;
    completed?: boolean;
    assignedTo?: string | null;
    deadline?: string | null;
  }) => {
    return fetchApi<{
      success: boolean;
      item: {
        id: string;
        restaurantId: string;
        title: string;
        description?: string;
        completed: boolean;
        sourceType: "comment" | "ai_suggestion";
        sourceId: string;
        sourceText?: string;
        assignedTo?: string;
        deadline?: string;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/api/actionable-items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return fetchApi<{
      success: boolean;
      message: string;
    }>(`/api/actionable-items/${id}`, {
      method: "DELETE",
    });
  },

  getBySource: async (restaurantId: string, sourceType: "comment" | "ai_suggestion", sourceId: string) => {
    const params = new URLSearchParams({
      restaurantId,
      sourceType,
      sourceId,
    });
    return fetchApi<{
      item: {
        id: string;
        restaurantId: string;
        title: string;
        description?: string;
        completed: boolean;
        sourceType: "comment" | "ai_suggestion";
        sourceId: string;
        sourceText?: string;
        assignedTo?: string;
        deadline?: string;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/api/actionable-items/by-source?${params.toString()}`);
  },
};

// Team Members API
export const teamMembersApi = {
  list: async (restaurantId: string) => {
    const params = new URLSearchParams({ restaurantId });
    return fetchApi<{
      members: Array<{
        id: string;
        restaurantId: string;
        name: string;
        email?: string;
        phone?: string;
        role?: string;
        createdAt: string;
        updatedAt: string;
      }>;
    }>(`/api/team-members?${params.toString()}`);
  },

  create: async (data: {
    restaurantId: string;
    name: string;
    email?: string;
    phone?: string;
    role?: string;
  }) => {
    return fetchApi<{
      success: boolean;
      member: {
        id: string;
        restaurantId: string;
        name: string;
        email?: string;
        phone?: string;
        role?: string;
        createdAt: string;
        updatedAt: string;
      };
    }>("/api/team-members", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  }) => {
    return fetchApi<{
      success: boolean;
      member: {
        id: string;
        restaurantId: string;
        name: string;
        email?: string;
        phone?: string;
        role?: string;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/api/team-members/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return fetchApi<{
      success: boolean;
      message: string;
    }>(`/api/team-members/${id}`, {
      method: "DELETE",
    });
  },
};

