import { AppDataSource } from "../data-source";
import { ExternalReview } from "../models/ExternalReview";
import { Restaurant } from "../models/Restaurant";

/**
 * Fetches Google reviews using Places API (simpler alternative - no OAuth required!)
 * 
 * This is much easier to test with - just needs an API key.
 * However, it has limitations:
 * - Requires a Place ID
 * - May have limited review data compared to Business Profile API
 * - Public reviews only
 * 
 * @param restaurantId - The restaurant ID
 * @param placeId - Google Place ID (optional, will try to find from restaurant address if not provided)
 * @returns Number of new reviews synced
 */
export async function fetchGoogleReviewsFromPlaces(
  restaurantId: string,
  placeId?: string
): Promise<number> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY environment variable is required");
  }

  const restaurantRepo = AppDataSource.getRepository(Restaurant);
  const reviewRepo = AppDataSource.getRepository(ExternalReview);

  const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId } });
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  // Priority: 1. Provided placeId, 2. Saved googlePlaceId, 3. Auto-detect from name/address
  let finalPlaceId: string | undefined = placeId || restaurant.googlePlaceId;
  
  if (!finalPlaceId) {
    // Try to find it using Text Search
    const foundPlaceId: string | undefined = await findPlaceId(restaurant.name, restaurant.address, apiKey);
    if (!foundPlaceId) {
      throw new Error("Could not find Google Place ID. Please provide a Place ID or ensure restaurant name/address is accurate.");
    }
    finalPlaceId = foundPlaceId;
    
    // Save the auto-detected Place ID for future use
    restaurant.googlePlaceId = foundPlaceId;
    await restaurantRepo.save(restaurant);
  } else if (placeId && placeId !== restaurant.googlePlaceId) {
    // If a new placeId was provided, save it
    restaurant.googlePlaceId = placeId;
    await restaurantRepo.save(restaurant);
  }
  
  // At this point, finalPlaceId must be a string
  if (!finalPlaceId) {
    throw new Error("Place ID is required");
  }

  // Fetch place details with reviews using Places API (New)
  // New API endpoint: https://places.googleapis.com/v1/places/{placeId}
  const url = `https://places.googleapis.com/v1/places/${finalPlaceId}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,reviews"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Google Places API error: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage += ` - ${errorData.error?.message || errorData.message || errorText}`;
      
      // Provide helpful guidance for common errors
      if (response.status === 403) {
        errorMessage += "\n\nTroubleshooting 403 Forbidden:\n";
        errorMessage += "1. Make sure 'Places API (New)' is enabled (not just 'Places API')\n";
        errorMessage += "2. Verify billing is enabled for your Google Cloud project\n";
        errorMessage += "3. Check API key restrictions in Google Cloud Console\n";
        errorMessage += "4. Ensure the API key has access to Places API (New)";
      }
    } catch {
      errorMessage += ` - ${errorText}`;
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();

  if (!data.reviews || data.reviews.length === 0) {
    return 0; // No reviews found
  }

  const reviews = data.reviews || [];
  let syncedCount = 0;
  const now = new Date();

  // Process and store reviews
  for (const review of reviews) {
    // Use publishTime + author as unique ID (New API format)
    const reviewTime = review.publishTime || review.relativePublishTimeDescription || Date.now().toString();
    const authorId = review.authorAttribution?.uri || review.authorAttribution?.displayName || "anonymous";
    const reviewId = `places_${finalPlaceId}_${reviewTime}_${authorId}`.replace(/[^a-zA-Z0-9_]/g, "_");

    // Check if review already exists
    const existingReview = await reviewRepo.findOne({
      where: {
        id: reviewId,
        restaurantId,
        platform: "google",
      },
    });

    // New API format: review.rating, review.text, review.authorAttribution.displayName, review.publishTime
    const rating = review.rating?.value || review.rating || 0;
    const comment = review.text?.text || review.text || "";
    const author = review.authorAttribution?.displayName || review.authorAttribution?.uri || "Anonymous";
    // New API uses publishTime in RFC3339 format, or relativeTime
    let reviewDate = new Date();
    if (review.publishTime) {
      reviewDate = new Date(review.publishTime);
    } else if (review.relativePublishTimeDescription) {
      // Try to parse relative time (e.g., "2 weeks ago") - for now just use current date
      reviewDate = new Date();
    }

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      existingReview.comment = comment;
      existingReview.author = author;
      existingReview.reviewDate = reviewDate;
      existingReview.syncedAt = now;
      await reviewRepo.save(existingReview);
    } else {
      // Create new review
      const newReview = reviewRepo.create({
        id: reviewId,
        restaurantId,
        platform: "google",
        rating,
        comment,
        author,
        reviewDate,
        syncedAt: now,
      });

      await reviewRepo.save(newReview);
      syncedCount++;
    }
  }

  return syncedCount;
}

/**
 * Finds a Google Place ID by searching for a place name and address
 */
async function findPlaceId(name: string, address: string, apiKey: string): Promise<string | undefined> {
  // Use Text Search (New API) to find the place
  const url = "https://places.googleapis.com/v1/places:searchText";
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress"
    },
    body: JSON.stringify({
      textQuery: `${name} ${address}`
    })
  });

  if (!response.ok) {
    // Log error but don't throw - let caller handle it
    const errorText = await response.text().catch(() => "");
    console.error(`Place search failed: ${response.status} ${response.statusText}`, errorText);
    return undefined;
  }

  const data = await response.json();

  if (data.places && data.places.length > 0) {
    // Return the first result's id
    return data.places[0].id;
  }

  return undefined;
}

/**
 * Search for a place and return place details (useful for finding Place IDs)
 */
export async function searchPlace(query: string): Promise<any> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY environment variable is required");
  }

  // Use Places API (New) for text search
  const url = "https://places.googleapis.com/v1/places:searchText";
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount"
    },
    body: JSON.stringify({
      textQuery: query
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Google Places API error: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage += ` - ${errorData.error?.message || errorData.message || errorText}`;
      
      // Provide helpful guidance for common errors
      if (response.status === 403) {
        errorMessage += "\n\nTroubleshooting 403 Forbidden:\n";
        errorMessage += "1. Make sure 'Places API (New)' is enabled (not just 'Places API')\n";
        errorMessage += "2. Verify billing is enabled for your Google Cloud project\n";
        errorMessage += "3. Check API key restrictions in Google Cloud Console\n";
        errorMessage += "4. Ensure the API key has access to Places API (New)";
      }
    } catch {
      errorMessage += ` - ${errorText}`;
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Transform new API format to match expected format
  const results = (data.places || []).map((place: any) => ({
    place_id: place.id,
    name: place.displayName?.text || place.displayName,
    formatted_address: place.formattedAddress,
    rating: place.rating,
    user_ratings_total: place.userRatingCount
  }));

  return results;
}

