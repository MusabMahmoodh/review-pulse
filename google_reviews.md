# Google Reviews Integration Guide

## Overview

This document outlines the step-by-step process to integrate Google Reviews into Review Pulse. The integration requires OAuth 2.0 authorization to access **Google Business Profile APIs** (formerly Google My Business API), which allows restaurants to sync their Google reviews automatically.

**Important:** Google Business Profile APIs require **access approval** and are not available to all users. You must request access before using these APIs. See [Prerequisites](#prerequisites) below.

## How It Works - Quick Summary

**Yes, this will get reviews from the relevant authorized restaurants!** Here's the simple flow:

### User Flow (Restaurant Owner Perspective)

1. **Restaurant owner logs into Review Pulse dashboard**
2. **Clicks "Connect Google" button** in settings
3. **Gets redirected to Google OAuth consent screen** (one-time authorization)
4. **Clicks "Allow"** to grant permission
5. **Gets redirected back** to Review Pulse
6. **Done!** Reviews automatically sync from their Google Business Profile

### What Happens Behind the Scenes

- ✅ **Each restaurant authorizes their own Google account** - They use the Google account that manages their business
- ✅ **We get access to THEIR business location** - Google API returns the business location(s) associated with their account
- ✅ **We fetch reviews from THEIR restaurant** - Reviews are specific to their Google Business Profile location
- ✅ **One-time authorization** - After the initial consent, we store refresh tokens to keep syncing automatically
- ✅ **Automatic sync** - Reviews sync every 24 hours (or manually on-demand)

### Key Points

- **One consent screen = Done** - Restaurant owners only need to authorize once
- **Reviews are restaurant-specific** - Each restaurant only sees reviews for their own business
- **Secure & Private** - Each restaurant's authorization is separate and encrypted
- **No manual work** - After authorization, everything is automatic

### Example Scenario

1. **Restaurant A** (Joe's Pizza) connects their Google account → Gets reviews for "Joe's Pizza" location
2. **Restaurant B** (Maria's Cafe) connects their Google account → Gets reviews for "Maria's Cafe" location
3. Each restaurant only sees their own reviews in their dashboard

## Table of Contents

1. [How It Works - Quick Summary](#how-it-works---quick-summary)
2. [FAQ - Common Questions](#faq---common-questions)
3. [Why OAuth Authorization is Required](#why-oauth-authorization-is-required)
4. [Prerequisites](#prerequisites)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Database Schema Changes](#database-schema-changes)
7. [OAuth Flow Implementation](#oauth-flow-implementation)
8. [API Integration](#api-integration)
9. [Incremental Sync Strategy](#incremental-sync-strategy)
10. [Error Handling & Token Refresh](#error-handling--token-refresh)
11. [Testing](#testing)
12. [Security Considerations](#security-considerations)

---

## FAQ - Common Questions

### Q: Will this get reviews from the relevant authorized restaurants?

**A: Yes!** Each restaurant owner authorizes their own Google account, and we fetch reviews specifically from their Google Business Profile location. Restaurant A's reviews are completely separate from Restaurant B's reviews.

### Q: Do they just need to authorize through the consent screen?

**A: Yes, that's it!** The flow is:
1. Restaurant owner clicks "Connect Google" button
2. Google OAuth consent screen appears (one-time)
3. They click "Allow"
4. Done! Reviews automatically sync from their business

### Q: Do they need to do this every time?

**A: No!** After the initial authorization:
- We store refresh tokens securely
- Reviews sync automatically every 24 hours
- They can also manually trigger a sync anytime
- They only need to re-authorize if they revoke access or tokens expire

### Q: What if a restaurant has multiple locations?

**A: We can handle this!** The API returns all locations for their account. Options:
- Use the first location (simplest)
- Show a location selector UI (better UX)
- Allow connecting multiple locations as separate "restaurants" in your system

### Q: Can one restaurant see another restaurant's reviews?

**A: No, absolutely not!** Each restaurant's authorization is:
- Stored separately in the database
- Linked to their specific `restaurantId`
- Encrypted and secure
- Only accessible by that restaurant's account

---

## Why OAuth Authorization is Required

**Yes, users must authorize their Google accounts** to fetch reviews. Here's why:

- Google Business Profile API requires OAuth 2.0 authentication
- Each restaurant owner must grant permission to access their business profile data
- This ensures data privacy and security - only authorized users can access their own reviews
- The API provides access to:
  - All reviews for their business location
  - Review metadata (ratings, comments, timestamps, reviewer info)
  - Ability to respond to reviews (future feature)

**Alternative approaches considered:**
- Google Places API (Text Search) - Only provides public reviews but limited data and requires Place ID
- Web scraping - Violates Google's Terms of Service and unreliable
- **Conclusion:** OAuth with Google Business Profile API is the official, reliable, and compliant method

---

## Prerequisites

### 1. Request API Access

**IMPORTANT:** Google Business Profile APIs require approval and are not available to all users. You must:

1. **Request Access**
   - Visit: https://developers.google.com/my-business/content/overview
   - Click on the access request link
   - Provide:
     - Valid Google Account
     - Valid business reason for API access
     - Valid Google Cloud project
     - Valid business website URL
   - Wait for Google's approval (this can take time)

2. **Eligibility Requirements**
   - Must have a valid Google Account
   - Must have a legitimate business purpose
   - Must have a Google Cloud project
   - Must provide a valid business website URL

### 2. Google Cloud Project Setup

1. **Create/Select Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Note the Project ID

2. **Enable Required APIs**
   - Navigate to **APIs & Services > Library**
   - Enable the following APIs:
     - **My Business Business Information API** - For managing locations and business information
     - **Google Business Profile API** - For accessing reviews and other business data
   - Note: These APIs may only be available after your access request is approved

3. **Configure OAuth Consent Screen**
   - Go to **APIs & Services > OAuth consent screen**
   - Choose **External** (for public use) or **Internal** (for Google Workspace only)
   - Fill in required fields:
     - App name: "Review Pulse"
     - User support email: Your support email
     - Developer contact: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/business.manage` (required for reviews)
   - Add test users (if in testing mode) or publish the app

4. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: "Review Pulse Web Client"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (development)
     - `https://yourdomain.com/api/auth/google/callback` (production)
   - Save **Client ID** and **Client Secret** (keep secret secure!)

### 2. Environment Variables

Add to `server/.env`:
```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

---

## Step-by-Step Implementation

### Phase 1: Database Schema Changes

#### 1.1 Create Migration for Google OAuth Storage

We need to store:
- Google account ID (to identify the business account)
- Access token (for API calls)
- Refresh token (to get new access tokens)
- Token expiry time
- Last sync timestamp (for incremental sync)
- Google Place ID or Location ID (optional, for faster lookups)

**New Model: `GoogleIntegration`**

```typescript
@Entity("google_integrations")
export class GoogleIntegration {
  @PrimaryColumn()
  restaurantId!: string;

  @Column()
  googleAccountId!: string; // The Google account that owns the business

  @Column()
  locationId!: string; // Google Business Profile location ID

  @Column({ type: "text" })
  accessToken!: string; // Encrypted

  @Column({ type: "text" })
  refreshToken!: string; // Encrypted

  @Column()
  tokenExpiry!: Date;

  @Column({ nullable: true })
  lastSyncedAt?: Date; // For incremental sync

  @Column({ default: "active" })
  status!: "active" | "expired" | "revoked";

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Restaurant, (restaurant) => restaurant.googleIntegration)
  @JoinColumn({ name: "restaurantId" })
  restaurant!: Restaurant;
}
```

**Update Restaurant Model:**
```typescript
@OneToOne(() => GoogleIntegration, (integration) => integration.restaurant)
googleIntegration?: GoogleIntegration;
```

#### 1.2 Add Google Place ID to Restaurant (Optional)

If restaurants provide their Google Place ID, we can use it for faster lookups:
```typescript
@Column({ nullable: true })
googlePlaceId?: string;
```

---

### Phase 2: OAuth Flow Implementation

**How We Link Restaurants to Their Reviews:**

When a restaurant owner authorizes their Google account:
1. We get their **Google Business Profile account** (the account that manages their business)
2. We fetch their **business location(s)** from that account
3. We store the **location ID** linked to their **restaurant ID** in our database
4. When syncing reviews, we use the stored **location ID** to fetch reviews for **that specific restaurant only**

**Important:** Each restaurant's authorization is independent. Restaurant A's authorization only gives us access to Restaurant A's Google Business Profile, not Restaurant B's.

#### 2.1 OAuth Authorization Endpoint

**Route: `GET /api/auth/google/authorize`**

This endpoint initiates the OAuth flow:

```typescript
// server/src/routes/auth.ts (or new google-auth.ts)

router.get("/google/authorize", async (req, res) => {
  const { restaurantId } = req.query;
  
  if (!restaurantId) {
    return res.status(400).json({ error: "Restaurant ID required" });
  }

  // Verify restaurant exists and user is authenticated
  // ... authentication check ...

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  authUrl.searchParams.set("redirect_uri", process.env.GOOGLE_REDIRECT_URI!);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/business.manage");
  authUrl.searchParams.set("access_type", "offline"); // Required for refresh token
  authUrl.searchParams.set("prompt", "consent"); // Force consent to get refresh token
  authUrl.searchParams.set("state", restaurantId); // Pass restaurant ID in state

  res.redirect(authUrl.toString());
});
```

#### 2.2 OAuth Callback Handler

**Route: `GET /api/auth/google/callback`**

This handles the callback from Google:

```typescript
router.get("/google/callback", async (req, res) => {
  const { code, state } = req.query;
  const restaurantId = state as string;

  if (!code || !restaurantId) {
    return res.status(400).json({ error: "Missing authorization code or restaurant ID" });
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Failed to obtain tokens");
    }

    // 2. Get user's business account info
    const accountResponse = await fetch(
      "https://mybusiness.googleapis.com/v4/accounts",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    const accounts = await accountResponse.json();
    const account = accounts.accounts?.[0];
    
    if (!account) {
      throw new Error("No business account found");
    }

    // 3. Get locations for this account
    // This returns the business location(s) associated with the authorized Google account
    // Each restaurant owner will only see locations from their own Google Business Profile
    const locationsResponse = await fetch(
      `https://mybusiness.googleapis.com/v4/${account.name}/locations`,
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    const locations = await locationsResponse.json();
    const location = locations.locations?.[0]; // Or let user select if multiple locations
    
    // If restaurant has multiple locations, you could show a selection UI
    // For now, we use the first location (most common case: one restaurant = one location)

    if (!location) {
      throw new Error("No business location found. Please ensure your Google Business Profile has at least one location.");
    }

    // 4. Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = encrypt(tokens.refresh_token);

    // 5. Calculate token expiry
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + (tokens.expires_in || 3600));

    // 6. Save or update integration
    const integrationRepo = AppDataSource.getRepository(GoogleIntegration);
    
    await integrationRepo.upsert(
      {
        restaurantId,
        googleAccountId: account.name,
        locationId: location.name,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry,
        status: "active",
      },
      ["restaurantId"]
    );

    // 7. Redirect to success page or return success
    res.redirect(`${process.env.CLIENT_URL}/dashboard/settings?google_connected=true`);
    
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.redirect(`${process.env.CLIENT_URL}/dashboard/settings?google_error=true`);
  }
});
```

#### 2.3 Token Encryption Utility

Create `server/src/utils/encryption.ts`:

```typescript
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // 32-byte key
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
```

Add to `.env`:
```env
ENCRYPTION_KEY=your_32_byte_hex_key_here # Generate with: openssl rand -hex 32
```

---

### Phase 3: Google Reviews API Integration

#### 3.1 Token Refresh Utility

Create `server/src/utils/google-auth.ts`:

```typescript
import { AppDataSource } from "../data-source";
import { GoogleIntegration } from "../models/GoogleIntegration";
import { decrypt, encrypt } from "./encryption";

export async function getValidAccessToken(restaurantId: string): Promise<string> {
  const integrationRepo = AppDataSource.getRepository(GoogleIntegration);
  const integration = await integrationRepo.findOne({ where: { restaurantId } });

  if (!integration) {
    throw new Error("Google integration not found");
  }

  // Check if token is expired (with 5 minute buffer)
  const now = new Date();
  const bufferTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

  if (integration.tokenExpiry < bufferTime) {
    // Token expired or about to expire, refresh it
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
      integration.status = "expired";
      await integrationRepo.save(integration);
      throw new Error("Failed to refresh token");
    }

    // Update access token and expiry
    integration.accessToken = encrypt(tokens.access_token);
    integration.tokenExpiry = new Date(
      now.getTime() + (tokens.expires_in || 3600) * 1000
    );
    await integrationRepo.save(integration);

    return tokens.access_token;
  }

  // Token is still valid
  return decrypt(integration.accessToken);
}
```

#### 3.2 Fetch Reviews Function

Create `server/src/utils/google-reviews.ts`:

```typescript
import { AppDataSource } from "../data-source";
import { ExternalReview } from "../models/ExternalReview";
import { GoogleIntegration } from "../models/GoogleIntegration";
import { getValidAccessToken } from "./google-auth";

export async function fetchGoogleReviews(
  restaurantId: string,
  sinceDate?: Date
): Promise<number> {
  const integrationRepo = AppDataSource.getRepository(GoogleIntegration);
  const reviewRepo = AppDataSource.getRepository(ExternalReview);

  const integration = await integrationRepo.findOne({ where: { restaurantId } });

  if (!integration || integration.status !== "active") {
    throw new Error("Google integration not active");
  }

  const accessToken = await getValidAccessToken(restaurantId);

  // Build API URL
  const url = new URL(
    `https://mybusiness.googleapis.com/v4/${integration.locationId}/reviews`
  );

  // Add filter for reviews updated since last sync
  if (sinceDate) {
    // Format: YYYY-MM-DDTHH:mm:ss.sssZ
    url.searchParams.set(
      "updateTime",
      sinceDate.toISOString()
    );
  }

  // Fetch reviews
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token invalid, mark as expired
      integration.status = "expired";
      await integrationRepo.save(integration);
    }
    throw new Error(`Google API error: ${response.statusText}`);
  }

  const data = await response.json();
  const reviews = data.reviews || [];

  let syncedCount = 0;

  // Process and store reviews
  for (const review of reviews) {
    // Check if review already exists (by review ID)
    const existingReview = await reviewRepo.findOne({
      where: {
        id: review.reviewId,
        restaurantId,
        platform: "google",
      },
    });

    if (existingReview) {
      // Update existing review if it changed
      existingReview.rating = review.starRating === "FIVE" ? 5 :
                              review.starRating === "FOUR" ? 4 :
                              review.starRating === "THREE" ? 3 :
                              review.starRating === "TWO" ? 2 : 1;
      existingReview.comment = review.comment || "";
      existingReview.author = review.reviewer?.displayName || "Anonymous";
      existingReview.reviewDate = new Date(review.createTime);
      existingReview.syncedAt = new Date();

      await reviewRepo.save(existingReview);
    } else {
      // Create new review
      const newReview = reviewRepo.create({
        id: review.reviewId,
        restaurantId,
        platform: "google",
        rating: review.starRating === "FIVE" ? 5 :
                review.starRating === "FOUR" ? 4 :
                review.starRating === "THREE" ? 3 :
                review.starRating === "TWO" ? 2 : 1,
        comment: review.comment || "",
        author: review.reviewer?.displayName || "Anonymous",
        reviewDate: new Date(review.createTime),
        syncedAt: new Date(),
      });

      await reviewRepo.save(newReview);
      syncedCount++;
    }
  }

  // Update last sync time
  integration.lastSyncedAt = new Date();
  await integrationRepo.save(integration);

  return syncedCount;
}
```

#### 3.3 Update Sync Endpoint

Update `server/src/routes/external-reviews.ts`:

```typescript
import { fetchGoogleReviews } from "../utils/google-reviews";

router.post("/sync", async (req, res) => {
  try {
    const { restaurantId, platforms } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const integrationRepo = AppDataSource.getRepository(GoogleIntegration);

    const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const platformsToSync = platforms || ["google"];
    const results: Record<string, { success: boolean; count: number; error?: string }> = {};

    // Sync Google Reviews
    if (platformsToSync.includes("google")) {
      try {
        const integration = await integrationRepo.findOne({ where: { restaurantId } });
        
        if (!integration || integration.status !== "active") {
          results.google = {
            success: false,
            count: 0,
            error: "Google integration not connected or inactive",
          };
        } else {
          // Get last sync time for incremental sync
          const sinceDate = integration.lastSyncedAt || undefined;
          const count = await fetchGoogleReviews(restaurantId, sinceDate);
          
          results.google = {
            success: true,
            count,
          };
        }
      } catch (error: any) {
        results.google = {
          success: false,
          count: 0,
          error: error.message,
        };
      }
    }

    // TODO: Add Facebook and Instagram sync here

    return res.json({
      success: true,
      results,
      syncedAt: new Date(),
    });
  } catch (error) {
    console.error("Error syncing external reviews:", error);
    return res.status(500).json({ error: "Failed to sync reviews" });
  }
});
```

---

## Incremental Sync Strategy

### How It Works

1. **First Sync**: Fetch all reviews (no `sinceDate` parameter)
2. **Subsequent Syncs**: Only fetch reviews updated since `lastSyncedAt`
3. **Update Logic**: 
   - If review ID exists → Update if changed
   - If review ID doesn't exist → Create new
4. **Sync Frequency**: 
   - Manual sync: User clicks "Sync Now"
   - Automated sync: Cron job every 24 hours (to be implemented)

### Implementation Notes

- Google API supports `updateTime` filter parameter
- Store `lastSyncedAt` in `GoogleIntegration` table
- Handle edge cases:
  - Reviews deleted on Google (keep in DB but mark as deleted?)
  - Reviews edited (update existing record)
  - Network failures (retry logic)

---

## Error Handling & Token Refresh

### Token Expiry Handling

1. **Proactive Refresh**: Check token expiry before API calls (5-minute buffer)
2. **Reactive Refresh**: If API returns 401, refresh token and retry
3. **User Notification**: If refresh fails, notify user to re-authorize

### Error Scenarios

| Error | Handling |
|-------|----------|
| Token expired | Auto-refresh using refresh token |
| Refresh token invalid | Mark integration as expired, require re-auth |
| API rate limit | Implement exponential backoff |
| Network error | Retry with backoff, log error |
| No reviews found | Return success with count 0 |

---

## Testing

### 1. OAuth Flow Testing

1. Start server: `npm run dev`
2. Navigate to: `http://localhost:3000/api/auth/google/authorize?restaurantId=test-id`
3. Complete Google OAuth consent
4. Verify redirect to callback
5. Check database for `GoogleIntegration` record

### 2. Reviews Sync Testing

```bash
# Test sync endpoint
curl -X POST http://localhost:3000/api/external-reviews/sync \
  -H "Content-Type: application/json" \
  -d '{"restaurantId": "test-id", "platforms": ["google"]}'
```

### 3. Incremental Sync Testing

1. Perform initial sync
2. Wait a few minutes
3. Perform second sync
4. Verify only new/updated reviews are fetched

---

## Security Considerations

### 1. Token Storage

- ✅ **Encrypt tokens** before storing in database
- ✅ **Never log tokens** in plain text
- ✅ **Use environment variables** for encryption keys
- ✅ **Rotate encryption keys** periodically

### 2. OAuth Security

- ✅ **Validate state parameter** to prevent CSRF
- ✅ **Use HTTPS** in production
- ✅ **Store redirect URIs** in environment variables
- ✅ **Validate restaurant ownership** before connecting

### 3. API Security

- ✅ **Rate limiting** on sync endpoints
- ✅ **Authentication required** for all endpoints
- ✅ **Validate restaurant ownership** before syncing
- ✅ **Log all API calls** for audit trail

### 4. Data Privacy

- ✅ **Only sync reviews** user has authorized
- ✅ **Respect Google's API usage policies**
- ✅ **Handle user data** according to GDPR/privacy laws
- ✅ **Allow users to disconnect** integration

---

## Next Steps

### Immediate (Phase 2 - Google Reviews)

1. ✅ Create `GoogleIntegration` model and migration
2. ✅ Implement OAuth authorization flow
3. ✅ Implement token refresh mechanism
4. ✅ Implement reviews fetching and storage
5. ✅ Update sync endpoint
6. ✅ Add UI for connecting Google account
7. ✅ Add UI for manual sync trigger
8. ✅ Test end-to-end flow

### Future Enhancements

1. **Automated Sync**: Cron job for 24-hour sync
2. **Review Responses**: Allow restaurants to respond to Google reviews
3. **Analytics**: Track review trends over time
4. **Notifications**: Alert on new reviews
5. **Facebook Integration**: Similar OAuth flow for Facebook
6. **Instagram Integration**: Keyword-based monitoring (different approach)

---

## API Reference

### Google Business Profile APIs

Based on the [official documentation](https://developers.google.com/my-business/content/overview):

- **Business Information API**: `https://mybusinessbusinessinformation.googleapis.com/v1`
  - Used for managing locations and business information
  - Accounts endpoint: `GET /accounts`
  - Locations endpoint: `GET /accounts/{accountId}/locations`
  
- **Reviews Endpoint**: Reviews are accessed through the Business Profile APIs
  - Documentation: https://developers.google.com/my-business/content/review-data
  - The exact endpoint structure may vary - check the official "Work with review data" guide
  
- **Rate Limits**: Check current limits in Google Cloud Console
- **Access Required**: Must request and receive approval before using these APIs

### OAuth 2.0 Endpoints

- **Authorization**: `https://accounts.google.com/o/oauth2/v2/auth`
- **Token Exchange**: `https://oauth2.googleapis.com/token`
- **Token Refresh**: `https://oauth2.googleapis.com/token` (with `grant_type=refresh_token`)

---

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Check redirect URI matches exactly in Google Cloud Console
   - Ensure protocol (http/https) matches

2. **"Access denied"**
   - Verify OAuth consent screen is configured
   - Check scopes are correct
   - Ensure user is added as test user (if in testing mode)

3. **"No business account found"**
   - User must have a Google Business Profile set up
   - Verify account has at least one location

4. **"Token expired" errors**
   - Check refresh token is being saved
   - Verify `access_type=offline` in authorization URL
   - Ensure `prompt=consent` to force refresh token

5. **"API quota exceeded"**
   - Check Google Cloud Console for quota limits
   - Implement rate limiting in your code
   - Consider caching reviews

6. **"404 Not Found" or "API not enabled"**
   - Ensure you have **requested and received approval** for Business Profile API access
   - Verify "My Business Business Information API" is enabled in Google Cloud Console
   - Check that your Google account has a Business Profile set up
   - See: https://developers.google.com/my-business/content/overview for access requirements

---

## Resources

- [Google Business Profile APIs Overview](https://developers.google.com/my-business/content/overview) - Official overview and access requirements
- [Google Business Profile API Documentation](https://developers.google.com/my-business)
- [Work with Review Data Guide](https://developers.google.com/my-business/content/review-data) - How to fetch and manage reviews
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Request API Access](https://developers.google.com/my-business/content/overview) - Apply for Business Profile API access

---

## Summary

This integration requires:
1. ✅ **OAuth 2.0 authorization** - Users must connect their Google account
2. ✅ **Token management** - Store and refresh access tokens securely
3. ✅ **Incremental sync** - Only fetch new/updated reviews since last sync
4. ✅ **Error handling** - Handle token expiry, API errors, network issues
5. ✅ **Security** - Encrypt tokens, validate requests, respect privacy

The implementation follows Google's official API and best practices for secure, reliable integration.

