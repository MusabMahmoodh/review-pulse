import { type NextRequest, NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-data"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 })
    }

    const insight = mockDb.aiInsights.getLatestForRestaurant(restaurantId)

    return NextResponse.json({ insight: insight || null })
  } catch (error) {
    console.error("[v0] Error fetching insights:", error)
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 })
  }
}
