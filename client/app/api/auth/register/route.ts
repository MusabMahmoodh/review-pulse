import { type NextRequest, NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-data"
import { generateRestaurantId, generateQRCodeUrl } from "@/lib/qr-generator"
import type { Restaurant } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantName, email, password, phone, address, socialKeywords } = body

    // Check if restaurant already exists
    const existingRestaurant = mockDb.restaurants.getByEmail(email)
    if (existingRestaurant) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    // Create restaurant ID
    const restaurantId = generateRestaurantId()

    // Create restaurant
    const restaurant: Restaurant = {
      id: restaurantId,
      name: restaurantName,
      email,
      phone,
      address,
      qrCode: restaurantId,
      socialKeywords: socialKeywords || [], // Store social keywords for Facebook/Instagram search
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockDb.restaurants.create(restaurant)

    // Store auth info (in production, hash the password!)
    mockDb.auth.register(email, password, restaurantId)

    return NextResponse.json(
      {
        success: true,
        restaurantId,
        qrCodeUrl: generateQRCodeUrl(restaurantId),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Registration error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
