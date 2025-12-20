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
  registerTeacher: async (data: {
    teacherName: string;
    email: string;
    password: string;
    phone: string;
    address?: string;
    subject?: string;
    department?: string;
    organizationId?: string;
  }) => {
    const result = await fetchApi<{
      success: boolean;
      teacherId: string;
      token: string;
      qrCodeUrl: string;
      teacher: {
        id: string;
        name: string;
        email: string;
        organizationId?: string;
      };
    }>("/api/auth/register/teacher", {
      method: "POST",
      body: JSON.stringify(data),
    });
    
    // Store token in localStorage if present
    if (result.token && typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, result.token);
    }
    
    return result;
  },

  registerOrganization: async (data: {
    organizationName: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    website?: string;
  }) => {
    const result = await fetchApi<{
      success: boolean;
      organizationId: string;
      token: string;
      organization: {
        id: string;
        name: string;
        email: string;
      };
    }>("/api/auth/register/organization", {
      method: "POST",
      body: JSON.stringify(data),
    });
    
    // Store token in localStorage if present
    if (result.token && typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, result.token);
    }
    
    return result;
  },

  login: async (email: string, password: string) => {
    return fetchApi<{
      success: boolean;
      token: string;
      teacherId?: string;
      organizationId?: string;
      teacher?: {
        id: string;
        name: string;
        email: string;
      };
      organization?: {
        id: string;
        name: string;
        email: string;
      };
      userType: "teacher" | "organization";
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  me: async (token: string) => {
    return fetchApi<{
      success: boolean;
      userType: "teacher" | "organization";
      teacher?: {
        id: string;
        name: string;
        email: string;
        organizationId?: string;
        subscription?: {
          id: string;
          plan: "free" | "basic" | "premium" | "enterprise";
          status: "active" | "cancelled" | "expired" | "trial";
          startDate: string;
          endDate: string | null;
          monthlyPrice: number;
        } | null;
      };
      organization?: {
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
    teacherId: string;
    classId?: string;
    studentName?: string;
    studentContact?: string;
    studentId?: string;
    teachingRating: number;
    communicationRating: number;
    materialRating: number;
    overallRating: number;
    suggestions?: string;
    courseName?: string;
    tagIds?: string[];
  }) => {
    return fetchApi<{
      success: boolean;
      message: string;
    }>("/api/feedback/submit", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  list: async (teacherId: string, tagId?: string) => {
    const params = new URLSearchParams({ teacherId });
    if (tagId) {
      params.append("tagId", tagId);
    }
    return fetchApi<{
      feedback: Array<{
        id: string;
        teacherId: string;
        studentName?: string;
        studentContact?: string;
        studentId?: string;
        teachingRating: number;
        communicationRating: number;
        materialRating: number;
        overallRating: number;
        suggestions?: string;
        courseName?: string;
        createdAt: string;
        tags?: Array<{
          id: string;
          name: string;
          color?: string;
          description?: string;
        }>;
      }>;
    }>(`/api/feedback/list?${params.toString()}`);
  },

  stats: async (teacherId: string) => {
    return fetchApi<{
      stats: {
        totalFeedback: number;
        averageRatings: {
          teaching: number;
          communication: number;
          material: number;
          overall: number;
        };
        recentTrend: "improving" | "stable" | "declining";
        externalReviewsCount: {
          google: number;
          facebook: number;
          instagram: number;
        };
      };
    }>(`/api/feedback/stats?teacherId=${teacherId}`);
  },
};

// Teachers API (formerly Restaurants API)
export const teachersApi = {
  getReviewPageSettings: async (teacherId: string) => {
    return fetchApi<{
      welcomeMessage: string;
      primaryColor: string;
      secondaryColor: string;
      backgroundColor: string;
      designVariation: string;
    }>(`/api/teachers/review-page-settings?teacherId=${teacherId}`);
  },

  updateReviewPageSettings: async (
    teacherId: string,
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
    }>("/api/teachers/review-page-settings", {
      method: "PUT",
      body: JSON.stringify({ teacherId, ...settings }),
    });
  },
};

// Legacy alias for backward compatibility (can be removed later)
export const restaurantsApi = teachersApi;

// Classes API
export const classesApi = {
  create: async (data: {
    name: string;
    description?: string;
    teacherId?: string; // Required for organization-level class creation
  }) => {
    return fetchApi<{
      success: boolean;
      class: {
        id: string;
        name: string;
        description?: string;
        teacherId: string;
        organizationId?: string;
        qrCode: string;
        qrCodeUrl: string;
        status: "active" | "archived";
        createdAt: string;
        updatedAt: string;
      };
    }>("/api/classes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  list: async (params?: {
    teacherId?: string;
    status?: "active" | "archived";
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.teacherId) queryParams.append("teacherId", params.teacherId);
    if (params?.status) queryParams.append("status", params.status);

    const queryString = queryParams.toString();
    return fetchApi<{
      classes: Array<{
        id: string;
        name: string;
        description?: string;
        teacherId: string;
        organizationId?: string;
        qrCode: string;
        qrCodeUrl: string;
        status: "active" | "archived";
        createdAt: string;
        updatedAt: string;
        teacher?: {
          id: string;
          name: string;
          email: string;
        };
      }>;
    }>(`/api/classes${queryString ? `?${queryString}` : ""}`);
  },

  get: async (classId: string) => {
    return fetchApi<{
      class: {
        id: string;
        name: string;
        description?: string;
        teacherId: string;
        organizationId?: string;
        qrCode: string;
        qrCodeUrl: string;
        status: "active" | "archived";
        createdAt: string;
        updatedAt: string;
        teacher?: {
          id: string;
          name: string;
          email: string;
        };
      };
    }>(`/api/classes/${classId}`);
  },

  update: async (
    classId: string,
    data: {
      name?: string;
      description?: string;
      status?: "active" | "archived";
    }
  ) => {
    return fetchApi<{
      success: boolean;
      class: {
        id: string;
        name: string;
        description?: string;
        teacherId: string;
        organizationId?: string;
        qrCode: string;
        qrCodeUrl: string;
        status: "active" | "archived";
        createdAt: string;
        updatedAt: string;
      };
    }>(`/api/classes/${classId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (classId: string) => {
    return fetchApi<{
      success: boolean;
      message: string;
    }>(`/api/classes/${classId}`, {
      method: "DELETE",
    });
  },
};

// Admin API
export const adminApi = {
  login: async (email: string, password: string) => {
    const result = await fetchApi<{
      success: boolean;
      token?: string;
      userType?: "admin";
      admin: {
        id: string;
        email: string;
        role: "super_admin" | "admin";
      };
    }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    
    // Store token in localStorage if present
    if (result.token && typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, result.token);
    }
    
    return result;
  },

  getTeachers: async () => {
    const data = await fetchApi<{
      teachers: Array<{
        id: string;
        name: string;
        email: string;
        phone: string;
        address?: string;
        subject?: string;
        department?: string;
        organizationId?: string;
        status: "active" | "blocked";
        feedbackCount: number;
        averageRating: number;
        createdAt: string;
        updatedAt: string;
      }>;
    }>("/api/admin/teachers");
    
    // Map backend response to include optional fields that might be missing
    return {
      teachers: (data.teachers || []).map((t: any) => ({
        ...t,
        subscription: t.subscription || undefined,
        lastActivity: t.lastActivity || undefined,
      })),
    };
  },

  updateTeacherStatus: async (teacherId: string, status: "active" | "blocked") => {
    return fetchApi<{
      success: boolean;
      teacher: any;
    }>("/api/admin/teachers/status", {
      method: "PATCH",
      body: JSON.stringify({ teacherId, status }),
    });
  },

  promoteToPremium: async (
    teacherId: string,
    months?: number | null,
    discount?: number,
    amountPaid?: number
  ) => {
    return fetchApi<{
      success: boolean;
      subscription: {
        id: string;
        teacherId?: string;
        organizationId?: string;
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
    }>("/api/admin/teachers/promote-premium", {
      method: "POST",
      body: JSON.stringify({ teacherId, months, discount, amountPaid }),
    });
  },

  cancelSubscription: async (subscriptionId: string) => {
    return fetchApi<{
      success: boolean;
      subscription: {
        id: string;
        teacherId?: string;
        organizationId?: string;
        plan: string;
        status: "cancelled";
      };
      message: string;
    }>("/api/admin/teachers/cancel-subscription", {
      method: "POST",
      body: JSON.stringify({ subscriptionId }),
    });
  },

  getOrganizations: async () => {
    const data = await fetchApi<{
      organizations: Array<{
        id: string;
        name: string;
        email: string;
        phone: string;
        address?: string;
        website?: string;
        status: "active" | "blocked";
        teacherCount: number;
        createdAt: string;
        updatedAt: string;
        subscription?: {
          id: string;
          plan: string;
          status: string;
          startDate: string;
          endDate: string | null;
          monthlyPrice: number;
          defaultPrice: number;
          discount?: number;
          finalPrice: number;
          amountPaid?: number;
        };
      }>;
    }>("/api/admin/organizations");
    
    return {
      organizations: (data.organizations || []).map((org: any) => ({
        ...org,
        subscription: org.subscription || undefined,
      })),
    };
  },

  updateOrganizationStatus: async (organizationId: string, status: "active" | "blocked") => {
    return fetchApi<{
      success: boolean;
      organization: any;
    }>("/api/admin/organizations/status", {
      method: "PATCH",
      body: JSON.stringify({ organizationId, status }),
    });
  },

  promoteOrganizationToPremium: async (
    organizationId: string,
    months?: number | null,
    discount?: number,
    amountPaid?: number
  ) => {
    return fetchApi<{
      success: boolean;
      subscription: {
        id: string;
        organizationId?: string;
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
    }>("/api/admin/organizations/promote-premium", {
      method: "POST",
      body: JSON.stringify({ organizationId, months, discount, amountPaid }),
    });
  },

  cancelOrganizationSubscription: async (subscriptionId: string) => {
    return fetchApi<{
      success: boolean;
      subscription: {
        id: string;
        teacherId?: string;
        organizationId?: string;
        plan: string;
        status: "cancelled";
      };
      message: string;
    }>("/api/admin/organizations/cancel-subscription", {
      method: "POST",
      body: JSON.stringify({ subscriptionId }),
    });
  },
};

// Tags API
export const tagsApi = {
  list: async (params?: {
    teacherId?: string;
    organizationId?: string;
    includeInactive?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.teacherId) queryParams.append("teacherId", params.teacherId);
    if (params?.organizationId) queryParams.append("organizationId", params.organizationId);
    if (params?.includeInactive) queryParams.append("includeInactive", "true");

    const queryString = queryParams.toString();
    return fetchApi<{
      tags: Array<{
        id: string;
        name: string;
        description?: string;
        color?: string;
        teacherId?: string;
        organizationId?: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      }>;
    }>(`/api/tags${queryString ? `?${queryString}` : ""}`);
  },

  create: async (data: {
    name: string;
    description?: string;
    color?: string;
    teacherId?: string;
    organizationId?: string;
  }) => {
    return fetchApi<{
      success: boolean;
      tag: {
        id: string;
        name: string;
        description?: string;
        color?: string;
        teacherId?: string;
        organizationId?: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
    }>("/api/tags", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    tagId: string,
    data: {
      name?: string;
      description?: string;
      color?: string;
      isActive?: boolean;
    }
  ) => {
    return fetchApi<{
      success: boolean;
      tag: {
        id: string;
        name: string;
        description?: string;
        color?: string;
        teacherId?: string;
        organizationId?: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/api/tags/${tagId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (tagId: string) => {
    return fetchApi<{
      success: boolean;
      message: string;
    }>(`/api/tags/${tagId}`, {
      method: "DELETE",
    });
  },

  getStats: async (tagId: string) => {
    return fetchApi<{
      tag: {
        id: string;
        name: string;
        description?: string;
        color?: string;
        teacherId?: string;
        organizationId?: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
      stats: {
        feedbackCount: number;
        reviewCount: number;
        totalCount: number;
        averageRating: number;
      };
    }>(`/api/tags/stats/${tagId}`);
  },
};

// External Reviews API
export const externalReviewsApi = {
  list: async (teacherId: string) => {
    return fetchApi<{
      reviews: Array<{
        id: string;
        teacherId: string;
        platform: "google" | "facebook" | "instagram";
        author: string;
        rating: number;
        comment: string;
        reviewDate: string;
        syncedAt: string;
      }>;
    }>(`/api/external-reviews/list?teacherId=${teacherId}`);
  },

  sync: async (teacherId: string, platforms?: string[], placeId?: string) => {
    return fetchApi<{
      success: boolean;
      results: Record<string, { success: boolean; count: number; error?: string }>;
      totalSynced: number;
      syncedAt: string;
    }>("/api/external-reviews/sync", {
      method: "POST",
      body: JSON.stringify({ teacherId, platforms, placeId }),
    });
  },
};

// Meta OAuth API
export const metaAuthApi = {
  authorize: (teacherId: string) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    return `${backendUrl}/api/auth/meta/authorize?teacherId=${teacherId}`;
  },
};

// AI API
export type TimePeriod = "2days" | "week" | "month" | "2months" | "3months" | "4months" | "5months" | "6months";

export const aiApi = {
  getInsights: async (teacherId: string, timePeriod?: TimePeriod) => {
    const params = new URLSearchParams({ teacherId });
    if (timePeriod) {
      params.append("timePeriod", timePeriod);
    }
    return fetchApi<{
      insight: {
        id: string;
        teacherId: string;
        summary: string;
        recommendations: string[];
        sentiment: "positive" | "neutral" | "negative";
        keyTopics: string[];
        generatedAt: string;
      } | null;
    }>(`/api/ai/insights?${params.toString()}`);
  },

  generateInsights: async (teacherId: string, timePeriod: TimePeriod = "month", filter: "external" | "internal" | "overall" = "overall") => {
    return fetchApi<{
      success: boolean;
      insight: any;
      message: string;
    }>("/api/ai/generate-insights", {
      method: "POST",
      body: JSON.stringify({ teacherId, timePeriod, filter }),
    });
  },

  chat: async (teacherId: string, message: string) => {
    return fetchApi<{
      success: boolean;
      response: string;
    }>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ teacherId, message }),
      timeout: 120000, // 2 minutes timeout for AI chat
    });
  },

  /**
   * Stream chat response from AI
   * @param teacherId - Teacher ID
   * @param message - User message
   * @param onChunk - Callback for each chunk of the stream
   * @returns Promise that resolves when stream completes
   */
  chatStream: async (
    teacherId: string,
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
      body: JSON.stringify({ teacherId, message }),
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
  list: async (teacherId: string, completed?: boolean) => {
    const params = new URLSearchParams({ teacherId });
    if (completed !== undefined) {
      params.append("completed", String(completed));
    }
    return fetchApi<{
      items: Array<{
        id: string;
        teacherId: string;
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
    teacherId: string;
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
        teacherId: string;
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
        teacherId: string;
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

  getBySource: async (teacherId: string, sourceType: "comment" | "ai_suggestion", sourceId: string) => {
    const params = new URLSearchParams({
      teacherId,
      sourceType,
      sourceId,
    });
    return fetchApi<{
      item: {
        id: string;
        teacherId: string;
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
  list: async (teacherId: string) => {
    const params = new URLSearchParams({ teacherId });
    return fetchApi<{
      members: Array<{
        id: string;
        teacherId: string;
        organizationId?: string;
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
    teacherId: string;
    name: string;
    email?: string;
    phone?: string;
    role?: string;
  }) => {
    return fetchApi<{
      success: boolean;
      member: {
        id: string;
        teacherId: string;
        organizationId?: string;
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
        teacherId: string;
        organizationId?: string;
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

