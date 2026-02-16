import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type FeedbackRow = {
  foodRating: number;
  staffRating: number;
  ambienceRating: number;
  overallRating: number;
  createdAt: string;
};

type ExternalReviewRow = {
  platform: "google" | "facebook" | "instagram";
  rating: number;
};

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdminClient();

    const [feedbackResult, externalReviewsResult] = await Promise.all([
      supabaseAdmin
        .from("customer_feedback")
        .select("foodRating,staffRating,ambienceRating,overallRating,createdAt")
        .eq("restaurantId", authContext.restaurant.id)
        .order("createdAt", { ascending: false }),
      supabaseAdmin
        .from("external_reviews")
        .select("platform,rating")
        .eq("restaurantId", authContext.restaurant.id),
    ]);

    if (feedbackResult.error || externalReviewsResult.error) {
      return NextResponse.json({ error: "Failed to calculate stats" }, { status: 500 });
    }

    const feedback = (feedbackResult.data || []) as FeedbackRow[];
    const externalReviews = (externalReviewsResult.data || []) as ExternalReviewRow[];

    const totalFeedback = feedback.length;
    let avgFood = totalFeedback > 0 ? feedback.reduce((sum, item) => sum + item.foodRating, 0) / totalFeedback : 0;
    let avgStaff =
      totalFeedback > 0 ? feedback.reduce((sum, item) => sum + item.staffRating, 0) / totalFeedback : 0;
    let avgAmbience =
      totalFeedback > 0 ? feedback.reduce((sum, item) => sum + item.ambienceRating, 0) / totalFeedback : 0;
    let avgOverall =
      totalFeedback > 0 ? feedback.reduce((sum, item) => sum + item.overallRating, 0) / totalFeedback : 0;

    if (totalFeedback === 0 && externalReviews.length > 0) {
      const avgExternalRating =
        externalReviews.reduce((sum, review) => sum + review.rating, 0) / externalReviews.length;
      avgOverall = avgExternalRating;
      avgFood = avgExternalRating;
      avgStaff = avgExternalRating;
      avgAmbience = avgExternalRating;
    }

    let recentTrend: "improving" | "stable" | "declining" = "stable";
    if (feedback.length >= 6) {
      const recent = feedback.slice(0, 3);
      const previous = feedback.slice(3, 6);
      const recentAvg = recent.reduce((sum, item) => sum + item.overallRating, 0) / 3;
      const previousAvg = previous.reduce((sum, item) => sum + item.overallRating, 0) / 3;

      if (recentAvg > previousAvg + 0.3) {
        recentTrend = "improving";
      } else if (recentAvg < previousAvg - 0.3) {
        recentTrend = "declining";
      }
    }

    return NextResponse.json({
      stats: {
        totalFeedback,
        averageRatings: {
          food: Math.round(avgFood * 100) / 100,
          staff: Math.round(avgStaff * 100) / 100,
          ambience: Math.round(avgAmbience * 100) / 100,
          overall: Math.round(avgOverall * 100) / 100,
        },
        recentTrend,
        externalReviewsCount: {
          google: externalReviews.filter((review) => review.platform === "google").length,
          facebook: externalReviews.filter((review) => review.platform === "facebook").length,
          instagram: externalReviews.filter((review) => review.platform === "instagram").length,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to calculate stats" }, { status: 500 });
  }
}
