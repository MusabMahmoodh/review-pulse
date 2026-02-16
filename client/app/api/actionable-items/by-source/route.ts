import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { isPremium } from "@/lib/server/subscription";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

function premiumRequiredResponse() {
  return NextResponse.json(
    {
      error: "Premium subscription required",
      requiresPremium: true,
    },
    { status: 403 }
  );
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

    const sourceType = request.nextUrl.searchParams.get("sourceType");
    const sourceId = request.nextUrl.searchParams.get("sourceId");

    if (!sourceType || !sourceId) {
      return NextResponse.json(
        { error: "Restaurant ID, sourceType, and sourceId are required" },
        { status: 400 }
      );
    }

    if (sourceType !== "comment" && sourceType !== "ai_suggestion") {
      return NextResponse.json(
        { error: "Invalid sourceType. Must be 'comment' or 'ai_suggestion'" },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("actionable_items")
      .select(
        "id,restaurantId,title,description,completed,sourceType,sourceId,sourceText,assignedTo,deadline,createdAt,updatedAt"
      )
      .eq("restaurantId", authContext.restaurant.id)
      .eq("sourceType", sourceType)
      .eq("sourceId", sourceId)
      .limit(1);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch actionable item" }, { status: 500 });
    }

    const item = data?.[0];
    if (!item) {
      return NextResponse.json({ error: "No actionable item found for this source" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Failed to fetch actionable item" }, { status: 500 });
  }
}
