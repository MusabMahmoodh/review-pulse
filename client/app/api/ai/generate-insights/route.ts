import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/server/auth";
import { isPremium } from "@/lib/server/subscription";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { generateInsights, getStartDate, type TimePeriod } from "@/lib/server/ai";

const requestSchema = z.object({
  timePeriod: z
    .enum(["2days", "week", "month", "2months", "3months", "4months", "5months", "6months"])
    .optional(),
  filter: z.enum(["external", "internal", "overall"]).optional(),
});

function premiumRequiredResponse() {
  return NextResponse.json(
    {
      error: "Premium subscription required",
      requiresPremium: true,
    },
    { status: 403 }
  );
}

function toCsv(values: string[]): string {
  return values.map((value) => value.trim()).filter(Boolean).join(",");
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const hasPremium = await isPremium(authContext.restaurant.id);
    if (!hasPremium) {
      return premiumRequiredResponse();
    }

    const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const timePeriod = (parsed.data.timePeriod || "month") as TimePeriod;
    const filter = parsed.data.filter || "overall";
    const startDate = getStartDate(timePeriod).toISOString();

    const supabaseAdmin = getSupabaseAdminClient();

    const [restaurantResult, feedbackResult, reviewResult] = await Promise.all([
      supabaseAdmin.from("restaurants").select("id,name").eq("id", authContext.restaurant.id).limit(1),
      supabaseAdmin
        .from("customer_feedback")
        .select("foodRating,staffRating,ambienceRating,overallRating,suggestions,createdAt")
        .eq("restaurantId", authContext.restaurant.id)
        .gte("createdAt", startDate)
        .order("createdAt", { ascending: false }),
      supabaseAdmin
        .from("external_reviews")
        .select("platform,rating,comment,reviewDate")
        .eq("restaurantId", authContext.restaurant.id)
        .gte("reviewDate", startDate)
        .order("reviewDate", { ascending: false }),
    ]);

    if (restaurantResult.error || feedbackResult.error || reviewResult.error) {
      return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
    }

    const restaurant = restaurantResult.data?.[0];
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    let feedback = feedbackResult.data || [];
    let reviews = reviewResult.data || [];

    if (filter === "internal") {
      reviews = [];
      if (feedback.length === 0) {
        return NextResponse.json(
          { error: `No internal feedback found for the selected time period (${timePeriod})` },
          { status: 400 }
        );
      }
    } else if (filter === "external") {
      feedback = [];
      if (reviews.length === 0) {
        return NextResponse.json(
          { error: `No external reviews found for the selected time period (${timePeriod})` },
          { status: 400 }
        );
      }
    } else if (feedback.length === 0 && reviews.length === 0) {
      return NextResponse.json(
        { error: `No feedback or reviews found for the selected time period (${timePeriod})` },
        { status: 400 }
      );
    }

    const insightData = await generateInsights(feedback, reviews, restaurant.name, filter);

    const insightId = `insight_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const { data: savedInsight, error: saveError } = await supabaseAdmin
      .from("ai_insights")
      .insert({
        id: insightId,
        restaurantId: authContext.restaurant.id,
        summary: insightData.summary,
        recommendations: toCsv(insightData.recommendations),
        sentiment: insightData.sentiment,
        keyTopics: toCsv(insightData.keyTopics),
      })
      .select("id,restaurantId,summary,recommendations,sentiment,keyTopics,generatedAt")
      .single();

    if (saveError || !savedInsight) {
      return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      insight: {
        ...savedInsight,
        recommendations: insightData.recommendations,
        keyTopics: insightData.keyTopics,
      },
      message: `Insights generated successfully for ${timePeriod} period`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to generate insights" },
      { status: 500 }
    );
  }
}
