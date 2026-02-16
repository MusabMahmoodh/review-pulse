import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdminClient();

    const [restaurantsResult, feedbackResult, subscriptionsResult] = await Promise.all([
      supabaseAdmin
        .from("restaurants")
        .select("id,name,email,phone,address,status,createdAt,updatedAt")
        .order("createdAt", { ascending: false }),
      supabaseAdmin.from("customer_feedback").select("restaurantId,overallRating"),
      supabaseAdmin
        .from("subscriptions")
        .select(
          "id,restaurantId,plan,status,startDate,endDate,monthlyPrice,defaultPrice,discount,finalPrice,amountPaid"
        )
        .eq("status", "active"),
    ]);

    if (restaurantsResult.error || feedbackResult.error || subscriptionsResult.error) {
      return NextResponse.json({ error: "Failed to fetch restaurants" }, { status: 500 });
    }

    const feedbackRows = feedbackResult.data || [];
    const subscriptions = subscriptionsResult.data || [];

    const restaurants = (restaurantsResult.data || []).map((restaurant) => {
      const restaurantFeedback = feedbackRows.filter((item) => item.restaurantId === restaurant.id);
      const feedbackCount = restaurantFeedback.length;
      const averageRating =
        feedbackCount > 0
          ? restaurantFeedback.reduce((sum, item) => sum + Number(item.overallRating || 0), 0) / feedbackCount
          : 0;

      const activeSubs = subscriptions
        .filter((sub) => sub.restaurantId === restaurant.id)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

      const subscription = activeSubs[0];

      return {
        id: restaurant.id,
        name: restaurant.name,
        email: restaurant.email,
        phone: restaurant.phone,
        address: restaurant.address,
        status: restaurant.status,
        feedbackCount,
        averageRating: Math.round(averageRating * 100) / 100,
        createdAt: restaurant.createdAt,
        updatedAt: restaurant.updatedAt,
        subscription: subscription
          ? {
              id: subscription.id,
              plan: subscription.plan,
              status: subscription.status,
              startDate: subscription.startDate,
              endDate: subscription.endDate,
              monthlyPrice: subscription.monthlyPrice,
              defaultPrice: subscription.defaultPrice,
              discount: subscription.discount,
              finalPrice: subscription.finalPrice,
              amountPaid: subscription.amountPaid,
            }
          : undefined,
      };
    });

    return NextResponse.json({ restaurants });
  } catch {
    return NextResponse.json({ error: "Failed to fetch restaurants" }, { status: 500 });
  }
}
