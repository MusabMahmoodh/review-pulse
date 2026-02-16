import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/server/auth";
import { isPremium } from "@/lib/server/subscription";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const updateSchema = z.object({
  placeId: z.string().min(1),
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

    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .select("id,googlePlaceId")
      .eq("id", authContext.restaurant.id)
      .limit(1);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch Google Place ID" }, { status: 500 });
    }

    const restaurant = data?.[0];
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      placeId: restaurant.googlePlaceId || null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch Google Place ID" }, { status: 500 });
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

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Place ID is required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .update({ googlePlaceId: parsed.data.placeId })
      .eq("id", authContext.restaurant.id)
      .select("id,googlePlaceId")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to update Google Place ID" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Google Place ID saved successfully",
      placeId: data.googlePlaceId,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update Google Place ID" }, { status: 500 });
  }
}
