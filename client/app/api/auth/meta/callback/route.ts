import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/server/encryption";

function isJsonRequest(request: NextRequest): boolean {
  return (
    request.headers.get("content-type")?.includes("application/json") ||
    new URL(request.url).searchParams.get("format") === "json"
  );
}

function getClientUrl(request: NextRequest): string {
  return process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

/**
 * Meta OAuth Callback Handler
 * 
 * This route receives the OAuth callback from Meta (Facebook), exchanges the auth code,
 * and stores encrypted integration tokens directly via Supabase.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const clientUrl = getClientUrl(request);

    // Handle OAuth errors from Meta
    if (error) {
      console.error("Meta OAuth error:", error);
      return NextResponse.redirect(new URL(`/dashboard/settings?meta_error=${encodeURIComponent(error)}`, clientUrl));
    }

    if (!code || !state) {
      if (isJsonRequest(request)) {
        return NextResponse.json({ error: "Missing authorization code or restaurant ID" }, { status: 400 });
      }
      return NextResponse.redirect(new URL("/dashboard/settings?meta_error=missing_params", clientUrl));
    }

    const appId = getRequiredEnv("META_APP_ID");
    const appSecret = getRequiredEnv("META_APP_SECRET");
    const redirectUri = getRequiredEnv("META_REDIRECT_URI");

    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      if (isJsonRequest(request)) {
        return NextResponse.json({ error: "Failed to get access token from Meta" }, { status: 400 });
      }
      return NextResponse.redirect(new URL("/dashboard/settings?meta_error=token_exchange_failed", clientUrl));
    }

    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${encodeURIComponent(tokenData.access_token)}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok || !Array.isArray(pagesData.data) || pagesData.data.length === 0) {
      if (isJsonRequest(request)) {
        return NextResponse.json({ error: "No Facebook pages found. Please create a page first." }, { status: 400 });
      }
      return NextResponse.redirect(new URL("/dashboard/settings?meta_error=no_pages", clientUrl));
    }

    const selectedPage = pagesData.data[0];
    const pageId: string | undefined = selectedPage?.id;
    const pageAccessToken: string | undefined = selectedPage?.access_token;

    if (!pageId || !pageAccessToken) {
      if (isJsonRequest(request)) {
        return NextResponse.json({ error: "Failed to get page access token from Meta" }, { status: 400 });
      }
      return NextResponse.redirect(new URL("/dashboard/settings?meta_error=token_exchange_failed", clientUrl));
    }

    let instagramBusinessAccountId: string | null = null;
    try {
      const instagramResponse = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(pageAccessToken)}`
      );
      const instagramData = await instagramResponse.json();
      instagramBusinessAccountId = instagramData?.instagram_business_account?.id || null;
    } catch {
      instagramBusinessAccountId = null;
    }

    const tokenExpiry = new Date();
    const expiresIn = Number(tokenData.expires_in || 0);
    if (Number.isFinite(expiresIn) && expiresIn > 0) {
      tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expiresIn);
    } else {
      tokenExpiry.setDate(tokenExpiry.getDate() + 60);
    }

    const supabaseAdmin = getSupabaseAdminClient();

    const payload = {
      restaurantId: state,
      pageId,
      instagramBusinessAccountId,
      accessToken: encrypt(pageAccessToken),
      userAccessToken: encrypt(tokenData.access_token),
      tokenExpiry: tokenExpiry.toISOString(),
      status: "active",
    };

    const { data: existingRows } = await supabaseAdmin
      .from("meta_integrations")
      .select("restaurantId")
      .eq("restaurantId", state)
      .limit(1);

    const exists = !!existingRows && existingRows.length > 0;
    if (exists) {
      await supabaseAdmin.from("meta_integrations").update(payload).eq("restaurantId", state);
    } else {
      await supabaseAdmin.from("meta_integrations").insert(payload);
    }

    if (isJsonRequest(request)) {
      return NextResponse.json({
        success: true,
        message: "Meta account connected successfully",
        restaurantId: state,
        pageId,
        instagramBusinessAccountId,
      });
    }

    return NextResponse.redirect(new URL("/dashboard/settings?meta_connected=true", clientUrl));
  } catch (error) {
    console.error("[Meta OAuth Callback] Error:", error);
    const clientUrl = getClientUrl(request);
    if (isJsonRequest(request)) {
      return NextResponse.json(
        {
          error: "Failed to connect Meta account",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
    return NextResponse.redirect(new URL("/dashboard/settings?meta_error=unknown", clientUrl));
  }
}








