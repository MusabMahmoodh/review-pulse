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

  // Build API URL using Business Information API
  // Location ID format: accounts/{accountId}/locations/{locationId}
  // Reviews endpoint: /locations/{locationId}/reviews
  const locationId = integration.locationId;
  
  // Extract just the location ID if it's in full format
  let locationPath = locationId;
  if (locationId.includes("/locations/")) {
    // If format is "accounts/123/locations/456", use just the location part
    const locationMatch = locationId.match(/locations\/([^\/]+)/);
    if (locationMatch) {
      locationPath = locationMatch[1];
    }
  }
  
  // Try Business Information API first (v1)
  let url = new URL(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${locationId}/reviews`
  );
  
  // If locationId is full path, use it directly; otherwise construct it
  if (!locationId.startsWith("accounts/")) {
    // Need to construct full path - locationId should be in format "locations/123456"
    url = new URL(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${integration.googleAccountId}/locations/${locationPath}/reviews`
    );
  }

  // Add filter for reviews updated since last sync (if provided)
  // Note: Google API uses updateTime filter, but we'll fetch all and filter by createTime
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
        id: review.reviewId,
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
        id: review.reviewId,
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

