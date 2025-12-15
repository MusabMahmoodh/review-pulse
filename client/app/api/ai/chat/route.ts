import { type NextRequest, NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function POST(request: NextRequest) {
  try {
    const { restaurantId, message } = await request.json()

    if (!restaurantId || !message) {
      return NextResponse.json({ error: "Restaurant ID and message required" }, { status: 400 })
    }

    // Call backend API
    const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ restaurantId, message }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.error || "Failed to process chat message" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error processing chat message:", error)
    return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 })
  }
}
