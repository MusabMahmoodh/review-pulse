import { AppDataSource } from "../data-source";
import { ExternalReview } from "../models/ExternalReview";
import { Restaurant } from "../models/Restaurant";

/**
 * Fetches Google reviews using Serper API
 * 
 * @param restaurantId - The restaurant ID
 * @param placeId - Google Place ID (optional, will use saved placeId if not provided)
 * @param sinceDate - Optional date to fetch reviews after this date (for incremental sync)
 * @returns Number of new reviews synced
 */
export async function fetchGoogleReviewsFromSerper(
  restaurantId: string,
  placeId?: string,
  sinceDate?: Date
): Promise<number> {
  const apiKey = process.env.SERPER_API_KEY;
  
  if (!apiKey) {
    throw new Error("SERPER_API_KEY environment variable is required");
  }

  const restaurantRepo = AppDataSource.getRepository(Restaurant);
  const reviewRepo = AppDataSource.getRepository(ExternalReview);

  const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId } });
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  // Priority: 1. Provided placeId, 2. Saved googlePlaceId
  let finalPlaceId: string | undefined = placeId || restaurant.googlePlaceId;
  
  if (!finalPlaceId) {
    throw new Error("Place ID is required. Please provide a Google Place ID.");
  }

  // Save placeId if it was provided and different from saved one
  if (placeId && placeId !== restaurant.googlePlaceId) {
    restaurant.googlePlaceId = placeId;
    await restaurantRepo.save(restaurant);
  }

  // Fetch reviews from Serper API
  const url = "https://google.serper.dev/reviews";
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      placeId: finalPlaceId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Serper API error: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage += ` - ${errorData.error?.message || errorData.message || errorText}`;
    } catch {
      errorMessage += ` - ${errorText}`;
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Serper API returns reviews in a reviews array
  // The exact structure may vary, but typically includes: author, rating, text, date, etc.
  const reviews = data.reviews || [];
  
  if (reviews.length === 0) {
    return 0; // No reviews found
  }


  let syncedCount = 0;
  const now = new Date();

  // Process and store reviews
  for (const review of reviews) {
    // Extract review data from Serper API response structure
    // Structure: { rating, isoDate, snippet, user: { name }, id }
    const author = review.user?.name || "Anonymous";
    const rating = review.rating || 0;
    const comment = review.snippet || "";
    
    // Parse review date - use isoDate (ISO 8601 format) as primary source
    let reviewDate = new Date();
    
    if (review.isoDate) {
      const parsedDate = new Date(review.isoDate);
      // Check if date is valid (not NaN)
      if (!isNaN(parsedDate.getTime())) {
        reviewDate = parsedDate;
      } else {
        console.warn(`Invalid isoDate for review by ${author}: ${review.isoDate}, using current date`);
      }
    } else {
      // Fallback: try to parse from date field (human-readable like "2 months ago")
      // But since it's relative, we'll use current date as fallback
      console.warn(`No isoDate found for review by ${author}, using current date`);
    }

    // Skip reviews older than sinceDate if provided (for incremental sync)
    if (sinceDate && reviewDate < sinceDate) {
      continue;
    }

    // Use review ID from Serper API, or generate one if not available
    const reviewId = review.id || 
      `serper_${finalPlaceId}_${reviewDate.getTime()}_${author}`.replace(/[^a-zA-Z0-9_]/g, "_");

    // Check if review already exists
    const existingReview = await reviewRepo.findOne({
      where: {
        id: reviewId,
        restaurantId,
        platform: "google",
      },
    });

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

