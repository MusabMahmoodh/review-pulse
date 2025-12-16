# Meta (Facebook & Instagram) Integration

This document describes the Meta API integration for retrieving reviews, posts, and tags from Facebook and Instagram.

## Overview

The Meta integration allows restaurants to connect their Facebook Pages and Instagram Business Accounts to retrieve:
- Facebook Page reviews/ratings
- Posts where the page is tagged
- Page posts
- Instagram posts (if Instagram Business Account is connected)

## Implementation

### Database Model

The `MetaIntegration` model stores the connection information:
- `restaurantId`: Primary key linking to the restaurant
- `pageId`: Facebook Page ID
- `instagramBusinessAccountId`: Optional Instagram Business Account ID
- `accessToken`: Encrypted Page Access Token (long-lived, 60 days)
- `userAccessToken`: Encrypted User Access Token (for token refresh)
- `tokenExpiry`: When the access token expires
- `lastSyncedAt`: Last successful sync timestamp
- `status`: Integration status (active, expired, revoked)

### OAuth Flow

1. **Authorization**: Restaurant initiates connection via `/api/auth/meta/authorize?restaurantId={id}`
   - Redirects to Meta OAuth consent screen
   - Required permissions:
     - `public_profile`: Basic profile info (always available)
     - `pages_show_list`: List user's pages (works for app admins/testers in dev mode)
   - Note: Page Access Tokens (obtained after OAuth) automatically have permissions to:
     - Read page data, reviews, ratings
     - Read page posts and engagement
     - Access Instagram Business Account (if connected)
   - For production use, you may need to request additional permissions through App Review

2. **Callback**: Meta redirects to `/api/auth/meta/callback`
   - Exchanges authorization code for short-lived user access token
   - Gets user's Facebook pages (requires `pages_show_list` permission)
   - Exchanges user token for long-lived page access token (60 days)
   - Page Access Tokens automatically have permissions to read page data, reviews, and posts
   - Optionally fetches Instagram Business Account ID
   - Stores encrypted tokens in database

### Token Management

The `meta-auth.ts` utility handles token management:
- `getValidAccessToken()`: Gets a valid access token, automatically refreshing if expired
- `exchangeForPageToken()`: Exchanges user token for long-lived page token

Page Access Tokens are long-lived (60 days) and can be extended. The system automatically refreshes tokens when they're about to expire.

### Data Fetching

The `meta-posts.ts` utility provides functions to fetch data:

1. **`fetchMetaReviews()`**: Fetches Facebook Page reviews/ratings
   - Endpoint: `GET /{page-id}?fields=overall_star_rating,rating_count,ratings{...}`
   - Stores reviews in `ExternalReview` table with platform="facebook"
   - Supports incremental sync based on `lastSyncedAt`

2. **`fetchTaggedPosts()`**: Fetches posts where the page is tagged
   - Endpoint: `GET /{page-id}/tagged`
   - Returns posts with metadata (message, created_time, from, attachments)

3. **`fetchPagePosts()`**: Fetches posts from the page
   - Endpoint: `GET /{page-id}/posts`
   - Returns posts with engagement metrics (likes, comments)

4. **`fetchInstagramPosts()`**: Fetches Instagram posts (if connected)
   - Endpoint: `GET /{instagram-business-account-id}/media`
   - Returns media posts with captions, media URLs, and engagement metrics

### API Endpoints

#### Connect Meta Account
- `GET /api/auth/meta/authorize?restaurantId={id}` - Initiate OAuth flow
- `GET /api/auth/meta/callback?code={code}&state={restaurantId}` - Handle OAuth callback

#### Sync Reviews
- `POST /api/external-reviews/sync` - Sync reviews from connected platforms
  - Body: `{ "restaurantId": "...", "platforms": ["google", "facebook"] }`
  - Returns: `{ "success": true, "results": { "facebook": { "success": true, "count": 5 } }, "totalSynced": 5 }`

## Prerequisites

### Meta Developer Setup

1. **Create Meta App**: 
   - Go to https://developers.facebook.com/
   - Create a new app
   - Add "Facebook Login" product
   - Configure OAuth redirect URI: `{CLIENT_URL}/api/auth/meta/callback`

2. **Environment Variables**:
   ```
   META_APP_ID=your_app_id
   META_APP_SECRET=your_app_secret
   META_REDIRECT_URI=https://your-domain.com/api/auth/meta/callback
   ```

3. **Permissions & Review**:
   - For development: Use Development Mode (limited to app admins/testers)
   - For production: Submit for App Review to get Advanced Access
   - Required permissions may need Business Verification for production use

### Facebook Page Requirements

- Restaurant must have a Facebook Page (not just a personal profile)
- Page must be published (not unpublished)
- User connecting must be an admin of the page

### Instagram Requirements

- Instagram account must be converted to Business Account
- Instagram account must be connected to the Facebook Page
- Requires `instagram_basic` and `instagram_content_publish` permissions

## API Limitations

1. **Reviews**: Individual review details require Advanced Access and Business Verification
   - Without Advanced Access, you can only get overall rating and count
   - With Advanced Access, you can get individual reviews with reviewer information

2. **Rate Limits**: Meta APIs have rate limits
   - Standard: 200 calls per hour per user
   - Page tokens: Higher limits, varies by app

3. **Token Expiry**: 
   - User tokens: 1-2 hours
   - Page tokens: 60 days (can be extended)
   - System automatically refreshes tokens

## Usage Example

```typescript
// Connect Meta account
const authUrl = `/api/auth/meta/authorize?restaurantId=${restaurantId}`;
window.location.href = authUrl;

// Sync reviews
const response = await fetch('/api/external-reviews/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    restaurantId: '...',
    platforms: ['facebook']
  })
});
```

## Error Handling

Common errors and solutions:

- **"Meta integration not found"**: Restaurant hasn't connected Meta account
- **"Authentication failed"**: Token expired, need to re-authorize
- **"No Facebook pages found"**: User doesn't have any pages or isn't admin
- **"Failed to get page access token"**: Insufficient permissions or page not accessible

## Security

- All tokens are encrypted using AES-256-GCM before storage
- Encryption key stored in `ENCRYPTION_KEY` environment variable
- Tokens are never logged or exposed in API responses
- OAuth state parameter prevents CSRF attacks

## Future Enhancements

- Allow users to select which page to connect (currently uses first page)
- Add UI for viewing tagged posts and Instagram posts
- Implement webhook subscriptions for real-time updates
- Add support for Instagram Stories and Reels
- Cache API responses to reduce rate limit usage


