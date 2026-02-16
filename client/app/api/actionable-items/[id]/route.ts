import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/server/auth";
import { isPremium } from "@/lib/server/subscription";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const updateSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    completed: z.boolean().optional(),
    assignedTo: z.string().nullable().optional(),
    deadline: z.string().nullable().optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "No fields provided",
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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const hasPremium = await isPremium(authContext.restaurant.id);
    if (!hasPremium) {
      return premiumRequiredResponse();
    }

    const { id } = await context.params;
    const json = await request.json();
    const parsed = updateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("actionable_items")
      .select("id")
      .eq("id", id)
      .eq("restaurantId", authContext.restaurant.id)
      .limit(1);

    if (existingError) {
      return NextResponse.json({ error: "Failed to update actionable item" }, { status: 500 });
    }

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ error: "Actionable item not found" }, { status: 404 });
    }

    if (parsed.data.assignedTo) {
      const { data: teamMemberRows, error: teamMemberError } = await supabaseAdmin
        .from("team_members")
        .select("id")
        .eq("id", parsed.data.assignedTo)
        .eq("restaurantId", authContext.restaurant.id)
        .limit(1);

      if (teamMemberError || !teamMemberRows || teamMemberRows.length === 0) {
        return NextResponse.json({ error: "Team member not found" }, { status: 404 });
      }
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.description !== undefined) updates.description = parsed.data.description;
    if (parsed.data.completed !== undefined) updates.completed = parsed.data.completed;
    if (parsed.data.assignedTo !== undefined) updates.assignedTo = parsed.data.assignedTo || null;
    if (parsed.data.deadline !== undefined) updates.deadline = parsed.data.deadline || null;

    const { data, error } = await supabaseAdmin
      .from("actionable_items")
      .update(updates)
      .eq("id", id)
      .eq("restaurantId", authContext.restaurant.id)
      .select(
        "id,restaurantId,title,description,completed,sourceType,sourceId,sourceText,assignedTo,deadline,createdAt,updatedAt"
      )
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to update actionable item" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: data,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update actionable item" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const hasPremium = await isPremium(authContext.restaurant.id);
    if (!hasPremium) {
      return premiumRequiredResponse();
    }

    const { id } = await context.params;
    const supabaseAdmin = getSupabaseAdminClient();

    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("actionable_items")
      .select("id")
      .eq("id", id)
      .eq("restaurantId", authContext.restaurant.id)
      .limit(1);

    if (existingError) {
      return NextResponse.json({ error: "Failed to delete actionable item" }, { status: 500 });
    }

    if (!existingRows || existingRows.length === 0) {
      return NextResponse.json({ error: "Actionable item not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("actionable_items")
      .delete()
      .eq("id", id)
      .eq("restaurantId", authContext.restaurant.id);

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete actionable item" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Actionable item deleted",
    });
  } catch {
    return NextResponse.json({ error: "Failed to delete actionable item" }, { status: 500 });
  }
}
