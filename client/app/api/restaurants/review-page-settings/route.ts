import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/server/auth";
import { isPremium } from "@/lib/server/subscription";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const defaults = {
  welcomeMessage: "We Value Your Feedback",
  primaryColor: "#3b82f6",
  secondaryColor: "#1e40af",
  backgroundColor: "#f3f4f6",
  designVariation: "default",
};

const updateSchema = z.object({
  welcomeMessage: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  designVariation: z.enum(["default", "modern", "minimal", "elegant"]).optional(),
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

function validateHexColor(value: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value);
}

export async function GET(request: NextRequest) {
  try {
    const restaurantId = request.nextUrl.searchParams.get("restaurantId");
    if (!restaurantId) {
      return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("review_page_settings")
      .select("restaurantId,welcomeMessage,primaryColor,secondaryColor,backgroundColor,designVariation")
      .eq("restaurantId", restaurantId)
      .limit(1);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch review page settings" }, { status: 500 });
    }

    const settings = data?.[0];
    if (!settings) {
      return NextResponse.json(defaults);
    }

    return NextResponse.json({
      welcomeMessage: settings.welcomeMessage,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      backgroundColor: settings.backgroundColor,
      designVariation: settings.designVariation,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch review page settings" }, { status: 500 });
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
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const payload = parsed.data;
    if (payload.primaryColor && !validateHexColor(payload.primaryColor)) {
      return NextResponse.json({ error: "Primary color must be a valid hex color (e.g., #3b82f6)" }, { status: 400 });
    }
    if (payload.secondaryColor && !validateHexColor(payload.secondaryColor)) {
      return NextResponse.json({ error: "Secondary color must be a valid hex color (e.g., #1e40af)" }, { status: 400 });
    }
    if (payload.backgroundColor && !validateHexColor(payload.backgroundColor)) {
      return NextResponse.json({ error: "Background color must be a valid hex color (e.g., #f3f4f6)" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("review_page_settings")
      .select("restaurantId")
      .eq("restaurantId", authContext.restaurant.id)
      .limit(1);

    if (existingError) {
      return NextResponse.json({ error: "Failed to update review page settings" }, { status: 500 });
    }

    const existing = existingRows?.[0];

    if (!existing) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("review_page_settings")
        .insert({
          restaurantId: authContext.restaurant.id,
          welcomeMessage: payload.welcomeMessage || defaults.welcomeMessage,
          primaryColor: payload.primaryColor || defaults.primaryColor,
          secondaryColor: payload.secondaryColor || defaults.secondaryColor,
          backgroundColor: payload.backgroundColor || defaults.backgroundColor,
          designVariation: payload.designVariation || defaults.designVariation,
        })
        .select("welcomeMessage,primaryColor,secondaryColor,backgroundColor,designVariation")
        .single();

      if (insertError || !inserted) {
        return NextResponse.json({ error: "Failed to update review page settings" }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Review page settings updated successfully",
        settings: inserted,
      });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("review_page_settings")
      .update(payload)
      .eq("restaurantId", authContext.restaurant.id)
      .select("welcomeMessage,primaryColor,secondaryColor,backgroundColor,designVariation")
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ error: "Failed to update review page settings" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Review page settings updated successfully",
      settings: updated,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update review page settings" }, { status: 500 });
  }
}
