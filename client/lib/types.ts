// Database Types for Teacher/Institute Feedback Platform

export interface Organization {
  id: string
  name: string
  email: string
  phone: string
  address: string
  website?: string
  createdAt: Date
  updatedAt: Date
}

export interface Teacher {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  subject?: string
  department?: string
  qrCode: string
  organizationId?: string
  createdAt: Date
  updatedAt: Date
}

export interface StudentFeedback {
  id: string
  teacherId: string
  studentName?: string
  studentContact?: string
  studentId?: string
  teachingRating: number // 1-5
  communicationRating: number // 1-5
  materialRating: number // 1-5
  overallRating: number // 1-5
  suggestions?: string
  courseName?: string
  createdAt: Date
}

export interface ExternalReview {
  id: string
  teacherId: string
  platform: "google" | "facebook" | "instagram"
  author: string
  rating: number
  comment: string
  reviewDate: Date
  syncedAt: Date
}

export interface AIInsight {
  id: string
  teacherId: string
  summary: string
  recommendations: string[]
  sentiment: "positive" | "neutral" | "negative"
  keyTopics: string[]
  generatedAt: Date
}

export interface FeedbackStats {
  totalFeedback: number
  averageRatings: {
    teaching: number
    communication: number
    material: number
    overall: number
  }
  recentTrend: "improving" | "stable" | "declining"
  externalReviewsCount: {
    google: number
    facebook: number
    instagram: number
  }
}

export interface Admin {
  id: string
  email: string
  passwordHash: string
  role: "super_admin" | "admin"
  createdAt: Date
}

export interface Subscription {
  id: string
  organizationId?: string
  teacherId?: string
  plan: "free" | "basic" | "premium" | "enterprise"
  status: "active" | "cancelled" | "expired" | "trial"
  startDate: Date
  endDate: Date | null
  monthlyPrice: number
  defaultPrice?: number
  discount?: number
  finalPrice?: number
  amountPaid?: number
}

export interface TeacherWithDetails extends Teacher {
  subscription?: Subscription
  feedbackCount: number
  averageRating: number
  status: "active" | "blocked"
  lastActivity?: Date
}

// Legacy alias for backward compatibility (can be removed later)
export type RestaurantWithDetails = TeacherWithDetails

export interface ActionableItem {
  id: string
  teacherId: string
  title: string
  description?: string
  completed: boolean
  sourceType: "comment" | "ai_suggestion"
  sourceId: string
  sourceText?: string
  assignedTo?: string
  deadline?: Date
  createdAt: Date
  updatedAt: Date
}

export interface TeamMember {
  id: string
  organizationId?: string
  teacherId: string
  name: string
  email?: string
  phone?: string
  role?: string
  createdAt: Date
  updatedAt: Date
}
