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

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(response.status, response.statusText, errorData);
  }

  return response.json();
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

  getGoogleIntegration: async (restaurantId: string) => {
    return fetchApi<{
      connected: boolean;
      status: "active" | "expired" | "revoked" | null;
      lastSyncedAt: string | null;
    }>(`/api/restaurants/google-integration?restaurantId=${restaurantId}`);
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
    return fetchApi<{
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

  sync: async (restaurantId: string, platforms?: string[]) => {
    return fetchApi<{
      success: boolean;
      results: Record<string, { success: boolean; count: number; error?: string }>;
      totalSynced: number;
      syncedAt: string;
    }>("/api/external-reviews/sync", {
      method: "POST",
      body: JSON.stringify({ restaurantId, platforms }),
    });
  },
};

// Google OAuth API
export const googleAuthApi = {
  authorize: (restaurantId: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    return `${backendUrl}/api/auth/google/authorize?restaurantId=${restaurantId}`;
  },
};

// AI API
export const aiApi = {
  getInsights: async (restaurantId: string) => {
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
    }>(`/api/ai/insights?restaurantId=${restaurantId}`);
  },

  generateInsights: async (restaurantId: string) => {
    return fetchApi<{
      success: boolean;
      insight: any;
      message: string;
    }>("/api/ai/generate-insights", {
      method: "POST",
      body: JSON.stringify({ restaurantId }),
    });
  },

  chat: async (restaurantId: string, message: string) => {
    return fetchApi<{
      success: boolean;
      response: string;
    }>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ restaurantId, message }),
    });
  },
};

