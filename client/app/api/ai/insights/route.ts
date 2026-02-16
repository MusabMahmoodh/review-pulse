import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { isPremium } from "@/lib/server/subscription";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { getStartDate, type TimePeriod } from "@/lib/server/ai";

const validPeriods: TimePeriod[] = [
  "2days",
  "week",
  "month",
  "2months",
  "3months",
  "4months",
  "5months",
  "6months",
];

function premiumRequiredResponse() {
  return NextResponse.json(
    {
      error: "Premium subscription required",
      requiresPremium: true,
    },
    { status: 403 }
  );
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const hasPremium = await isPremium(authContext.restaurant.id);
    if (!hasPremium) {
      return premiumRequiredResponse();
    }

    const timePeriodRaw = request.nextUrl.searchParams.get("timePeriod");
    const timePeriod = timePeriodRaw || undefined;

    if (timePeriod && !validPeriods.includes(timePeriod as TimePeriod)) {
      return NextResponse.json(
        { error: `Invalid time period. Must be one of: ${validPeriods.join(", ")}` },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();
    let query = supabaseAdmin
      .from("ai_insights")
      .select("id,restaurantId,summary,recommendations,sentiment,keyTopics,generatedAt")
      .eq("restaurantId", authContext.restaurant.id)
      .order("generatedAt", { ascending: false })
      .limit(1);

    if (timePeriod) {
      query = query.gte("generatedAt", getStartDate(timePeriod as TimePeriod).toISOString());
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 });
    }

    const insight = data?.[0];
    if (!insight) {
      return NextResponse.json({ insight: null });
    }

    return NextResponse.json({
      insight: {
        ...insight,
        recommendations: parseStringArray(insight.recommendations),
        keyTopics: parseStringArray(insight.keyTopics),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch insights" }, { status: 500 });
  }
}
