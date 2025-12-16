// Database Types for Restaurant Feedback Platform

export interface Restaurant {
  id: string
  name: string
  email: string
  phone: string
  address: string
  qrCode: string
  socialKeywords: string[] // 5 keywords to search on Facebook/Instagram
  createdAt: Date
  updatedAt: Date
}

export interface RestaurantAuth {
  restaurantId: string
  passwordHash: string
  email: string
}

export interface CustomerFeedback {
  id: string
  restaurantId: string
  customerName?: string
  customerContact?: string
  foodRating: number // 1-5
  staffRating: number // 1-5
  ambienceRating: number // 1-5
  overallRating: number // 1-5
  suggestions?: string
  createdAt: Date
}

export interface ExternalReview {
  id: string
  restaurantId: string
  platform: "google" | "facebook" | "instagram"
  author: string
  rating: number
  comment: string
  reviewDate: Date
  syncedAt: Date
}

export interface AIInsight {
  id: string
  restaurantId: string
  summary: string
  recommendations: string[]
  sentiment: "positive" | "neutral" | "negative"
  keyTopics: string[]
  generatedAt: Date
}

export interface FeedbackStats {
  totalFeedback: number
  averageRatings: {
    food: number
    staff: number
    ambience: number
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
  restaurantId: string
  plan: "free" | "basic" | "premium" | "enterprise"
  status: "active" | "cancelled" | "expired" | "trial"
  startDate: Date
  endDate: Date | null // null means forever
  monthlyPrice: number
  defaultPrice?: number
  discount?: number
  finalPrice?: number
  amountPaid?: number
}

export interface RestaurantWithDetails extends Restaurant {
  subscription?: Subscription
  feedbackCount: number
  averageRating: number
  status: "active" | "blocked"
  lastActivity?: Date
}
