import { type NextRequest, NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-data"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Authenticate user
    const restaurantId = mockDb.auth.login(email, password)

    if (!restaurantId) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const restaurant = mockDb.restaurants.getById(restaurantId)

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
    }

    // In production, set secure HTTP-only cookies here
    return NextResponse.json({
      success: true,
      restaurantId,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        email: restaurant.email,
      },
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
