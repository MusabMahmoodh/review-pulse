import { type NextRequest, NextResponse } from "next/server"
import { mockDb } from "@/lib/mock-data"

export async function POST(request: NextRequest) {
  try {
    const { restaurantId, status } = await request.json()

    if (!restaurantId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (status !== "active" && status !== "blocked") {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }

    mockDb.restaurants.updateStatus(restaurantId, status)

    return NextResponse.json({
      success: true,
      message: `Restaurant ${status === "active" ? "activated" : "blocked"} successfully`,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 })
  }
}
