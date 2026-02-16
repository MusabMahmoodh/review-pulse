import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const cancelSchema = z.object({
  subscriptionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = cancelSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Subscription ID required" }, { status: 400 });
    }

    const { subscriptionId } = parsed.data;
    const supabaseAdmin = getSupabaseAdminClient();

    const { data: existingRows, error: fetchError } = await supabaseAdmin
      .from("subscriptions")
      .select("id,restaurantId,plan,status")
      .eq("id", subscriptionId)
      .limit(1);

    if (fetchError) {
      return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
    }

    const existing = existingRows?.[0];
    if (!existing) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    if (existing.status === "cancelled") {
      return NextResponse.json({ error: "Subscription is already cancelled" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("id", subscriptionId)
      .select("id,restaurantId,plan,status")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscription: data,
      message: "Subscription cancelled successfully",
    });
  } catch {
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
