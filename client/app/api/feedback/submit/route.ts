import { type NextRequest, NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-data"
import type { CustomerFeedback } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      restaurantId,
      customerName,
      customerContact,
      foodRating,
      staffRating,
      ambienceRating,
      overallRating,
      suggestions,
    } = body

    // Validate restaurant exists
    const restaurant = mockDb.restaurants.getById(restaurantId)
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    // Validate ratings
    if (
      foodRating < 1 ||
      foodRating > 5 ||
      staffRating < 1 ||
      staffRating > 5 ||
      ambienceRating < 1 ||
      ambienceRating > 5 ||
      overallRating < 1 ||
      overallRating > 5
    ) {
      return NextResponse.json({ error: "Invalid ratings" }, { status: 400 })
    }

    // Create feedback entry
    const feedback: CustomerFeedback = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      restaurantId,
      customerName: customerName || undefined,
      customerContact: customerContact || undefined,
      foodRating,
      staffRating,
      ambienceRating,
      overallRating,
      suggestions: suggestions || undefined,
      createdAt: new Date(),
    }

    mockDb.feedback.create(feedback)

    return NextResponse.json(
      {
        success: true,
        message: "Feedback submitted successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Feedback submission error:", error)
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 })
  }
}
