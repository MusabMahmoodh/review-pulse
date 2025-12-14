import { type NextRequest, NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-data"
import type { FeedbackStats } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 })
    }

    const feedback = mockDb.feedback.getByRestaurant(restaurantId)
    const externalReviews = mockDb.externalReviews.getByRestaurant(restaurantId)

    // Calculate averages
    const totalFeedback = feedback.length
    const avgFood = totalFeedback > 0 ? feedback.reduce((sum, f) => sum + f.foodRating, 0) / totalFeedback : 0
    const avgStaff = totalFeedback > 0 ? feedback.reduce((sum, f) => sum + f.staffRating, 0) / totalFeedback : 0
    const avgAmbience = totalFeedback > 0 ? feedback.reduce((sum, f) => sum + f.ambienceRating, 0) / totalFeedback : 0
    const avgOverall = totalFeedback > 0 ? feedback.reduce((sum, f) => sum + f.overallRating, 0) / totalFeedback : 0

    // Calculate trend (simple logic - compare last 3 vs previous 3)
    let recentTrend: "improving" | "stable" | "declining" = "stable"
    if (feedback.length >= 6) {
      const recent = feedback.slice(0, 3)
      const previous = feedback.slice(3, 6)
      const recentAvg = recent.reduce((sum, f) => sum + f.overallRating, 0) / 3
      const previousAvg = previous.reduce((sum, f) => sum + f.overallRating, 0) / 3
      if (recentAvg > previousAvg + 0.3) recentTrend = "improving"
      else if (recentAvg < previousAvg - 0.3) recentTrend = "declining"
    }

    const stats: FeedbackStats = {
      totalFeedback,
      averageRatings: {
        food: avgFood,
        staff: avgStaff,
        ambience: avgAmbience,
        overall: avgOverall,
      },
      recentTrend,
      externalReviewsCount: {
        google: externalReviews.filter((r) => r.platform === "google").length,
        facebook: externalReviews.filter((r) => r.platform === "facebook").length,
        instagram: externalReviews.filter((r) => r.platform === "instagram").length,
      },
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("[v0] Error calculating stats:", error)
    return NextResponse.json({ error: "Failed to calculate stats" }, { status: 500 })
  }
}
