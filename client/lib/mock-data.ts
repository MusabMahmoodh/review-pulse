// Mock data store (would be replaced with Supabase in production)
import type {
  Restaurant,
  CustomerFeedback,
  ExternalReview,
  AIInsight,
  Admin,
  Subscription,
  RestaurantWithDetails,
} from "./types"

// In-memory storage
const restaurants: Restaurant[] = []
const feedback: CustomerFeedback[] = []
const externalReviews: ExternalReview[] = []
const aiInsights: AIInsight[] = []
const admins: Admin[] = []
const subscriptions: Subscription[] = []
const restaurantStatuses = new Map<string, "active" | "blocked">()

// Mock authentication store
const authStore = new Map<string, { email: string; passwordHash: string; restaurantId: string }>()

const adminAuthStore = new Map<string, { email: string; passwordHash: string; adminId: string }>()

export const mockDb = {
  restaurants: {
    getAll: () => restaurants,
    getById: (id: string) => restaurants.find((r) => r.id === id),
    getByEmail: (email: string) => restaurants.find((r) => r.email === email),
    getAllWithDetails: (): RestaurantWithDetails[] => {
      return restaurants.map((restaurant) => {
        const restaurantFeedback = feedback.filter((f) => f.restaurantId === restaurant.id)
        const avgRating =
          restaurantFeedback.length > 0
            ? restaurantFeedback.reduce((sum, f) => sum + f.overallRating, 0) / restaurantFeedback.length
            : 0
        const subscription = subscriptions.find((s) => s.restaurantId === restaurant.id)
        const status = restaurantStatuses.get(restaurant.id) || "active"
        const lastFeedback = restaurantFeedback.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]

        return {
          ...restaurant,
          subscription,
          feedbackCount: restaurantFeedback.length,
          averageRating: avgRating,
          status,
          lastActivity: lastFeedback?.createdAt,
        }
      })
    },
    create: (restaurant: Restaurant) => {
      restaurants.push(restaurant)
      restaurantStatuses.set(restaurant.id, "active")
      return restaurant
    },
    update: (id: string, data: Partial<Restaurant>) => {
      const index = restaurants.findIndex((r) => r.id === id)
      if (index !== -1) {
        restaurants[index] = { ...restaurants[index], ...data, updatedAt: new Date() }
        return restaurants[index]
      }
      return null
    },
    updateStatus: (id: string, status: "active" | "blocked") => {
      restaurantStatuses.set(id, status)
      return true
    },
    getStatus: (id: string) => restaurantStatuses.get(id) || "active",
  },
  feedback: {
    getAll: () => feedback,
    getByRestaurant: (restaurantId: string) => feedback.filter((f) => f.restaurantId === restaurantId),
    create: (feedbackData: CustomerFeedback) => {
      feedback.push(feedbackData)
      return feedbackData
    },
  },
  externalReviews: {
    getByRestaurant: (restaurantId: string) => externalReviews.filter((r) => r.restaurantId === restaurantId),
    create: (review: ExternalReview) => {
      externalReviews.push(review)
      return review
    },
    syncForRestaurant: (restaurantId: string, platform: string) => {
      // Mock sync - would call actual APIs in production
      return []
    },
  },
  aiInsights: {
    getLatestForRestaurant: (restaurantId: string) =>
      aiInsights
        .filter((i) => i.restaurantId === restaurantId)
        .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())[0],
    create: (insight: AIInsight) => {
      aiInsights.push(insight)
      return insight
    },
  },
  auth: {
    register: (email: string, passwordHash: string, restaurantId: string) => {
      authStore.set(email, { email, passwordHash, restaurantId })
    },
    login: (email: string, passwordHash: string) => {
      const user = authStore.get(email)
      if (user && user.passwordHash === passwordHash) {
        return user.restaurantId
      }
      return null
    },
    getByEmail: (email: string) => authStore.get(email),
  },
  admins: {
    getAll: () => admins,
    getById: (id: string) => admins.find((a) => a.id === id),
    getByEmail: (email: string) => admins.find((a) => a.email === email),
    create: (admin: Admin) => {
      admins.push(admin)
      return admin
    },
  },
  subscriptions: {
    getAll: () => subscriptions,
    getByRestaurant: (restaurantId: string) => subscriptions.find((s) => s.restaurantId === restaurantId),
    create: (subscription: Subscription) => {
      subscriptions.push(subscription)
      return subscription
    },
    update: (id: string, data: Partial<Subscription>) => {
      const index = subscriptions.findIndex((s) => s.id === id)
      if (index !== -1) {
        subscriptions[index] = { ...subscriptions[index], ...data }
        return subscriptions[index]
      }
      return null
    },
  },
  adminAuth: {
    register: (email: string, passwordHash: string, adminId: string) => {
      adminAuthStore.set(email, { email, passwordHash, adminId })
    },
    login: (email: string, passwordHash: string) => {
      const admin = adminAuthStore.get(email)
      if (admin && admin.passwordHash === passwordHash) {
        return admin.adminId
      }
      return null
    },
    getByEmail: (email: string) => adminAuthStore.get(email),
  },
}

// Seed some demo data
const demoRestaurant: Restaurant = {
  id: "demo-restaurant-1",
  name: "The Culinary Corner",
  email: "demo@restaurant.com",
  phone: "+1234567890",
  address: "123 Food Street, Flavor Town",
  qrCode: "demo-restaurant-1",
  socialKeywords: [
    "culinary corner",
    "flavor town restaurant",
    "food street dining",
    "best italian food",
    "authentic pasta",
  ], // Added social keywords for demo restaurant
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date(),
}

mockDb.restaurants.create(demoRestaurant)
mockDb.auth.register("demo@restaurant.com", "hashed_password", demoRestaurant.id)

