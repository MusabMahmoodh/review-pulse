import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/server/auth";
import { isPremium } from "@/lib/server/subscription";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const updateSchema = z
  .object({
    name: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    role: z.string().optional(),
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

    const updates: Record<string, string | null> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.email !== undefined) updates.email = parsed.data.email || null;
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone || null;
    if (parsed.data.role !== undefined) updates.role = parsed.data.role || null;

    const supabaseAdmin = getSupabaseAdminClient();
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("id", id)
      .eq("restaurantId", authContext.restaurant.id)
      .limit(1);

    if (fetchError) {
      return NextResponse.json({ error: "Failed to update team member" }, { status: 500 });
    }

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    const { data, error: updateError } = await supabaseAdmin
      .from("team_members")
      .update(updates)
      .eq("id", id)
      .eq("restaurantId", authContext.restaurant.id)
      .select("id,restaurantId,name,email,phone,role,createdAt,updatedAt")
      .single();

    if (updateError || !data) {
      return NextResponse.json({ error: "Failed to update team member" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      member: data,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update team member" }, { status: 500 });
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

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("id", id)
      .eq("restaurantId", authContext.restaurant.id)
      .limit(1);

    if (fetchError) {
      return NextResponse.json({ error: "Failed to delete team member" }, { status: 500 });
    }

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("team_members")
      .delete()
      .eq("id", id)
      .eq("restaurantId", authContext.restaurant.id);

    if (deleteError) {
      return NextResponse.json({ error: "Failed to delete team member" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Team member deleted",
    });
  } catch {
    return NextResponse.json({ error: "Failed to delete team member" }, { status: 500 });
  }
}
