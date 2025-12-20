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
      // But don't redirect on public pages like feedback submission
      if (response.status === 401 && typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const isPublicPage = currentPath.startsWith("/feedback/") || 
                            currentPath === "/login" || 
                            currentPath === "/register" ||
                            currentPath === "/";
        
        // Only redirect if not on a public page
        if (!isPublicPage) {
          // Clear invalid token
          try {
            window.localStorage.removeItem(TOKEN_KEY);
          } catch {
            // Ignore localStorage errors
          }
          
          // Redirect to login page if not already there
          if (currentPath !== "/login" && currentPath !== "/register") {
            window.location.href = "/login";
          }
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
    teacherId?: string;
    organizationId?: string;
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

  list: async (teacherId: string | null, queryString?: string) => {
    // If teacherId is null, it means organization-level access
    const params = new URLSearchParams();
    if (teacherId) {
      params.append("teacherId", teacherId);
    }
    if (queryString) {
      // Parse additional query params
      const additionalParams = new URLSearchParams(queryString);
      additionalParams.forEach((value, key) => {
        params.append(key, value);
      });
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
        teacher?: {
          id: string;
          name: string;
          email: string;
        };
      }>;
    }>(`/api/feedback/list${params.toString() ? `?${params.toString()}` : ""}`);
  },

  stats: async (teacherId: string | null, queryString?: string) => {
    const params = new URLSearchParams();
    if (teacherId) {
      params.append("teacherId", teacherId);
    }
    if (queryString) {
      const additionalParams = new URLSearchParams(queryString);
      additionalParams.forEach((value, key) => {
        params.append(key, value);
      });
    }
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
    }>(`/api/feedback/stats${params.toString() ? `?${params.toString()}` : ""}`);
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
  getInsights: async (teacherId: string | null, timePeriod?: TimePeriod, organizationId?: string) => {
    const params = new URLSearchParams();
    if (teacherId) {
      params.append("teacherId", teacherId);
    }
    if (organizationId) {
      params.append("organizationId", organizationId);
    }
    if (timePeriod) {
      params.append("timePeriod", timePeriod);
    }
    return fetchApi<{
      insight: {
        id: string;
        teacherId?: string;
        organizationId?: string;
        summary: string;
        recommendations: string[];
        sentiment: "positive" | "neutral" | "negative";
        keyTopics: string[];
        generatedAt: string;
      } | null;
    }>(`/api/ai/insights${params.toString() ? `?${params.toString()}` : ""}`);
  },

  generateInsights: async (teacherId: string | null, timePeriod: TimePeriod = "month", filter: "external" | "internal" | "overall" = "overall", organizationId?: string) => {
    const body: any = { timePeriod, filter };
    if (teacherId) {
      body.teacherId = teacherId;
    }
    if (organizationId) {
      body.organizationId = organizationId;
    }
    return fetchApi<{
      success: boolean;
      insight: any;
      message: string;
    }>("/api/ai/generate-insights", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  chat: async (teacherId: string | null, message: string, organizationId?: string) => {
    const body: any = { message };
    if (teacherId) {
      body.teacherId = teacherId;
    }
    if (organizationId) {
      body.organizationId = organizationId;
    }
    return fetchApi<{
      success: boolean;
      response: string;
    }>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify(body),
      timeout: 120000, // 2 minutes timeout for AI chat
    });
  },

  /**
   * Stream chat response from AI
   * @param teacherId - Teacher ID (optional if organizationId provided)
   * @param message - User message
   * @param onChunk - Callback for each chunk of the stream
   * @param organizationId - Organization ID (optional if teacherId provided)
   * @returns Promise that resolves when stream completes
   */
  chatStream: async (
    teacherId: string | null,
    message: string,
    onChunk: (chunk: string) => void,
    organizationId?: string
  ): Promise<void> => {
    const url = `${API_BASE_URL}/api/ai/chat/stream`;
    const token = getBrowserToken();

    const body: any = { message };
    if (teacherId) {
      body.teacherId = teacherId;
    }
    if (organizationId) {
      body.organizationId = organizationId;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
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
  list: async (teacherId: string | null, completed?: boolean, organizationId?: string) => {
    const params = new URLSearchParams();
    if (teacherId) {
      params.append("teacherId", teacherId);
    }
    if (organizationId) {
      params.append("organizationId", organizationId);
    }
    if (completed !== undefined) {
      params.append("completed", String(completed));
    }
    return fetchApi<{
      items: Array<{
        id: string;
        teacherId?: string;
        organizationId?: string;
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
    }>(`/api/actionable-items${params.toString() ? `?${params.toString()}` : ""}`);
  },

  create: async (data: {
    teacherId?: string;
    organizationId?: string;
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

  getBySource: async (teacherId: string | null, sourceType: "comment" | "ai_suggestion", sourceId: string, organizationId?: string) => {
    const params = new URLSearchParams({
      sourceType,
      sourceId,
    });
    if (teacherId) {
      params.append("teacherId", teacherId);
    }
    if (organizationId) {
      params.append("organizationId", organizationId);
    }
    return fetchApi<{
      item: {
        id: string;
        teacherId?: string;
        organizationId?: string;
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

// Organizations API
export const organizationsApi = {
  // Teacher Management
  getTeachers: async () => {
    return fetchApi<{
      teachers: Array<{
        id: string;
        name: string;
        email: string;
        phone: string;
        address?: string;
        subject?: string;
        department?: string;
        status: "active" | "blocked";
        qrCode: string;
        createdAt: string;
        updatedAt: string;
        stats: {
          totalFeedback: number;
          feedbackCount: number;
          reviewCount: number;
          averageRating: number;
        };
      }>;
    }>("/api/organizations/teachers");
  },

  createTeacher: async (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    address?: string;
    subject?: string;
    department?: string;
  }) => {
    return fetchApi<{
      success: boolean;
      teacher: {
        id: string;
        name: string;
        email: string;
        phone: string;
        organizationId: string;
      };
    }>("/api/organizations/teachers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateTeacher: async (teacherId: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    subject?: string;
    department?: string;
    status?: "active" | "blocked";
  }) => {
    return fetchApi<{
      success: boolean;
      teacher: {
        id: string;
        name: string;
        email: string;
        phone: string;
        organizationId: string;
        status: "active" | "blocked";
      };
    }>(`/api/organizations/teachers/${teacherId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteTeacher: async (teacherId: string) => {
    return fetchApi<{
      success: boolean;
      message: string;
    }>(`/api/organizations/teachers/${teacherId}`, {
      method: "DELETE",
    });
  },

  // Feedback & Stats
  getFeedback: async (params?: {
    teacherId?: string;
    tagId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.teacherId) queryParams.append("teacherId", params.teacherId);
    if (params?.tagId) queryParams.append("tagId", params.tagId);
    const query = queryParams.toString();
    return fetchApi<{
      feedback: Array<any>;
      stats: {
        totalFeedback: number;
        averageRatings: {
          teaching: number;
          communication: number;
          material: number;
          overall: number;
        };
        teacherCount: number;
      };
    }>(`/api/organizations/feedback${query ? `?${query}` : ""}`);
  },

  getStats: async () => {
    return fetchApi<{
      stats: {
        totalTeachers: number;
        totalFeedback: number;
        totalReviews: number;
        averageRatings: {
          teaching: number;
          communication: number;
          material: number;
          overall: number;
        };
      };
    }>("/api/organizations/stats");
  },
};

