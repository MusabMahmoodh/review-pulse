import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/server/auth";
import { isPremium } from "@/lib/server/subscription";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  sourceType: z.enum(["comment", "ai_suggestion"]),
  sourceId: z.string().min(1),
  sourceText: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
  deadline: z.string().optional().nullable(),
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

    const completedParam = request.nextUrl.searchParams.get("completed");
    const supabaseAdmin = getSupabaseAdminClient();

    let query = supabaseAdmin
      .from("actionable_items")
      .select(
        "id,restaurantId,title,description,completed,sourceType,sourceId,sourceText,assignedTo,deadline,createdAt,updatedAt"
      )
      .eq("restaurantId", authContext.restaurant.id)
      .order("createdAt", { ascending: false });

    if (completedParam !== null) {
      query = query.eq("completed", completedParam === "true");
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: "Failed to fetch actionable items" }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch actionable items" }, { status: 500 });
  }
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

    const json = await request.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { title, description, sourceType, sourceId, sourceText, assignedTo, deadline } = parsed.data;
    const supabaseAdmin = getSupabaseAdminClient();

    if (sourceType === "comment") {
      const [feedbackResult, reviewResult] = await Promise.all([
        supabaseAdmin
          .from("customer_feedback")
          .select("id")
          .eq("id", sourceId)
          .eq("restaurantId", authContext.restaurant.id)
          .limit(1),
        supabaseAdmin
          .from("external_reviews")
          .select("id")
          .eq("id", sourceId)
          .eq("restaurantId", authContext.restaurant.id)
          .limit(1),
      ]);

      const feedbackFound = !!feedbackResult.data && feedbackResult.data.length > 0;
      const reviewFound = !!reviewResult.data && reviewResult.data.length > 0;
      if ((!feedbackFound && !reviewFound) || feedbackResult.error || reviewResult.error) {
        return NextResponse.json({ error: "Source comment not found" }, { status: 404 });
      }
    }

    if (sourceType === "ai_suggestion") {
      const { data: insightRows, error: insightError } = await supabaseAdmin
        .from("ai_insights")
        .select("id")
        .eq("id", sourceId)
        .eq("restaurantId", authContext.restaurant.id)
        .limit(1);

      if (insightError || !insightRows || insightRows.length === 0) {
        return NextResponse.json({ error: "Source AI insight not found" }, { status: 404 });
      }
    }

    if (assignedTo) {
      const { data: teamMemberRows, error: teamMemberError } = await supabaseAdmin
        .from("team_members")
        .select("id")
        .eq("id", assignedTo)
        .eq("restaurantId", authContext.restaurant.id)
        .limit(1);

      if (teamMemberError || !teamMemberRows || teamMemberRows.length === 0) {
        return NextResponse.json({ error: "Team member not found" }, { status: 404 });
      }
    }

    const itemId = `actionable_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const { data, error } = await supabaseAdmin
      .from("actionable_items")
      .insert({
        id: itemId,
        restaurantId: authContext.restaurant.id,
        title,
        description: description || null,
        sourceType,
        sourceId,
        sourceText: sourceText || null,
        assignedTo: assignedTo || null,
        deadline: deadline || null,
        completed: false,
      })
      .select(
        "id,restaurantId,title,description,completed,sourceType,sourceId,sourceText,assignedTo,deadline,createdAt,updatedAt"
      )
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to create actionable item" }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        item: data,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create actionable item" }, { status: 500 });
  }
}
