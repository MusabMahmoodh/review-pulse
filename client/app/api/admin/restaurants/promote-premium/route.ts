import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const promoteSchema = z.object({
  restaurantId: z.string().min(1),
  months: z.number().nullable().optional(),
  discount: z.number().optional(),
  amountPaid: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = promoteSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Restaurant ID required" }, { status: 400 });
    }

    const { restaurantId, months, discount, amountPaid } = parsed.data;
    const supabaseAdmin = getSupabaseAdminClient();

    const { data: restaurantRows, error: restaurantError } = await supabaseAdmin
      .from("restaurants")
      .select("id")
      .eq("id", restaurantId)
      .limit(1);

    if (restaurantError) {
      return NextResponse.json({ error: "Failed to promote restaurant to premium" }, { status: 500 });
    }

    if (!restaurantRows || restaurantRows.length === 0) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled" })
      .eq("restaurantId", restaurantId)
      .eq("status", "active");

    const DEFAULT_PRICE = 15000;
    const numMonths = months && months > 0 ? months : null;
    const totalMonths = numMonths || 1;
    const totalPrice = DEFAULT_PRICE * totalMonths;
    const discountAmount = discount || 0;
    const finalPrice = totalPrice - discountAmount;
    const paidAmount = amountPaid !== undefined && amountPaid !== null ? amountPaid : finalPrice;

    const startDate = new Date();
    let endDate: Date | null = null;
    if (numMonths !== null && numMonths > 0) {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + numMonths);
    }

    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const { data: subscription, error: insertError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        id: subscriptionId,
        restaurantId,
        plan: "premium",
        status: "active",
        startDate: startDate.toISOString(),
        endDate: endDate ? endDate.toISOString() : null,
        monthlyPrice: DEFAULT_PRICE,
        defaultPrice: DEFAULT_PRICE,
        discount: discountAmount > 0 ? discountAmount : null,
        finalPrice,
        amountPaid: paidAmount,
      })
      .select("id,restaurantId,plan,status,startDate,endDate,monthlyPrice,defaultPrice,discount,finalPrice,amountPaid")
      .single();

    if (insertError || !subscription) {
      return NextResponse.json({ error: "Failed to promote restaurant to premium" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        restaurantId: subscription.restaurantId,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate || null,
        monthlyPrice: subscription.monthlyPrice,
        defaultPrice: subscription.defaultPrice,
        discount: subscription.discount || null,
        finalPrice: subscription.finalPrice,
        amountPaid: subscription.amountPaid || null,
      },
      message: numMonths ? `Premium enabled for ${numMonths} months` : "Premium enabled forever",
    });
  } catch {
    return NextResponse.json({ error: "Failed to promote restaurant to premium" }, { status: 500 });
  }
}
