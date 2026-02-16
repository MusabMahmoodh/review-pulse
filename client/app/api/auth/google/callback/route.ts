import { type NextRequest, NextResponse } from "next/server";

/**
 * Google OAuth Callback Handler
 * 
 * This route receives Google OAuth callback responses and redirects users back to settings.
 * Google OAuth token exchange is not implemented in-app yet.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const error = searchParams.get("error");
    const clientUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    // Handle OAuth errors from Google
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(new URL(`/dashboard/settings?google_error=${encodeURIComponent(error)}`, clientUrl));
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(new URL("/dashboard/settings?google_error=missing_params", clientUrl));
    }

    return NextResponse.redirect(new URL("/dashboard/settings?google_error=not_implemented", clientUrl));
  } catch (error) {
    console.error("[Google OAuth Callback] Error:", error);
    const clientUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    return NextResponse.redirect(new URL("/dashboard/settings?google_error=unknown", clientUrl));
  }
}

