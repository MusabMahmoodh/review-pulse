import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { isPremium } from "@/lib/server/subscription";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

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

    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("meta_integrations")
      .select("status,lastSyncedAt,pageId,instagramBusinessAccountId")
      .eq("restaurantId", authContext.restaurant.id)
      .limit(1);

    if (error) {
      return NextResponse.json({ error: "Failed to fetch integration status" }, { status: 500 });
    }

    const integration = data?.[0];
    if (!integration) {
      return NextResponse.json({
        connected: false,
        status: null,
        lastSyncedAt: null,
        pageId: null,
        instagramBusinessAccountId: null,
      });
    }

    return NextResponse.json({
      connected: true,
      status: integration.status,
      lastSyncedAt: integration.lastSyncedAt || null,
      pageId: integration.pageId || null,
      instagramBusinessAccountId: integration.instagramBusinessAccountId || null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch integration status" }, { status: 500 });
  }
}
