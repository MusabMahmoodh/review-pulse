import { AppDataSource } from "../data-source";
import { GoogleIntegration } from "../models/GoogleIntegration";
import { decrypt, encrypt } from "./encryption";

/**
 * Gets a valid access token for a restaurant's Google integration.
 * Automatically refreshes the token if it's expired or about to expire.
 */
export async function getValidAccessToken(restaurantId: string): Promise<string> {
  const integrationRepo = AppDataSource.getRepository(GoogleIntegration);
  const integration = await integrationRepo.findOne({ where: { restaurantId } });

  if (!integration) {
    throw new Error("Google integration not found");
  }

  if (integration.status !== "active") {
    throw new Error(`Google integration is ${integration.status}`);
  }

  // Check if token is expired (with 5 minute buffer)
  const now = new Date();
  const bufferTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

  if (integration.tokenExpiry < bufferTime) {
    // Token expired or about to expire, refresh it
    try {
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: decrypt(integration.refreshToken),
          grant_type: "refresh_token",
        }),
      });

      const tokens = await refreshResponse.json();

      if (!tokens.access_token) {
        // Refresh token is invalid or expired
        integration.status = "expired";
        await integrationRepo.save(integration);
        throw new Error("Failed to refresh token. Please re-authorize your Google account.");
      }

      // Update access token and expiry
      integration.accessToken = encrypt(tokens.access_token);
      integration.tokenExpiry = new Date(
        now.getTime() + (tokens.expires_in || 3600) * 1000
      );
      
      // If a new refresh token is provided, update it (rare but possible)
      if (tokens.refresh_token) {
        integration.refreshToken = encrypt(tokens.refresh_token);
      }
      
      await integrationRepo.save(integration);

      return tokens.access_token;
    } catch (error) {
      console.error("Token refresh error:", error);
      integration.status = "expired";
      await integrationRepo.save(integration);
      throw error;
    }
  }

  // Token is still valid
  return decrypt(integration.accessToken);
}


