import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/server/encryption";

type ExternalReviewPlatform = "google" | "facebook" | "instagram";

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, "_");
}

function parseDate(value?: string | null): Date {
  if (!value) {
    return new Date();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function upsertExternalReview(params: {
  id: string;
  restaurantId: string;
  platform: ExternalReviewPlatform;
  author: string;
  rating: number;
  comment: string;
  reviewDate: Date;
  syncedAt: Date;
}): Promise<boolean> {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data: existingRows } = await supabaseAdmin
    .from("external_reviews")
    .select("id")
    .eq("id", params.id)
    .eq("restaurantId", params.restaurantId)
    .eq("platform", params.platform)
    .limit(1);

  const exists = !!existingRows && existingRows.length > 0;

  const payload = {
    id: params.id,
    restaurantId: params.restaurantId,
    platform: params.platform,
    author: params.author,
    rating: params.rating,
    comment: params.comment,
    reviewDate: params.reviewDate.toISOString(),
    syncedAt: params.syncedAt.toISOString(),
  };

  if (exists) {
    await supabaseAdmin
      .from("external_reviews")
      .update(payload)
      .eq("id", params.id)
      .eq("restaurantId", params.restaurantId)
      .eq("platform", params.platform);
    return false;
  }

  await supabaseAdmin.from("external_reviews").insert(payload);
  return true;
}

export async function fetchGoogleReviewsFromSerper(
  restaurantId: string,
  placeId?: string,
  sinceDate?: Date
): Promise<number> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error("SERPER_API_KEY environment variable is required");
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const { data: restaurants } = await supabaseAdmin
    .from("restaurants")
    .select("id,googlePlaceId")
    .eq("id", restaurantId)
    .limit(1);

  const restaurant = restaurants?.[0];
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  const finalPlaceId = placeId || restaurant.googlePlaceId;
  if (!finalPlaceId) {
    throw new Error("Place ID is required. Please provide a Google Place ID.");
  }

  if (placeId && placeId !== restaurant.googlePlaceId) {
    await supabaseAdmin.from("restaurants").update({ googlePlaceId: placeId }).eq("id", restaurantId);
  }

  const response = await fetch("https://google.serper.dev/reviews", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ placeId: finalPlaceId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Serper API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const payload = await response.json();
  const reviews: any[] = Array.isArray(payload?.reviews) ? payload.reviews : [];
  if (reviews.length === 0) {
    return 0;
  }

  const now = new Date();
  let createdCount = 0;

  for (const review of reviews) {
    const author = review?.user?.name || "Anonymous";
    const rating = Number(review?.rating || 0);
    const comment = String(review?.snippet || "");
    const reviewDate = parseDate(review?.isoDate || review?.date);

    if (sinceDate && reviewDate < sinceDate) {
      continue;
    }

    const id = sanitizeId(
      review?.id || `serper_${finalPlaceId}_${reviewDate.getTime()}_${author}`
    );

    const created = await upsertExternalReview({
      id,
      restaurantId,
      platform: "google",
      author,
      rating,
      comment,
      reviewDate,
      syncedAt: now,
    });

    if (created) {
      createdCount += 1;
    }
  }

  return createdCount;
}

export async function fetchMetaReviews(restaurantId: string, sinceDate?: Date): Promise<number> {
  const supabaseAdmin = getSupabaseAdminClient();

  const { data: integrations } = await supabaseAdmin
    .from("meta_integrations")
    .select("restaurantId,pageId,accessToken,status,lastSyncedAt")
    .eq("restaurantId", restaurantId)
    .limit(1);

  const integration = integrations?.[0];
  if (!integration || integration.status !== "active") {
    throw new Error("Meta integration not connected or inactive. Please connect your Meta account first.");
  }

  let accessToken: string;
  try {
    accessToken = decrypt(integration.accessToken);
  } catch {
    throw new Error("Failed to decrypt Meta access token");
  }

  const url = new URL(`https://graph.facebook.com/v21.0/${integration.pageId}`);
  url.searchParams.set("fields", "ratings{reviewer,rating,created_time,review_text,id}");
  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString());
  if (!response.ok) {
    if (response.status === 401) {
      await supabaseAdmin
        .from("meta_integrations")
        .update({ status: "expired" })
        .eq("restaurantId", restaurantId);
      throw new Error("Authentication failed. Please re-authorize your Meta account.");
    }
    const errorText = await response.text();
    throw new Error(`Meta API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const payload = await response.json();
  const ratings: any[] = Array.isArray(payload?.ratings?.data)
    ? payload.ratings.data
    : Array.isArray(payload?.ratings)
      ? payload.ratings
      : [];

  let createdCount = 0;
  const now = new Date();

  for (const ratingItem of ratings) {
    const reviewDate = parseDate(ratingItem?.created_time);
    if (sinceDate && reviewDate < sinceDate) {
      continue;
    }

    const id = sanitizeId(`meta_${integration.pageId}_${ratingItem?.id || ratingItem?.created_time || now.getTime()}`);
    const created = await upsertExternalReview({
      id,
      restaurantId,
      platform: "facebook",
      author: ratingItem?.reviewer?.name || "Anonymous",
      rating: Number(ratingItem?.rating || 0),
      comment: String(ratingItem?.review_text || ""),
      reviewDate,
      syncedAt: now,
    });

    if (created) {
      createdCount += 1;
    }
  }

  await supabaseAdmin
    .from("meta_integrations")
    .update({ lastSyncedAt: now.toISOString() })
    .eq("restaurantId", restaurantId);

  return createdCount;
}
