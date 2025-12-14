import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { mockDb } from "@/lib/mock-data"
import type { AIInsight } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurantId } = body

    // Get all feedback for the restaurant
    const feedback = mockDb.feedback.getByRestaurant(restaurantId)
    const externalReviews = mockDb.externalReviews.getByRestaurant(restaurantId)

    if (feedback.length === 0 && externalReviews.length === 0) {
      return NextResponse.json({ error: "No feedback available to analyze" }, { status: 400 })
    }

    // Prepare feedback data for AI analysis
    const feedbackSummary = feedback.map((f) => ({
      food: f.foodRating,
      staff: f.staffRating,
      ambience: f.ambienceRating,
      overall: f.overallRating,
      comments: f.suggestions || "No comments",
    }))

    const externalSummary = externalReviews.map((r) => ({
      platform: r.platform,
      rating: r.rating,
      comment: r.comment,
    }))

    // Generate AI insights
    const prompt = `You are an AI assistant analyzing customer feedback for a restaurant. Analyze the following feedback data and provide insights.

Internal Feedback (${feedback.length} reviews):
${JSON.stringify(feedbackSummary, null, 2)}

External Reviews (${externalReviews.length} reviews):
${JSON.stringify(externalSummary, null, 2)}

Provide a response in the following JSON format:
{
  "summary": "A concise 2-3 sentence summary of overall customer sentiment",
  "recommendations": ["3-5 specific, actionable recommendations to improve the restaurant"],
  "sentiment": "positive" or "neutral" or "negative",
  "keyTopics": ["3-5 key topics or themes that customers mention most"]
}

Be specific, practical, and focus on actionable insights. Return ONLY the JSON object, no additional text.`

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
    })

    // Parse AI response
    const aiResponse = JSON.parse(text)

    // Create insight record
    const insight: AIInsight = {
      id: `insight_${Date.now()}`,
      restaurantId,
      summary: aiResponse.summary,
      recommendations: aiResponse.recommendations,
      sentiment: aiResponse.sentiment,
      keyTopics: aiResponse.keyTopics,
      generatedAt: new Date(),
    }

    mockDb.aiInsights.create(insight)

    return NextResponse.json({ insight })
  } catch (error) {
    console.error("[v0] Error generating insights:", error)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}
