import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { isPremium } from "@/lib/server/subscription";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { fetchGoogleReviewsFromSerper, fetchMetaReviews } from "@/lib/server/external-reviews-sync";

type SyncResult = {
  success: boolean;
  count: number;
  error?: string;
};

function premiumRequiredResponse() {
  return NextResponse.json(
    {
      error: "Premium subscription required",
      requiresPremium: true,
    },
    { status: 403 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const hasPremium = await isPremium(authContext.restaurant.id);
    if (!hasPremium) {
      return premiumRequiredResponse();
    }

    const body = await request.json().catch(() => ({}));
    const platforms: string[] = Array.isArray(body?.platforms) ? body.platforms : ["google"];
    const placeId: string | undefined = typeof body?.placeId === "string" ? body.placeId : undefined;

    const supabaseAdmin = getSupabaseAdminClient();
    const { data: restaurants } = await supabaseAdmin
      .from("restaurants")
      .select("id")
      .eq("id", authContext.restaurant.id)
      .limit(1);

    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const results: Record<string, SyncResult> = {};

    if (platforms.includes("google")) {
      try {
        const { data: lastRows } = await supabaseAdmin
          .from("external_reviews")
          .select("syncedAt")
          .eq("restaurantId", authContext.restaurant.id)
          .eq("platform", "google")
          .order("syncedAt", { ascending: false })
          .limit(1);
        const sinceDate = lastRows?.[0]?.syncedAt ? new Date(lastRows[0].syncedAt) : undefined;
        const count = await fetchGoogleReviewsFromSerper(authContext.restaurant.id, placeId, sinceDate);
        results.google = { success: true, count };
      } catch (error: any) {
        results.google = {
          success: false,
          count: 0,
          error: error?.message || "Failed to sync Google reviews via Serper API",
        };
      }
    }

    if (platforms.includes("facebook") || platforms.includes("meta")) {
      try {
        const { data: integrationRows } = await supabaseAdmin
          .from("meta_integrations")
          .select("lastSyncedAt,status")
          .eq("restaurantId", authContext.restaurant.id)
          .limit(1);
        const integration = integrationRows?.[0];

        if (!integration || integration.status !== "active") {
          results.facebook = {
            success: false,
            count: 0,
            error: "Meta integration not connected or inactive. Please connect your Meta account first.",
          };
        } else {
          const sinceDate = integration.lastSyncedAt ? new Date(integration.lastSyncedAt) : undefined;
          const count = await fetchMetaReviews(authContext.restaurant.id, sinceDate);
          results.facebook = { success: true, count };
        }
      } catch (error: any) {
        results.facebook = {
          success: false,
          count: 0,
          error: error?.message || "Failed to sync Meta reviews",
        };
      }
    }

    const hasSuccess = Object.values(results).some((result) => result.success);
    const totalSynced = Object.values(results).reduce((sum, result) => sum + result.count, 0);

    return NextResponse.json({
      success: hasSuccess,
      results,
      totalSynced,
      syncedAt: new Date(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to sync reviews" }, { status: 500 });
  }
}
