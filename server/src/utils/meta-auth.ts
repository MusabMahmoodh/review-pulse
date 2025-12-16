import { AppDataSource } from "../data-source";
import { MetaIntegration } from "../models/MetaIntegration";
import { decrypt, encrypt } from "./encryption";

/**
 * Gets a valid access token for a restaurant's Meta integration.
 * Automatically refreshes the token if it's expired or about to expire.
 * 
 * Note: Meta Page Access Tokens are long-lived (60 days) and can be extended.
 * User Access Tokens are short-lived (1-2 hours) and need to be exchanged for Page tokens.
 */
export async function getValidAccessToken(restaurantId: string): Promise<string> {
  const integrationRepo = AppDataSource.getRepository(MetaIntegration);
  const integration = await integrationRepo.findOne({ where: { restaurantId } });

  if (!integration) {
    throw new Error("Meta integration not found");
  }

  if (integration.status !== "active") {
    throw new Error(`Meta integration is ${integration.status}`);
  }

  // Check if token is expired (with 5 minute buffer)
  const now = new Date();
  const bufferTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

  if (integration.tokenExpiry < bufferTime) {
    // Token expired or about to expire, try to extend it
    try {
      const accessToken = decrypt(integration.accessToken);
      
      // Meta allows extending long-lived Page Access Tokens
      // Endpoint: GET /{page-id}?fields=access_token&access_token={short-lived-token}
      // But for Page tokens, we need to use the debug_token endpoint to check validity
      // and potentially exchange user token for new page token
      
      // First, check if token is still valid
      const debugResponse = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`
      );

      const debugData = await debugResponse.json();

      if (debugData.data?.is_valid) {
        // Token is still valid, just update expiry if we got new expiry info
        if (debugData.data?.expires_at) {
          integration.tokenExpiry = new Date(debugData.data.expires_at * 1000);
          await integrationRepo.save(integration);
        }
        return accessToken;
      }

      // Token is invalid, try to exchange user token for new page token
      if (integration.userAccessToken) {
        const userToken = decrypt(integration.userAccessToken);
        
        // Exchange user token for page token
        const pageTokenResponse = await fetch(
          `https://graph.facebook.com/${integration.pageId}?fields=access_token&access_token=${userToken}`
        );

        const pageTokenData = await pageTokenResponse.json();

        if (pageTokenData.access_token) {
          // Get long-lived page token
          const longLivedResponse = await fetch(
            `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${pageTokenData.access_token}`
          );

          const longLivedData = await longLivedResponse.json();

          if (longLivedData.access_token) {
            // Update tokens
            integration.accessToken = encrypt(longLivedData.access_token);
            integration.tokenExpiry = new Date(
              now.getTime() + (longLivedData.expires_in || 5184000) * 1000 // Default 60 days
            );
            
            await integrationRepo.save(integration);
            return longLivedData.access_token;
          }
        }
      }

      // If we can't refresh, mark as expired
      integration.status = "expired";
      await integrationRepo.save(integration);
      throw new Error("Failed to refresh token. Please re-authorize your Meta account.");
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

/**
 * Exchanges a short-lived user access token for a long-lived page access token
 */
export async function exchangeForPageToken(
  userAccessToken: string,
  pageId: string
): Promise<{ accessToken: string; expiresIn: number }> {
  // First, get page access token from user token
  const pageTokenResponse = await fetch(
    `https://graph.facebook.com/${pageId}?fields=access_token&access_token=${userAccessToken}`
  );

  const pageTokenData = await pageTokenResponse.json();

  if (!pageTokenData.access_token) {
    throw new Error("Failed to get page access token");
  }

  // Exchange for long-lived token (60 days)
  const longLivedResponse = await fetch(
    `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&fb_exchange_token=${pageTokenData.access_token}`
  );

  const longLivedData = await longLivedResponse.json();

  if (!longLivedData.access_token) {
    throw new Error("Failed to get long-lived page access token");
  }

  return {
    accessToken: longLivedData.access_token,
    expiresIn: longLivedData.expires_in || 5184000, // 60 days in seconds
  };
}


