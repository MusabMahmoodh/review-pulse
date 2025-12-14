import { type NextRequest, NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-data"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 })
    }

    const externalReviews = mockDb.externalReviews.getByRestaurant(restaurantId)

    // Sort by date, most recent first
    externalReviews.sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime())

    return NextResponse.json({ reviews: externalReviews })
  } catch (error) {
    console.error("[v0] Error fetching external reviews:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}
