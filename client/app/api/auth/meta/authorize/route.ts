import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId");

    if (!restaurantId) {
      return NextResponse.json({ error: "Missing restaurantId" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const { data: restaurantRows, error } = await supabaseAdmin
      .from("restaurants")
      .select("id")
      .eq("id", restaurantId)
      .limit(1);

    if (error || !restaurantRows || restaurantRows.length === 0) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const appId = getRequiredEnv("META_APP_ID");
    const redirectUri = getRequiredEnv("META_REDIRECT_URI");
    const scopes = process.env.META_OAUTH_SCOPES || "pages_show_list,pages_read_engagement";

    const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
    authUrl.searchParams.set("client_id", appId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", restaurantId);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Meta OAuth authorization error:", error);
    return NextResponse.json({ error: "Failed to initiate authorization" }, { status: 500 });
  }
}
