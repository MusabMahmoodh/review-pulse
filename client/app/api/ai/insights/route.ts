import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restaurantId = searchParams.get("restaurantId")
    const timePeriod = searchParams.get("timePeriod")

    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 })
    }

    // Build query params for backend
    const params = new URLSearchParams({ restaurantId })
    if (timePeriod) {
      params.append("timePeriod", timePeriod)
    }

    // Call backend API
    const response = await fetch(`${API_BASE_URL}/api/ai/insights?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch insights" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching insights:", error)
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 })
  }
}
