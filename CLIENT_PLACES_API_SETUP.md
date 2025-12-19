# Client-Side Google Places API Integration

The client now supports **two methods** for syncing Google reviews:

1. **Google Business Profile API** (OAuth) - Full-featured, requires approval
2. **Google Places API** (API Key) - Easy testing, no OAuth needed! ⭐

## What Was Added

### 1. API Client Updates (`client/lib/api-client.ts`)
- Added `searchPlace()` function to search for Google Places
- Updated `sync()` to accept optional `placeId` parameter

### 2. Settings Page Updates (`client/app/dashboard/settings/page.tsx`)
- **Toggle Switch**: Switch between OAuth and Places API modes
- **Place Search**: Search for restaurants by name/address
- **Place ID Input**: Manual entry option
- **Auto-detect**: System can auto-detect Place ID from restaurant name/address

## How to Use

### Step 1: Enable Places API Mode
1. Go to **Settings > Platform Integrations**
2. Toggle the switch to **"Places API"** mode (instead of OAuth)

### Step 2: Find Your Place ID

**Option A: Search (Recommended)**
1. Enter your restaurant name in the search box (e.g., "McDonald's Times Square")
2. Click the search button
3. Select your restaurant from the results
4. Place ID is automatically saved

**Option B: Manual Entry**
1. Find your Place ID using [Google's Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
2. Paste it into the "Place ID" field

**Option C: Auto-detect**
- If you leave Place ID empty, the system will try to find it automatically using your restaurant's name and address

### Step 3: Sync Reviews
1. Click **"Sync Now"** button
2. Reviews will be fetched from Google Places API
3. Results will show in the External Reviews section

## UI Features

### Toggle Switch
- **Left (OAuth)**: Uses Business Profile API - requires Google account connection
- **Right (Places API)**: Uses Places API - just needs API key on backend

### Place Search Results
- Shows restaurant name
- Shows address
- Shows rating and review count
- Click to select and save Place ID

### Status Indicators
- Green badge when Place ID is set
- Clear instructions for each mode
- Sync button enabled when ready

## Backend Requirements

Make sure your backend has:
```env
GOOGLE_PLACES_API_KEY=your_api_key_here
```

See `GOOGLE_PLACES_SETUP.md` for backend setup instructions.

## User Flow

### Places API Mode (Easy)
1. Toggle to Places API
2. Search for restaurant → Select → Place ID saved
3. Click "Sync Now" → Reviews appear!

### OAuth Mode (Full-featured)
1. Toggle to OAuth (default)
2. Click "Connect Google Account"
3. Authorize → Connected
4. Click "Sync Now" → Reviews appear!

## Benefits of Places API Mode

✅ **No OAuth setup** - Just API key on backend  
✅ **No approval needed** - Works immediately  
✅ **Easy testing** - Perfect for development  
✅ **Quick setup** - 5 minutes vs days/weeks  

## Limitations

⚠️ **Limited review data** - Public reviews only  
⚠️ **No review responses** - Can't respond to reviews  
⚠️ **Rate limits** - Subject to Google Places API quotas  
⚠️ **Cost** - Uses Google Places API credits  

For production with full features, use OAuth mode (Business Profile API).

## Troubleshooting

### "Place ID not found"
- Try a more specific search query
- Include city/address in search
- Use manual Place ID entry

### "Sync failed"
- Check backend has `GOOGLE_PLACES_API_KEY` set
- Verify API key is valid
- Check Google Cloud Console for quota/errors

### "No results in search"
- Try different search terms
- Include location (city, state)
- Use manual Place ID entry instead

## Code Structure

### State Management
```typescript
const [usePlacesApi, setUsePlacesApi] = useState(false)
const [placeId, setPlaceId] = useState("")
const [placeSearchQuery, setPlaceSearchQuery] = useState("")
```

### Sync Handler
```typescript
const handleSyncNow = async () => {
  const platforms: string[] = []
  
  if (usePlacesApi) {
    platforms.push("google-places")
  } else if (isGoogleConnected) {
    platforms.push("google")
  }
  
  syncMutation.mutate({ 
    platforms,
    placeId: usePlacesApi && placeId ? placeId : undefined
  })
}
```

## Next Steps

1. ✅ Backend setup (add API key)
2. ✅ Client UI (done!)
3. ✅ Test with a real restaurant
4. ✅ Switch to OAuth mode for production

Enjoy easy Google reviews testing! 🎉


