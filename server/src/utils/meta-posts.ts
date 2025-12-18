import { AppDataSource } from "../data-source";
import { ExternalReview } from "../models/ExternalReview";
import { MetaIntegration } from "../models/MetaIntegration";
import { getValidAccessToken } from "./meta-auth";

/**
 * Fetches Facebook Page reviews/ratings for a restaurant
 */
export async function fetchMetaReviews(
  restaurantId: string,
  sinceDate?: Date
): Promise<number> {
  const integrationRepo = AppDataSource.getRepository(MetaIntegration);
  const reviewRepo = AppDataSource.getRepository(ExternalReview);

  const integration = await integrationRepo.findOne({ where: { restaurantId } });

  if (!integration || integration.status !== "active") {
    throw new Error("Meta integration not active");
  }

  const accessToken = await getValidAccessToken(restaurantId);

  // Fetch page ratings/reviews
  // Note: Individual review details require Advanced Access
  const url = new URL(`https://graph.facebook.com/v21.0/${integration.pageId}`);
  url.searchParams.set("fields", "overall_star_rating,rating_count,ratings{reviewer,rating,created_time,review_text}");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Meta API error:", response.status, errorText);
    
    if (response.status === 401) {
      integration.status = "expired";
      await integrationRepo.save(integration);
      throw new Error("Authentication failed. Please re-authorize your Meta account.");
    }
    
    throw new Error(`Meta API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Handle both direct ratings array and nested ratings data
  let ratings = [];
  if (data.ratings?.data) {
    ratings = data.ratings.data;
  } else if (Array.isArray(data.ratings)) {
    ratings = data.ratings;
  }

  let syncedCount = 0;
  const now = new Date();

  // Process and store reviews
  for (const rating of ratings) {
    // Skip if review is older than sinceDate
    if (sinceDate && rating.created_time) {
      const reviewDate = new Date(rating.created_time);
      if (reviewDate < sinceDate) {
        continue;
      }
    }

    // Create review ID from page ID and rating ID
    const reviewId = `meta_${integration.pageId}_${rating.id || rating.created_time}`;

    // Check if review already exists
    const existingReview = await reviewRepo.findOne({
      where: {
        id: reviewId,
        restaurantId,
        platform: "facebook",
      },
    });

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating.rating || 0;
      existingReview.comment = rating.review_text || "";
      existingReview.author = rating.reviewer?.name || "Anonymous";
      existingReview.reviewDate = new Date(rating.created_time);
      existingReview.syncedAt = now;

      await reviewRepo.save(existingReview);
    } else {
      // Create new review
      const newReview = reviewRepo.create({
        id: reviewId,
        restaurantId,
        platform: "facebook",
        rating: rating.rating || 0,
        comment: rating.review_text || "",
        author: rating.reviewer?.name || "Anonymous",
        reviewDate: new Date(rating.created_time),
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

/**
 * Fetches posts where the Facebook Page is tagged
 */
export async function fetchTaggedPosts(
  restaurantId: string,
  sinceDate?: Date
): Promise<any[]> {
  const integrationRepo = AppDataSource.getRepository(MetaIntegration);
  const integration = await integrationRepo.findOne({ where: { restaurantId } });

  if (!integration || integration.status !== "active") {
    throw new Error("Meta integration not active");
  }

  const accessToken = await getValidAccessToken(restaurantId);

  // Fetch tagged posts
  const url = new URL(`https://graph.facebook.com/v21.0/${integration.pageId}/tagged`);
  url.searchParams.set("fields", "id,message,created_time,from,story,attachments{media,subattachments}");
  url.searchParams.set("access_token", accessToken);
  
  if (sinceDate) {
    url.searchParams.set("since", Math.floor(sinceDate.getTime() / 1000).toString());
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Meta API error:", response.status, errorText);
    
    if (response.status === 401) {
      integration.status = "expired";
      await integrationRepo.save(integration);
      throw new Error("Authentication failed. Please re-authorize your Meta account.");
    }
    
    throw new Error(`Meta API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Fetches posts from the Facebook Page
 */
export async function fetchPagePosts(
  restaurantId: string,
  sinceDate?: Date
): Promise<any[]> {
  const integrationRepo = AppDataSource.getRepository(MetaIntegration);
  const integration = await integrationRepo.findOne({ where: { restaurantId } });

  if (!integration || integration.status !== "active") {
    throw new Error("Meta integration not active");
  }

  const accessToken = await getValidAccessToken(restaurantId);

  // Fetch page posts
  const url = new URL(`https://graph.facebook.com/v21.0/${integration.pageId}/posts`);
  url.searchParams.set("fields", "id,message,created_time,from,story,attachments{media,subattachments},likes.summary(true),comments.summary(true)");
  url.searchParams.set("access_token", accessToken);
  
  if (sinceDate) {
    url.searchParams.set("since", Math.floor(sinceDate.getTime() / 1000).toString());
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Meta API error:", response.status, errorText);
    
    if (response.status === 401) {
      integration.status = "expired";
      await integrationRepo.save(integration);
      throw new Error("Authentication failed. Please re-authorize your Meta account.");
    }
    
    throw new Error(`Meta API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Fetches Instagram posts (if Instagram Business Account is connected)
 */
export async function fetchInstagramPosts(
  restaurantId: string,
  sinceDate?: Date
): Promise<any[]> {
  const integrationRepo = AppDataSource.getRepository(MetaIntegration);
  const integration = await integrationRepo.findOne({ where: { restaurantId } });

  if (!integration || integration.status !== "active") {
    throw new Error("Meta integration not active");
  }

  if (!integration.instagramBusinessAccountId) {
    throw new Error("Instagram Business Account not connected");
  }

  const accessToken = await getValidAccessToken(restaurantId);

  // Fetch Instagram posts
  const url = new URL(`https://graph.facebook.com/v21.0/${integration.instagramBusinessAccountId}/media`);
  url.searchParams.set("fields", "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count");
  url.searchParams.set("access_token", accessToken);
  
  if (sinceDate) {
    url.searchParams.set("since", Math.floor(sinceDate.getTime() / 1000).toString());
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Instagram API error:", response.status, errorText);
    
    if (response.status === 401) {
      integration.status = "expired";
      await integrationRepo.save(integration);
      throw new Error("Authentication failed. Please re-authorize your Meta account.");
    }
    
    throw new Error(`Instagram API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}




