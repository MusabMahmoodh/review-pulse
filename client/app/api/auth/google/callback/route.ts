import { type NextRequest, NextResponse } from "next/server";

/**
 * Google OAuth Callback Handler
 * 
 * This route receives the OAuth callback from Google and forwards it to the backend server.
 * The backend handles the token exchange and stores the integration data.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors from Google
    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings?google_error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL(
          "/dashboard/settings?google_error=missing_params",
          request.url
        )
      );
    }

    // Get backend server URL from environment or use default
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    
    // Forward the callback to the backend server with format=json to get JSON response
    const backendCallbackUrl = new URL("/api/auth/google/callback", backendUrl);
    backendCallbackUrl.searchParams.set("code", code);
    backendCallbackUrl.searchParams.set("state", state);
    backendCallbackUrl.searchParams.set("format", "json");

    // Make request to backend
    const response = await fetch(backendCallbackUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Backend returned an error
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings?google_error=${encodeURIComponent(data.error || "unknown")}`,
          request.url
        )
      );
    }

    // Success - redirect to dashboard with success message
    return NextResponse.redirect(
      new URL(
        "/dashboard/settings?google_connected=true",
        request.url
      )
    );
  } catch (error) {
    console.error("[Google OAuth Callback] Error:", error);
    return NextResponse.redirect(
      new URL(
        "/dashboard/settings?google_error=unknown",
        request.url
      )
    );
  }
}

