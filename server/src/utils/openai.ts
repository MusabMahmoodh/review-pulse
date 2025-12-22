import OpenAI from "openai";
import { StudentFeedback } from "../models/StudentFeedback";
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

export interface EnhancedInsightData extends InsightData {
  executiveSummary: {
    positiveSentiment: string;
    overallRating: number;
    totalFeedback: number;
    trend: "improving" | "declining" | "stable";
  };
  performanceMetrics: {
    teaching: number;
    communication: number;
    material: number;
  };
  keyStrengths: Array<{
    title: string;
    description: string;
    rating: number;
  }>;
  areasForImprovement: Array<{
    title: string;
    description: string;
    supportingReviews?: string[];
  }>;
  studentStruggles: Array<{
    topic: string;
    description: string;
    frequency?: number;
  }>;
}

/**
 * Generate AI insights from feedback and reviews
 */
export async function generateInsights(
  feedback: StudentFeedback[],
  reviews: ExternalReview[],
  teacherName?: string
): Promise<InsightData> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  // Prepare data for analysis
  const feedbackData = feedback.map((f) => ({
    teachingRating: f.teachingRating,
    communicationRating: f.communicationRating,
    materialRating: f.materialRating,
    overallRating: f.overallRating,
    suggestions: f.suggestions || "",
    courseName: f.courseName || "",
    date: f.createdAt.toISOString(),
  }));

  const reviewData = reviews.map((r) => ({
    platform: r.platform,
    rating: r.rating,
    comment: r.comment,
    date: r.reviewDate.toISOString(),
  }));

  // Calculate average ratings
  const avgTeachingRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.teachingRating, 0) / feedbackData.length
      : 0;
  const avgCommunicationRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.communicationRating, 0) / feedbackData.length
      : 0;
  const avgMaterialRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.materialRating, 0) / feedbackData.length
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
  const prompt = `You are an AI assistant analyzing student feedback for a teacher${teacherName ? ` named "${teacherName}"` : ""}.

Analyze the following data and provide insights:

**Student Feedback (${feedbackData.length} entries):**
Average Ratings:
- Teaching Quality: ${avgTeachingRating.toFixed(2)}/5
- Communication: ${avgCommunicationRating.toFixed(2)}/5
- Materials: ${avgMaterialRating.toFixed(2)}/5
- Overall: ${avgOverallRating.toFixed(2)}/5

Feedback Comments:
${feedbackData
  .filter((f) => f.suggestions)
  .map((f, i) => `${i + 1}. "${f.suggestions}" (Overall: ${f.overallRating}/5${f.courseName ? `, Course: ${f.courseName}` : ""})`)
  .join("\n") || "No comments provided"}

${reviewData.length > 0 ? `**External Reviews (${reviewData.length} entries):**
Average Rating: ${avgExternalRating.toFixed(2)}/5

Reviews:
${reviewData
  .map((r, i) => `${i + 1}. [${r.platform}] ${r.rating}/5: "${r.comment}"`)
  .join("\n")}` : ""}

Please provide a comprehensive analysis in the following JSON format:
{
  "summary": "A 2-3 sentence summary of the overall student sentiment and key findings",
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2", "Actionable recommendation 3"],
  "sentiment": "positive" | "neutral" | "negative",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]
}

Requirements:
- Summary should be concise but informative
- Recommendations should be specific and actionable
- Sentiment should reflect overall student satisfaction
- Key topics should be the most frequently mentioned themes (teaching methods, communication, course materials, clarity, engagement, etc.)
- Return ONLY valid JSON, no additional text`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert educational consultant analyzing student feedback. Provide insights in JSON format only.",
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
 * Generate enhanced AI insights with detailed breakdown (Executive Summary, Performance Metrics, etc.)
 */