// Seed demo feedback
const demoFeedback: CustomerFeedback[] = [
  {
    id: "1",
    restaurantId: demoRestaurant.id,
    customerName: "John Smith",
    customerContact: "+1234567891",
    foodRating: 5,
    staffRating: 5,
    ambienceRating: 4,
    overallRating: 5,
    suggestions: "Great food! Would love more vegetarian options.",
    createdAt: new Date("2024-12-10"),
  },
  {
    id: "2",
    restaurantId: demoRestaurant.id,
    customerName: "Sarah Johnson",
    foodRating: 4,
    staffRating: 5,
    ambienceRating: 5,
    overallRating: 4,
    suggestions: "Amazing service and cozy atmosphere!",
    createdAt: new Date("2024-12-12"),
  },
  {
    id: "3",
    restaurantId: demoRestaurant.id,
    foodRating: 5,
    staffRating: 4,
    ambienceRating: 5,
    overallRating: 5,
    createdAt: new Date("2024-12-13"),
  },
  {
    id: "4",
    restaurantId: demoRestaurant.id,
    customerName: "Mike Chen",
    foodRating: 4,
    staffRating: 4,
    ambienceRating: 4,
    overallRating: 4,
    suggestions: "Good experience overall. The dessert menu could use more variety.",
    createdAt: new Date("2024-12-14"),
  },
]

demoFeedback.forEach((f) => mockDb.feedback.create(f))

const demoExternalReviews: ExternalReview[] = [
  {
    id: "ext-1",
    restaurantId: demoRestaurant.id,
    platform: "google",
    author: "Emily Rodriguez",
    rating: 5,
    comment: "Best Italian food in town! The pasta is authentic and the staff is wonderful.",
    reviewDate: new Date("2024-12-08"),
    syncedAt: new Date(),
  },
  {
    id: "ext-2",
    restaurantId: demoRestaurant.id,
    platform: "facebook",
    author: "David Lee",
    rating: 4,
    comment: "Great atmosphere and friendly service. Would recommend!",
    reviewDate: new Date("2024-12-11"),
    syncedAt: new Date(),
  },
]

demoExternalReviews.forEach((r) => mockDb.externalReviews.create(r))

const demoAIInsight: AIInsight = {
  id: "ai-insight-1",
  restaurantId: demoRestaurant.id,
  summary:
    "Your restaurant is performing exceptionally well with an average rating of 4.5 stars across all platforms. Customers consistently praise your food quality and service, with particular emphasis on authentic flavors and friendly staff.",
  sentiment: "positive",
  keyTopics: [
    "Excellent food quality and authentic taste",
    "Outstanding customer service",
    "Cozy and inviting atmosphere",
    "Request for more vegetarian options",
    "Dessert menu expansion needed",
  ],
  recommendations: [
    {
      priority: "high",
      category: "menu",
      title: "Expand Vegetarian Options",
      description:
        "Multiple customers have requested more vegetarian dishes. Consider adding 2-3 plant-based entrees to capture this growing market segment.",
      impact: "Could increase customer satisfaction by 15% and attract new customer segments",
    },
    {
      priority: "medium",
      category: "menu",
      title: "Diversify Dessert Menu",
      description:
        "Current dessert offerings are limited. Adding seasonal desserts and classic favorites could improve overall dining experience.",
      impact: "Expected to increase dessert sales by 20% and improve overall ratings",
    },
    {
      priority: "low",
      category: "ambience",
      title: "Maintain Current Ambience Standards",
      description:
        "Customers love your cozy atmosphere. Continue maintaining lighting, music, and decor at current levels.",
      impact: "Sustains positive customer experience and repeat visits",
    },
  ],
  generatedAt: new Date(),
}

mockDb.aiInsights.create(demoAIInsight)

const superAdmin: Admin = {
  id: "admin-1",
  email: "admin@feedbackhub.com",
  passwordHash: "admin_password",
  role: "super_admin",
  createdAt: new Date("2024-01-01"),
}

mockDb.admins.create(superAdmin)
mockDb.adminAuth.register(superAdmin.email, superAdmin.passwordHash, superAdmin.id)

const demoSubscription: Subscription = {
  id: "sub-1",
  restaurantId: demoRestaurant.id,
  plan: "premium",
  status: "active",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2025-01-01"),
  monthlyPrice: 99,
}

mockDb.subscriptions.create(demoSubscription)

const demoRestaurants: Restaurant[] = [
  {
    id: "demo-restaurant-2",
    name: "Pizzeria Bella",
    email: "pizzeria@example.com",
    phone: "+1234567892",
    address: "456 Pizza Lane, Food City",
    qrCode: "demo-restaurant-2",
    socialKeywords: ["pizzeria bella", "food city pizza", "best pizza", "italian restaurant", "bella pizza"], // Added social keywords
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date(),
  },
  {
    id: "demo-restaurant-3",
    name: "Sushi Paradise",
    email: "sushi@example.com",
    phone: "+1234567893",
    address: "789 Sushi Street, Ocean Town",
    qrCode: "demo-restaurant-3",
    socialKeywords: ["sushi paradise", "ocean town sushi", "fresh sushi", "japanese restaurant", "best sashimi"], // Added social keywords
    createdAt: new Date("2024-03-20"),
    updatedAt: new Date(),
  },
]

demoRestaurants.forEach((r) => {
  mockDb.restaurants.create(r)
  mockDb.subscriptions.create({
    id: `sub-${r.id}`,
    restaurantId: r.id,
    plan: r.id === "demo-restaurant-2" ? "basic" : "free",
    status: "active",
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    monthlyPrice: r.id === "demo-restaurant-2" ? 49 : 0,
  })
})

export const mockDatabase = mockDb
