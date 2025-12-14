import { type NextRequest, NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-data"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 })
    }

    const feedback = mockDb.feedback.getByRestaurant(restaurantId)

    // Sort by date, most recent first
    feedback.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error("[v0] Error fetching feedback:", error)
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 })
  }
}