export async function generateEnhancedInsights(
  feedback: StudentFeedback[],
  reviews: ExternalReview[],
  teacherName?: string,
  formName?: string
): Promise<EnhancedInsightData> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  // Prepare data for analysis
  const feedbackData = feedback.map((f) => ({
    teachingRating: f.teachingRating,
    communicationRating: f.communicationRating,
    materialRating: f.materialRating,
    overallRating: f.overallRating,
    suggestions: f.suggestions || "",
    courseName: f.courseName || "",
    date: f.createdAt.toISOString(),
  }));

  const reviewData = reviews.map((r) => ({
    platform: r.platform,
    rating: r.rating,
    comment: r.comment,
    date: r.reviewDate.toISOString(),
  }));

  // Calculate average ratings
  const avgTeachingRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.teachingRating, 0) / feedbackData.length
      : 0;
  const avgCommunicationRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.communicationRating, 0) / feedbackData.length
      : 0;
  const avgMaterialRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.materialRating, 0) / feedbackData.length
      : 0;
  const avgOverallRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.overallRating, 0) / feedbackData.length
      : 0;

  // Calculate trend (comparing first half vs second half of feedback)
  let trend: "improving" | "declining" | "stable" = "stable";
  if (feedbackData.length >= 4) {
    const sortedByDate = [...feedbackData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const midpoint = Math.floor(sortedByDate.length / 2);
    const firstHalf = sortedByDate.slice(0, midpoint);
    const secondHalf = sortedByDate.slice(midpoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, f) => sum + f.overallRating, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, f) => sum + f.overallRating, 0) / secondHalf.length;
    
    const diff = secondHalfAvg - firstHalfAvg;
    if (diff > 0.2) {
      trend = "improving";
    } else if (diff < -0.2) {
      trend = "declining";
    }
  }

  // Build comprehensive prompt
  const context = formName 
    ? `for the "${formName}" form${teacherName ? ` of ${teacherName}` : ""}`
    : teacherName 
    ? `for ${teacherName}`
    : "for this organization";

  const prompt = `You are an AI assistant analyzing student feedback ${context}.

Analyze the following data and provide comprehensive insights:

**Student Feedback (${feedbackData.length} entries):**
Average Ratings:
- Teaching Quality: ${avgTeachingRating.toFixed(2)}/5.0
- Communication: ${avgCommunicationRating.toFixed(2)}/5.0
- Materials: ${avgMaterialRating.toFixed(2)}/5.0
- Overall: ${avgOverallRating.toFixed(2)}/5.0

Feedback Comments:
${feedbackData
  .filter((f) => f.suggestions)
  .map((f, i) => `${i + 1}. "${f.suggestions}" (Overall: ${f.overallRating}/5${f.courseName ? `, Course: ${f.courseName}` : ""})`)
  .join("\n") || "No comments provided"}

${reviewData.length > 0 ? `**External Reviews (${reviewData.length} entries):**
Average Rating: ${reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length}/5.0

Reviews:
${reviewData
  .map((r, i) => `${i + 1}. [${r.platform}] ${r.rating}/5: "${r.comment}"`)
  .join("\n")}` : ""}

Please provide a comprehensive analysis in the following JSON format:
{
  "summary": "A 2-3 sentence summary of the overall student sentiment and key findings",
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2", "Actionable recommendation 3"],
  "sentiment": "positive" | "neutral" | "negative",
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"],
  "executiveSummary": {
    "positiveSentiment": "A 2-3 sentence positive summary highlighting what's working well",
    "overallRating": ${avgOverallRating.toFixed(1)},
    "totalFeedback": ${feedbackData.length},
    "trend": "${trend}"
  },
  "performanceMetrics": {
    "teaching": ${avgTeachingRating.toFixed(1)},
    "communication": ${avgCommunicationRating.toFixed(1)},
    "material": ${avgMaterialRating.toFixed(1)}
  },
  "keyStrengths": [
    {
      "title": "Strength title (e.g., 'Excellent Teaching Quality')",
      "description": "Brief description of why this is a strength",
      "rating": ${avgTeachingRating.toFixed(1)}
    }
  ],
  "areasForImprovement": [
    {
      "title": "Area to improve (e.g., 'More Practice on SHM')",
      "description": "Detailed description of what needs improvement and why",
      "supportingReviews": ["Quote 1 from feedback", "Quote 2 from feedback"]
    }
  ],
  "studentStruggles": [
    {
      "topic": "Topic or concept students are struggling with",
      "description": "Description of the struggle and its impact",
      "frequency": 3
    }
  ]
}

Requirements:
- Summary should be concise but informative
- Recommendations should be specific and actionable
- Sentiment should reflect overall student satisfaction
- Key topics should be the most frequently mentioned themes
- Executive summary should highlight positive aspects
- Key strengths should identify top-performing areas (3-5 items)
- Areas for improvement should be specific, actionable items with supporting quotes from feedback (3-5 items)
- Student struggles should identify topics/concepts where students are having difficulty (2-4 items)
- All ratings should be on a 5.0 scale
- Return ONLY valid JSON, no additional text`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert educational consultant analyzing student feedback. Provide comprehensive insights in JSON format only. Be specific and actionable in your recommendations.",
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

    const parsed = JSON.parse(responseContent) as EnhancedInsightData;

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
      executiveSummary: parsed.executiveSummary || {
        positiveSentiment: "Student feedback is being collected and analyzed.",
        overallRating: avgOverallRating,
        totalFeedback: feedbackData.length,
        trend: trend,
      },
      performanceMetrics: parsed.performanceMetrics || {
        teaching: avgTeachingRating,
        communication: avgCommunicationRating,
        material: avgMaterialRating,
      },
      keyStrengths: Array.isArray(parsed.keyStrengths) ? parsed.keyStrengths : [],
      areasForImprovement: Array.isArray(parsed.areasForImprovement) ? parsed.areasForImprovement : [],
      studentStruggles: Array.isArray(parsed.studentStruggles) ? parsed.studentStruggles : [],
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to generate enhanced insights: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Build context for chat (shared between streaming and non-streaming)
 */
