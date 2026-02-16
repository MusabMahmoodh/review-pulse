import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const submitSchema = z.object({
  restaurantId: z.string().min(1),
  customerName: z.string().optional(),
  customerContact: z.string().optional(),
  foodRating: z.number().min(1).max(5),
  staffRating: z.number().min(1).max(5),
  ambienceRating: z.number().min(1).max(5),
  overallRating: z.number().min(1).max(5),
  suggestions: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = submitSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const {
      restaurantId,
      customerName,
      customerContact,
      foodRating,
      staffRating,
      ambienceRating,
      overallRating,
      suggestions,
    } = parsed.data;

    const supabaseAdmin = getSupabaseAdminClient();
    const { data: restaurantRows, error: restaurantError } = await supabaseAdmin
      .from("restaurants")
      .select("id")
      .eq("id", restaurantId)
      .limit(1);

    if (restaurantError) {
      return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
    }

    if (!restaurantRows || restaurantRows.length === 0) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const { error: insertError } = await supabaseAdmin.from("customer_feedback").insert({
      id: feedbackId,
      restaurantId,
      customerName: customerName || null,
      customerContact: customerContact || null,
      foodRating,
      staffRating,
      ambienceRating,
      overallRating,
      suggestions: suggestions || null,
    });

    if (insertError) {
      return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Feedback submitted successfully",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
