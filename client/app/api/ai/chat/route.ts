import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { restaurantId, message, conversationHistory } = await request.json()

    if (!restaurantId || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Mock responses based on common questions
    const mockResponses: Record<string, string> = {
      vegetarian:
        "Based on your feedback data, I notice that customers have specifically requested more vegetarian options. I recommend adding 2-3 plant-based entrees like a Mediterranean veggie platter, grilled portobello mushroom steak, or a seasonal vegetable risotto. This could increase your customer base by approximately 15% and improve satisfaction scores.",
      dessert:
        "Your dessert menu has been mentioned as needing more variety. Consider adding seasonal desserts and popular classics. Try rotating desserts monthly - tiramisu and panna cotta are always crowd favorites for Italian restaurants. Adding a chef's special dessert can also create buzz and increase average ticket size by 10-15%.",
      service:
        "Your service ratings are excellent at 4.5/5 average! Customers consistently praise your friendly and attentive staff. To maintain this, ensure continued staff training, recognize top performers, and keep communication open with your team about customer feedback.",
      improve:
        "Your strongest areas are food quality (4.5/5) and service (4.5/5). Focus on expanding your vegetarian options and dessert menu as these were the most common improvement requests. Small menu additions in these areas could boost your overall rating from 4.5 to 4.7+ stars.",
      ratings:
        "You're performing excellently across platforms! Google: 4.8/5, Facebook: 4.5/5, and direct feedback: 4.5/5. Your consistency shows strong operational excellence. The main opportunity is menu expansion in vegetarian and dessert categories.",
    }

    // Find matching response based on keywords
    const lowerMessage = message.toLowerCase()
    let response =
      "Based on your customer feedback, you're doing great overall with a 4.5-star average! Your food quality and service are your strongest points. The main areas for improvement are expanding vegetarian options and adding more dessert variety. Would you like specific recommendations for either of these areas?"

    for (const [keyword, mockResponse] of Object.entries(mockResponses)) {
      if (lowerMessage.includes(keyword)) {
        response = mockResponse
        break
      }
    }

    // Add slight delay to simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({ response })
  } catch (error) {
    console.error("Error generating chat response:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
