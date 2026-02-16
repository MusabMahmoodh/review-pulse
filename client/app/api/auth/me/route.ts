import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { getActiveSubscription } from "@/lib/server/subscription";

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const subscription = await getActiveSubscription(authContext.restaurant.id);

    return NextResponse.json({
      success: true,
      restaurant: {
        id: authContext.restaurant.id,
        name: authContext.restaurant.name,
        email: authContext.restaurant.email,
        subscription: subscription
          ? {
              id: subscription.id,
              plan: subscription.plan,
              status: subscription.status,
              startDate: subscription.startDate,
              endDate: subscription.endDate,
              monthlyPrice: subscription.monthlyPrice,
            }
          : null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch current user" }, { status: 500 });
  }
}
