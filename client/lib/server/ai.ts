import OpenAI from "openai";

export type TimePeriod =
  | "2days"
  | "week"
  | "month"
  | "2months"
  | "3months"
  | "4months"
  | "5months"
  | "6months";

export type InsightData = {
  summary: string;
  recommendations: string[];
  sentiment: "positive" | "neutral" | "negative";
  keyTopics: string[];
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function getStartDate(period: TimePeriod): Date {
  const now = new Date();
  const startDate = new Date(now);

  switch (period) {
    case "2days":
      startDate.setDate(now.getDate() - 2);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "2months":
      startDate.setMonth(now.getMonth() - 2);
      break;
    case "3months":
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "4months":
      startDate.setMonth(now.getMonth() - 4);
      break;
    case "5months":
      startDate.setMonth(now.getMonth() - 5);
      break;
    case "6months":
      startDate.setMonth(now.getMonth() - 6);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  return startDate;
}

function ensureApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
}

type FeedbackItem = {
  foodRating: number;
  staffRating: number;
  ambienceRating: number;
  overallRating: number;
  suggestions?: string | null;
  createdAt: string;
};

type ExternalReviewItem = {
  platform: string;
  rating: number;
  comment: string;
  reviewDate: string;
};

export async function generateInsights(
  feedback: FeedbackItem[],
  reviews: ExternalReviewItem[],
  restaurantName?: string,
  filter: "external" | "internal" | "overall" = "overall"
): Promise<InsightData> {
  ensureApiKey();

  const avgFoodRating =
    feedback.length > 0 ? feedback.reduce((sum, item) => sum + Number(item.foodRating || 0), 0) / feedback.length : 0;
  const avgStaffRating =
    feedback.length > 0
      ? feedback.reduce((sum, item) => sum + Number(item.staffRating || 0), 0) / feedback.length
      : 0;
  const avgAmbienceRating =
    feedback.length > 0
      ? feedback.reduce((sum, item) => sum + Number(item.ambienceRating || 0), 0) / feedback.length
      : 0;
  const avgOverallRating =
    feedback.length > 0 ? feedback.reduce((sum, item) => sum + Number(item.overallRating || 0), 0) / feedback.length : 0;
  const avgExternalRating =
    reviews.length > 0 ? reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length : 0;

  const filterContext =
    filter === "internal"
      ? " (analyzing only internal feedback from your review system)"
      : filter === "external"
        ? " (analyzing only external reviews from Google, Facebook, etc.)"
        : " (analyzing both internal feedback and external reviews)";

  const prompt = `You are an AI assistant analyzing customer feedback and reviews for a restaurant${restaurantName ? ` named "${restaurantName}"` : ""}${filterContext}.

Analyze the following data and provide insights:

**Internal Feedback (${feedback.length} entries):**
Average Ratings:
- Food: ${avgFoodRating.toFixed(2)}/5
- Staff: ${avgStaffRating.toFixed(2)}/5
- Ambience: ${avgAmbienceRating.toFixed(2)}/5
- Overall: ${avgOverallRating.toFixed(2)}/5

Feedback Comments:
${feedback
  .filter((item) => item.suggestions)
  .map((item, index) => `${index + 1}. "${item.suggestions}" (Overall: ${item.overallRating}/5)`)
  .join("\n") || "No comments provided"}

**External Reviews (${reviews.length} entries):**
Average Rating: ${avgExternalRating.toFixed(2)}/5

Reviews:
${reviews
  .map((item, index) => `${index + 1}. [${item.platform}] ${item.rating}/5: "${item.comment}"`)
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
- Key topics should be the most frequently mentioned themes
- Return ONLY valid JSON, no additional text`;

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

  return {
    summary: parsed.summary || "No summary available",
    recommendations: Array.isArray(parsed.recommendations)
      ? parsed.recommendations
      : ["No recommendations available"],
    sentiment:
      parsed.sentiment === "positive" || parsed.sentiment === "neutral" || parsed.sentiment === "negative"
        ? parsed.sentiment
        : "neutral",
    keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
  };
}

function buildChatContext(feedback: FeedbackItem[], reviews: ExternalReviewItem[], restaurantName?: string): string {
  const avgFoodRating =
    feedback.length > 0 ? feedback.reduce((sum, item) => sum + Number(item.foodRating || 0), 0) / feedback.length : 0;
  const avgStaffRating =
    feedback.length > 0
      ? feedback.reduce((sum, item) => sum + Number(item.staffRating || 0), 0) / feedback.length
      : 0;
  const avgAmbienceRating =
    feedback.length > 0
      ? feedback.reduce((sum, item) => sum + Number(item.ambienceRating || 0), 0) / feedback.length
      : 0;
  const avgOverallRating =
    feedback.length > 0 ? feedback.reduce((sum, item) => sum + Number(item.overallRating || 0), 0) / feedback.length : 0;

  return `You are a senior AI business advisor helping a restaurant owner${restaurantName ? ` of "${restaurantName}"` : ""} understand and act on customer feedback.

### Internal Feedback Summary
- Total entries: ${feedback.length}
- Avg food: ${avgFoodRating.toFixed(2)}/5
- Avg staff: ${avgStaffRating.toFixed(2)}/5
- Avg ambience: ${avgAmbienceRating.toFixed(2)}/5
- Avg overall: ${avgOverallRating.toFixed(2)}/5

### Internal Comments
${feedback
  .filter((item) => item.suggestions)
  .map((item, index) => `${index + 1}. "${item.suggestions}" (overall ${item.overallRating}/5)`)
  .join("\n") || "No internal comments"}

### External Reviews
${reviews
  .map((item, index) => `${index + 1}. [${item.platform}] ${item.rating}/5 — "${item.comment}"`)
  .join("\n") || "No external reviews"}

Always answer with concise, practical restaurant advice grounded only in this data.`;
}

export async function chatAboutFeedback(
  message: string,
  feedback: FeedbackItem[],
  reviews: ExternalReviewItem[],
  restaurantName?: string
): Promise<string> {
  ensureApiKey();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: buildChatContext(feedback, reviews, restaurantName) },
      { role: "user", content: message },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const responseContent = completion.choices[0]?.message?.content;
  if (!responseContent) {
    throw new Error("No response from OpenAI");
  }

  return responseContent;
}

export async function* chatAboutFeedbackStream(
  message: string,
  feedback: FeedbackItem[],
  reviews: ExternalReviewItem[],
  restaurantName?: string
): AsyncGenerator<string, void, unknown> {
  ensureApiKey();

  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: buildChatContext(feedback, reviews, restaurantName) },
      { role: "user", content: message },
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
}
