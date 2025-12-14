import OpenAI from "openai";
import { CustomerFeedback } from "../models/CustomerFeedback";
import { ExternalReview } from "../models/ExternalReview";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface InsightData {
  summary: string;
  recommendations: string[];
  sentiment: "positive" | "neutral" | "negative";
  keyTopics: string[];
}

/**
 * Generate AI insights from feedback and reviews
 */
export async function generateInsights(
  feedback: CustomerFeedback[],
  reviews: ExternalReview[],
  restaurantName?: string
): Promise<InsightData> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  // Prepare data for analysis
  const feedbackData = feedback.map((f) => ({
    foodRating: f.foodRating,
    staffRating: f.staffRating,
    ambienceRating: f.ambienceRating,
    overallRating: f.overallRating,
    suggestions: f.suggestions || "",
    date: f.createdAt.toISOString(),
  }));

  const reviewData = reviews.map((r) => ({
    platform: r.platform,
    rating: r.rating,
    comment: r.comment,
    date: r.reviewDate.toISOString(),
  }));

  // Calculate average ratings
  const avgFoodRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.foodRating, 0) / feedbackData.length
      : 0;
  const avgStaffRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.staffRating, 0) / feedbackData.length
      : 0;
  const avgAmbienceRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.ambienceRating, 0) / feedbackData.length
      : 0;
  const avgOverallRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.overallRating, 0) / feedbackData.length
      : 0;

  const avgExternalRating =
    reviewData.length > 0
      ? reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length
      : 0;

  // Build prompt
  const prompt = `You are an AI assistant analyzing customer feedback and reviews for a restaurant${restaurantName ? ` named "${restaurantName}"` : ""}.

Analyze the following data and provide insights:

**Internal Feedback (${feedbackData.length} entries):**
Average Ratings:
- Food: ${avgFoodRating.toFixed(2)}/5
- Staff: ${avgStaffRating.toFixed(2)}/5
- Ambience: ${avgAmbienceRating.toFixed(2)}/5
- Overall: ${avgOverallRating.toFixed(2)}/5

Feedback Comments:
${feedbackData
  .filter((f) => f.suggestions)
  .map((f, i) => `${i + 1}. "${f.suggestions}" (Overall: ${f.overallRating}/5)`)
  .join("\n") || "No comments provided"}

**External Reviews (${reviewData.length} entries):**
Average Rating: ${avgExternalRating.toFixed(2)}/5

Reviews:
${reviewData
  .map((r, i) => `${i + 1}. [${r.platform}] ${r.rating}/5: "${r.comment}"`)
  .join("\n") || "No external reviews"}

Please provide a comprehensive analysis in the following JSON format:
{
  "summary": "A 2-3 sentence summary of the overall customer sentiment and key findings",
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2", "Actionable recommendation 3"],
  "sentiment": "positive" | "neutral" | "negative",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]
}

Requirements:
- Summary should be concise but informative
- Recommendations should be specific and actionable
- Sentiment should reflect overall customer satisfaction
- Key topics should be the most frequently mentioned themes (food quality, service, ambiance, pricing, etc.)
- Return ONLY valid JSON, no additional text`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert restaurant consultant analyzing customer feedback. Provide insights in JSON format only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(responseContent) as InsightData;

    // Validate and ensure proper types
    return {
      summary: parsed.summary || "No summary available",
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : ["No recommendations available"],
      sentiment:
        parsed.sentiment === "positive" ||
        parsed.sentiment === "neutral" ||
        parsed.sentiment === "negative"
          ? parsed.sentiment
          : "neutral",
      keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to generate insights: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Chat with AI about restaurant feedback
 */
export async function chatAboutFeedback(
  message: string,
  feedback: CustomerFeedback[],
  reviews: ExternalReview[],
  restaurantName?: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  // Prepare summary data for context
  const feedbackData = feedback.map((f) => ({
    foodRating: f.foodRating,
    staffRating: f.staffRating,
    ambienceRating: f.ambienceRating,
    overallRating: f.overallRating,
    suggestions: f.suggestions || "",
    date: f.createdAt.toISOString(),
  }));

  const reviewData = reviews.map((r) => ({
    platform: r.platform,
    rating: r.rating,
    comment: r.comment,
    date: r.reviewDate.toISOString(),
  }));

  // Calculate average ratings
  const avgFoodRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.foodRating, 0) / feedbackData.length
      : 0;
  const avgStaffRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.staffRating, 0) / feedbackData.length
      : 0;
  const avgAmbienceRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.ambienceRating, 0) / feedbackData.length
      : 0;
  const avgOverallRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.overallRating, 0) / feedbackData.length
      : 0;

  const avgExternalRating =
    reviewData.length > 0
      ? reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length
      : 0;

  // Build context for the AI
  const context = `You are an AI assistant helping a restaurant owner${restaurantName ? ` of "${restaurantName}"` : ""} understand their customer feedback.

**Current Feedback Summary:**
- Total Internal Feedback: ${feedbackData.length} entries
- Average Ratings: Food ${avgFoodRating.toFixed(2)}/5, Staff ${avgStaffRating.toFixed(2)}/5, Ambience ${avgAmbienceRating.toFixed(2)}/5, Overall ${avgOverallRating.toFixed(2)}/5
- Total External Reviews: ${reviewData.length} entries
- Average External Rating: ${avgExternalRating.toFixed(2)}/5

**Recent Feedback Comments:**
${feedbackData
  .filter((f) => f.suggestions)
  .slice(0, 10)
  .map((f, i) => `${i + 1}. "${f.suggestions}" (Overall: ${f.overallRating}/5)`)
  .join("\n") || "No comments provided"}

**Recent External Reviews:**
${reviewData
  .slice(0, 10)
  .map((r, i) => `${i + 1}. [${r.platform}] ${r.rating}/5: "${r.comment}"`)
  .join("\n") || "No external reviews"}

Answer the user's question based on this feedback data. Be helpful, specific, and actionable.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: context,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("No response from OpenAI");
    }

    return responseContent;
  } catch (error) {
    console.error("OpenAI chat error:", error);
    throw new Error(`Failed to process chat: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

