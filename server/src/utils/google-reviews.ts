import { AppDataSource } from "../data-source";
import { ExternalReview } from "../models/ExternalReview";
import { GoogleIntegration } from "../models/GoogleIntegration";
import { getValidAccessToken } from "./google-auth";

/**
 * Maps Google star rating enum to numeric rating
 */
function mapStarRating(rating: string): number {
  switch (rating) {
    case "FIVE":
      return 5;
    case "FOUR":
      return 4;
    case "THREE":
      return 3;
    case "TWO":
      return 2;
    case "ONE":
      return 1;
    default:
      return 0;
  }
}

/**
 * Fetches Google reviews for a restaurant and stores them in the database.
 * Only fetches reviews updated since the last sync (incremental sync).
 * 
 * @param restaurantId - The restaurant ID
 * @param sinceDate - Optional date to fetch reviews updated after this date
 * @returns Number of new reviews synced
 */
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

  // Build API URL using My Business API v4 (official endpoint per documentation)
  // Official endpoint: GET https://mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews
  // Location ID format: accounts/{accountId}/locations/{locationId}
  const locationId = integration.locationId;
  
  // Construct the full location path if needed
  let fullLocationPath = locationId;
  
  // If locationId is just "locations/{locationId}", construct full path using accountId
  if (!locationId.startsWith("accounts/")) {
    // Extract location ID from format "locations/123456" or just "123456"
    let locationPath = locationId;
    if (locationId.startsWith("locations/")) {
      locationPath = locationId.replace("locations/", "");
    }
    
    // Construct full path: accounts/{accountId}/locations/{locationId}
    const accountId = integration.googleAccountId.replace("accounts/", "");
    fullLocationPath = `accounts/${accountId}/locations/${locationPath}`;
  }
  
  // Use the official My Business API v4 endpoint for reviews
  // Documentation: https://developers.google.com/my-business/content/review-data
  const url = new URL(
    `https://mybusiness.googleapis.com/v4/${fullLocationPath}/reviews`
  );

  // Add filter for reviews updated since last sync (if provided)
  // Note: Google API supports updateTime filter, but we'll fetch all and filter by createTime
  // since updateTime might not be available in all API versions

  // Fetch reviews
  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google API error:", response.status, errorText);
    
    if (response.status === 401) {
      // Token invalid, mark as expired
      integration.status = "expired";
      await integrationRepo.save(integration);
      throw new Error("Authentication failed. Please re-authorize your Google account.");
    }
    
    throw new Error(`Google API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const reviews = data.reviews || [];

  let syncedCount = 0;
  const now = new Date();

  // Process and store reviews
  for (const review of reviews) {
    // Extract review ID - v4 API may return it as reviewId or in name field
    // Name format: accounts/{accountId}/locations/{locationId}/reviews/{reviewId}
    let reviewId = review.reviewId;
    if (!reviewId && review.name) {
      // Extract reviewId from name field if reviewId is not present
      const nameMatch = review.name.match(/\/reviews\/([^\/]+)$/);
      if (nameMatch) {
        reviewId = nameMatch[1];
      } else {
        // Fallback: use the last part of the name
        reviewId = review.name.split("/").pop() || review.name;
      }
    }
    
    if (!reviewId) {
      console.warn("Skipping review without ID:", review);
      continue;
    }

    // Check if we should skip this review (if sinceDate is provided)
    if (sinceDate) {
      const reviewDate = new Date(review.createTime);
      if (reviewDate < sinceDate) {
        continue; // Skip reviews older than sinceDate
      }
    }

    // Check if review already exists (by review ID)
    const existingReview = await reviewRepo.findOne({
      where: {
        id: reviewId,
        restaurantId,
        platform: "google",
      },
    });

    if (existingReview) {
      // Update existing review if it changed
      existingReview.rating = mapStarRating(review.starRating);
      existingReview.comment = review.comment || "";
      existingReview.author = review.reviewer?.displayName || "Anonymous";
      existingReview.reviewDate = new Date(review.createTime);
      existingReview.syncedAt = now;

      await reviewRepo.save(existingReview);
    } else {
      // Create new review
      const newReview = reviewRepo.create({
        id: reviewId,
        restaurantId,
        platform: "google",
        rating: mapStarRating(review.starRating),
        comment: review.comment || "",
        author: review.reviewer?.displayName || "Anonymous",
        reviewDate: new Date(review.createTime),
        syncedAt: now,
      });

      await reviewRepo.save(newReview);
      syncedCount++;
    }
  }

  // Update last sync time
  integration.lastSyncedAt = now;
  await integrationRepo.save(integration);

  return syncedCount;
}

