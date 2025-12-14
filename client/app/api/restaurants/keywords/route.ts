import { type NextRequest, NextResponse } from "next/server"
import { mockDatabase } from "@/lib/mock-data"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const restaurantId = searchParams.get("restaurantId")

  if (!restaurantId) {
    return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 })
  }

  const restaurant = mockDatabase.restaurants.find((r) => r.id === restaurantId)

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
  }

  return NextResponse.json({
    keywords: restaurant.socialKeywords,
  })
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { restaurantId, keywords } = body

  if (!restaurantId || !keywords || !Array.isArray(keywords)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  if (keywords.length < 3 || keywords.length > 5) {
    return NextResponse.json({ error: "Keywords must be between 3 and 5" }, { status: 400 })
  }

  const restaurant = mockDatabase.restaurants.find((r) => r.id === restaurantId)

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
  }

  // Update keywords
  restaurant.socialKeywords = keywords

  return NextResponse.json({
    success: true,
    message: "Keywords updated successfully",
    keywords: restaurant.socialKeywords,
  })
}
