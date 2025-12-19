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
  restaurantName?: string,
  filter: "external" | "internal" | "overall" = "overall"
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

  // Build prompt with filter context
  const filterContext = filter === "internal" 
    ? " (analyzing only internal feedback from your review system)"
    : filter === "external"
    ? " (analyzing only external reviews from Google, Facebook, etc.)"
    : " (analyzing both internal feedback and external reviews)";

  // Build prompt
  const prompt = `You are an AI assistant analyzing customer feedback and reviews for a restaurant${restaurantName ? ` named "${restaurantName}"` : ""}${filterContext}.

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
      model: "gpt-4o",
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
 * Build context for chat (shared between streaming and non-streaming)
 */
function buildChatContext(
  feedback: CustomerFeedback[],
  reviews: ExternalReview[],
  restaurantName?: string
): string {
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

  return `You are a senior AI business advisor helping a restaurant owner${restaurantName ? ` of "${restaurantName}"` : ""} understand and act on customer feedback.

Your role is to analyze customer feedback and reviews and convert them into clear business insights and actionable recommendations.

---

## Scope & Intent Handling

You should answer questions related to:
- Customer feedback, reviews, and ratings
- Specific dishes, food items, menu items, or ingredients
- Restaurant operations: staff behavior, service quality, food quality, ambience, pricing
- Business insights and improvements based on feedback data

### Interpreting Short or Vague Questions
If the user asks a short or one-word question (e.g., "dosai?", "biryani?", "staff?", "service?"):
- Interpret it as: **"What are customers saying about this based on the provided feedback?"**
- Do NOT ask clarifying questions
- Proceed directly with analysis using available data

---

## Out-of-Scope Handling
Only redirect questions that are **clearly unrelated** to restaurants or customer feedback
(e.g., history, science, mythology, personal biographies).

For such questions, respond with:
"I'm focused on helping you understand your restaurant's customer feedback. Could you ask a question about your reviews, dishes, or restaurant operations instead?"

---

## Evidence & Accuracy Rules
- Search through **ALL internal feedback and ALL external reviews** before answering
- Base insights strictly on the provided data
- Do NOT invent trends or feedback
- If evidence is limited or mixed, say so clearly and summarize what is available
- Quotes must be short and relevant
- Do NOT reuse the same quote for multiple insights

---

## Data Provided

### Internal Feedback
- Total: ${feedbackData.length}
- Avg Ratings:
  - Food: ${avgFoodRating.toFixed(2)}/5
  - Staff: ${avgStaffRating.toFixed(2)}/5
  - Ambience: ${avgAmbienceRating.toFixed(2)}/5
  - Overall: ${avgOverallRating.toFixed(2)}/5

### Internal Comments
${feedbackData
  .filter((f) => f.suggestions)
  .map((f, i) => `${i + 1}. "${f.suggestions}" (Overall: ${f.overallRating}/5)`)
  .join("\n") || "No internal comments provided"}

### External Reviews (ALL ${reviewData.length})
${reviewData
  .map((r, i) => `${i + 1}. [${r.platform}] ${r.rating}/5 — "${r.comment}"`)
  .join("\n") || "No external reviews"}

---

## Response Requirements

### Output Format (Markdown)

## Key Insights
- Insight statement  
  > "Relevant customer quote"

## Top Actionable Recommendations (Max 5)
1. **Action title**
   - Why it matters (based on feedback)
   - Supporting evidence:
     > "Customer quote"

---

## Behavioral Guidelines
- Be concise and decision-ready
- Prioritize clarity over verbosity
- No filler text, no AI disclaimers
- Business-focused, practical tone
`;
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

  const context = buildChatContext(feedback, reviews, restaurantName);

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
      max_tokens: 1000,
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

/**
 * Chat with AI about restaurant feedback (streaming version)
 * Returns an async generator that yields chunks of the response
 */
export async function* chatAboutFeedbackStream(
  message: string,
  feedback: CustomerFeedback[],
  reviews: ExternalReview[],
  restaurantName?: string
): AsyncGenerator<string, void, unknown> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const context = buildChatContext(feedback, reviews, restaurantName);

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
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
      max_tokens: 1000,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error("OpenAI streaming chat error:", error);
    throw new Error(`Failed to process chat stream: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

