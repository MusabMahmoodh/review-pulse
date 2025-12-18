# Google Places API - Easy Testing Setup 🚀

This is a **much simpler alternative** to the Google Business Profile API for testing purposes. It only requires an API key (no OAuth, no special approvals needed!).

## Quick Setup (5 minutes)

### 1. Get a Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. **Enable Billing** (Required for Places API):
   - Go to **Billing** in the left menu
   - Link a billing account to your project
   - Note: Google provides $200/month free credit
4. Enable the **Places API (New)**:
   - Go to **APIs & Services > Library**
   - Search for **"Places API (New)"** (NOT just "Places API")
   - Click **Enable**
   - ⚠️ Important: You need "Places API (New)", not the legacy "Places API"
5. Create an API Key:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > API Key**
   - Copy the API key
   - (Optional) Restrict the key to "Places API (New)" for security

### 2. Add to Environment Variables

Add to `server/.env`:
```env
GOOGLE_PLACES_API_KEY=your_api_key_here
```

### 3. That's it! 🎉

No OAuth setup, no special approvals, just an API key!

## How to Use

### Option 1: Auto-detect Place ID (Easiest)

The system will automatically search for your restaurant using its name and address:

```bash
POST /api/external-reviews/sync
{
  "restaurantId": "your-restaurant-id",
  "platforms": ["google-places"]
}
```

### Option 2: Provide Place ID (More Reliable)

1. **Find your Place ID:**
   ```bash
   GET /api/external-reviews/search-place?query=Pizza Hut New York
   ```

2. **Use the Place ID:**
   ```bash
   POST /api/external-reviews/sync
   {
     "restaurantId": "your-restaurant-id",
     "platforms": ["google-places"],
     "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4"
   }
   ```

### Option 3: Find Place ID Manually

You can also find Place IDs using:
- [Google Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
- Or use the search endpoint above

## API Endpoints

### Search for Places
```bash
GET /api/external-reviews/search-place?query=restaurant name and address
```

Returns:
```json
{
  "places": [
    {
      "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "name": "Restaurant Name",
      "formatted_address": "123 Main St, City, State",
      "rating": 4.5,
      "user_ratings_total": 1234
    }
  ]
}
```

### Sync Reviews
```bash
POST /api/external-reviews/sync
Content-Type: application/json

{
  "restaurantId": "restaurant-id",
  "platforms": ["google-places"],
  "placeId": "optional-place-id"
}
```

## Limitations vs Business Profile API

| Feature | Places API | Business Profile API |
|---------|-----------|---------------------|
| Setup Complexity | ⭐ Easy (just API key) | ⭐⭐⭐ Complex (OAuth + approval) |
| Review Data | Limited (public reviews only) | Full (all reviews) |
| Review Details | Basic | Complete |
| Requires OAuth | ❌ No | ✅ Yes |
| Requires Approval | ❌ No | ✅ Yes |
| Best For | Testing, quick setup | Production, full features |

## Cost

- **Free tier**: $200/month credit (covers ~40,000 requests)
- **Places Details**: $17 per 1,000 requests
- **Text Search**: $32 per 1,000 requests

For testing, the free tier should be plenty!

## Example: Testing with cURL

```bash
# 1. Search for a place
curl "http://localhost:3000/api/external-reviews/search-place?query=McDonald's Times Square" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Sync reviews (auto-detect)
curl -X POST "http://localhost:3000/api/external-reviews/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "restaurantId": "your-restaurant-id",
    "platforms": ["google-places"]
  }'

# 3. Sync reviews (with Place ID)
curl -X POST "http://localhost:3000/api/external-reviews/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "restaurantId": "your-restaurant-id",
    "platforms": ["google-places"],
    "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4"
  }'
```

## Troubleshooting

### "GOOGLE_PLACES_API_KEY environment variable is required"
- Make sure you added the API key to `server/.env`
- Restart your server after adding the env variable

### "Could not find Google Place ID"
- Make sure your restaurant name and address are accurate
- Try providing a `placeId` directly
- Use the search endpoint to find the correct Place ID

### "403 Forbidden" Error ⚠️

This is the most common error. Here's how to fix it:

1. **Enable Places API (New)**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to **APIs & Services > Library**
   - Search for **"Places API (New)"** (NOT "Places API")
   - Click **Enable**
   - ⚠️ Make sure it's the NEW API, not the legacy one

2. **Enable Billing**:
   - Go to **Billing** in Google Cloud Console
   - Link a billing account to your project
   - Google provides $200/month free credit
   - Billing is **required** for Places API (New)

3. **Check API Key Restrictions**:
   - Go to **APIs & Services > Credentials**
   - Click on your API key
   - Under "API restrictions", make sure "Places API (New)" is allowed
   - Or set to "Don't restrict key" for testing

4. **Verify API Key**:
   - Make sure the API key in your `.env` matches the one in Google Cloud Console
   - Check for any typos or extra spaces

### "REQUEST_DENIED" error (Legacy API)
- You're using the old Places API endpoints
- Make sure you enabled **"Places API (New)"** not "Places API"
- The code has been updated to use the new endpoints

### "OVER_QUERY_LIMIT"
- You've exceeded your quota
- Check your usage in Google Cloud Console
- Wait for quota reset or upgrade your plan
- Free tier: $200/month credit (covers ~40,000 requests)

## Next Steps

Once you're ready for production, you can switch to the full **Google Business Profile API** which provides:
- Complete review data
- Ability to respond to reviews
- More reliable data
- Better integration with business accounts

But for now, Places API is perfect for testing! 🎯

