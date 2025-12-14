import { NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-data"

export async function GET() {
  try {
    const restaurants = mockDb.restaurants.getAllWithDetails()

    return NextResponse.json({
      restaurants,
      total: restaurants.length,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch restaurants" }, { status: 500 })
  }
}
