import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/server/auth";
import { isPremium } from "@/lib/server/subscription";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const updateKeywordsSchema = z.object({
  keywords: z.array(z.string()),
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

function parseKeywords(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((keyword) => keyword.trim())
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

    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .select("id,socialKeywords")
      .eq("id", authContext.restaurant.id)
      .limit(1);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 });
    }

    const restaurant = data?.[0];
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json({ keywords: parseKeywords(restaurant.socialKeywords) });
  } catch {
    return NextResponse.json({ error: "Failed to fetch keywords" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const hasPremium = await isPremium(authContext.restaurant.id);
    if (!hasPremium) {
      return premiumRequiredResponse();
    }

    const parsed = updateKeywordsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Keywords array required" }, { status: 400 });
    }

    const keywords = parsed.data.keywords;
    if (keywords.length < 3 || keywords.length > 5) {
      return NextResponse.json({ error: "Keywords must be between 3 and 5" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .update({ socialKeywords: keywords.join(",") })
      .eq("id", authContext.restaurant.id)
      .select("id,socialKeywords")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to update keywords" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Keywords updated successfully",
      keywords: parseKeywords(data.socialKeywords),
    });
  } catch {
    return NextResponse.json({ error: "Failed to update keywords" }, { status: 500 });
  }
}