function buildChatContext(
  feedback: StudentFeedback[],
  reviews: ExternalReview[],
  teacherName?: string
): string {
  const feedbackData = feedback.map((f) => ({
    teachingRating: f.teachingRating,
    communicationRating: f.communicationRating,
    materialRating: f.materialRating,
    overallRating: f.overallRating,
    suggestions: f.suggestions || "",
    courseName: f.courseName || "",
    date: f.createdAt.toISOString(),
  }));

  const reviewData = reviews.map((r) => ({
    platform: r.platform,
    rating: r.rating,
    comment: r.comment,
    date: r.reviewDate.toISOString(),
  }));

  const avgTeachingRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.teachingRating, 0) / feedbackData.length
      : 0;
  const avgCommunicationRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.communicationRating, 0) / feedbackData.length
      : 0;
  const avgMaterialRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.materialRating, 0) / feedbackData.length
      : 0;
  const avgOverallRating =
    feedbackData.length > 0
      ? feedbackData.reduce((sum, f) => sum + f.overallRating, 0) / feedbackData.length
      : 0;
  const avgExternalRating =
    reviewData.length > 0
      ? reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length
      : 0;

  return `You are a senior AI educational advisor helping a teacher${teacherName ? ` named "${teacherName}"` : ""} understand and act on student feedback.

Your role is to analyze student feedback and convert it into clear teaching insights and actionable recommendations.

---

## Scope & Intent Handling

You should answer questions related to:
- Student feedback, ratings, and comments
- Teaching methods, communication, course materials
- Specific topics, courses, or subjects mentioned in feedback
- Teaching effectiveness and improvements based on feedback data

### Interpreting Short or Vague Questions
If the user asks a short or one-word question (e.g., "mathematics?", "communication?", "materials?"):
- Interpret it as: **"What are students saying about this based on the provided feedback?"**
- Do NOT ask clarifying questions
- Proceed directly with analysis using available data

---

## Out-of-Scope Handling
Only redirect questions that are **clearly unrelated** to teaching or student feedback
(e.g., history, science facts, mythology, personal biographies).

For such questions, respond with:
"I'm focused on helping you understand your student feedback. Could you ask a question about your teaching, courses, or student feedback instead?"

---

## Evidence & Accuracy Rules
- Search through **ALL student feedback** before answering
- Base insights strictly on the provided data
- Do NOT invent trends or feedback
- If evidence is limited or mixed, say so clearly and summarize what is available
- Quotes must be short and relevant
- Do NOT reuse the same quote for multiple insights

---

## Data Provided

### Student Feedback
- Total: ${feedbackData.length}
- Avg Ratings:
  - Teaching Quality: ${avgTeachingRating.toFixed(2)}/5
  - Communication: ${avgCommunicationRating.toFixed(2)}/5
  - Materials: ${avgMaterialRating.toFixed(2)}/5
  - Overall: ${avgOverallRating.toFixed(2)}/5

### Student Comments
${feedbackData
  .filter((f) => f.suggestions)
  .map((f, i) => `${i + 1}. "${f.suggestions}" (Overall: ${f.overallRating}/5${f.courseName ? `, Course: ${f.courseName}` : ""})`)
  .join("\n") || "No comments provided"}

${reviewData.length > 0 ? `### External Reviews (${reviewData.length})
${reviewData
  .map((r, i) => `${i + 1}. [${r.platform}] ${r.rating}/5 — "${r.comment}"`)
  .join("\n")}` : ""}

---

## Response Requirements

### Output Format (Markdown)

## Key Insights
- Insight statement  
  > "Relevant student quote"

## Top Actionable Recommendations (Max 5)
1. **Action title**
   - Why it matters (based on feedback)
   - Supporting evidence:
     > "Student quote"

---

## Behavioral Guidelines
- Be concise and decision-ready
- Prioritize clarity over verbosity
- No filler text, no AI disclaimers
- Business-focused, practical tone
`;
}

/**
 * Chat with AI about student feedback
 */
export async function chatAboutFeedback(
  message: string,
  feedback: StudentFeedback[],
  reviews: ExternalReview[],
  teacherName?: string
): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const context = buildChatContext(feedback, reviews, teacherName);

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
 * Chat with AI about student feedback (streaming version)
 * Returns an async generator that yields chunks of the response
 */
export async function* chatAboutFeedbackStream(
  message: string,
  feedback: StudentFeedback[],
  reviews: ExternalReview[],
  teacherName?: string
): AsyncGenerator<string, void, unknown> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const context = buildChatContext(feedback, reviews, teacherName);

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

