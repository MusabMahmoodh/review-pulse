import { type NextRequest, NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-data"
import type { ExternalReview } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId, platforms } = body

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 })
    }

    // Validate restaurant exists
    const restaurant = mockDb.restaurants.getById(restaurantId)
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    const syncedReviews: ExternalReview[] = []

    // Mock sync - in production, this would call real APIs
    // Google Places API, Facebook Graph API, Instagram Graph API
    const platformsToSync = platforms || ["google", "facebook", "instagram"]

    for (const platform of platformsToSync) {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Generate mock reviews for demonstration
      const mockReviews = generateMockReviews(restaurantId, platform as "google" | "facebook" | "instagram")

      for (const review of mockReviews) {
        mockDb.externalReviews.create(review)
        syncedReviews.push(review)
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount: syncedReviews.length,
      reviews: syncedReviews,
      syncedAt: new Date(),
    })
  } catch (error) {
    console.error("[v0] External review sync error:", error)
    return NextResponse.json({ error: "Failed to sync reviews" }, { status: 500 })
  }
}

function generateMockReviews(restaurantId: string, platform: "google" | "facebook" | "instagram"): ExternalReview[] {
  const reviews: ExternalReview[] = []

  // Check if we already have reviews for this platform
  const existing = mockDb.externalReviews.getByRestaurant(restaurantId).filter((r) => r.platform === platform)

  // Only generate if no existing reviews
  if (existing.length > 0) {
    return []
  }

  const mockData = {
    google: [
      {
        author: "Emma Wilson",
        rating: 5,
        comment: "Outstanding service and delicious food! The ambiance is perfect for a romantic dinner.",
      },
      {
        author: "James Taylor",
        rating: 4,
        comment: "Great experience overall. The menu has excellent variety and quality.",
      },
    ],
    facebook: [
      {
        author: "Lisa Anderson",
        rating: 5,
        comment: "Absolutely love this place! The staff is so friendly and the food is amazing.",
      },
    ],
    instagram: [
      {
        author: "@foodie_adventures",
        rating: 5,
        comment:
          "Best dining experience! Everything from presentation to taste was perfect. #foodporn #restaurantreview",
      },
    ],
  }

  const platformData = mockData[platform] || []

  platformData.forEach((data, index) => {
    reviews.push({
      id: `${platform}_${restaurantId}_${Date.now()}_${index}`,
      restaurantId,
      platform,
      author: data.author,
      rating: data.rating,
      comment: data.comment,
      reviewDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
      syncedAt: new Date(),
    })
  })

  return reviews
}
