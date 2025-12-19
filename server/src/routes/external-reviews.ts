import { Router } from "express";
import { AppDataSource } from "../data-source";
import { ExternalReview, Restaurant, MetaIntegration } from "../models";
import { fetchGoogleReviewsFromSerper } from "../utils/serper-reviews";
import { fetchMetaReviews } from "../utils/meta-posts";
import { requireAuth } from "../middleware/auth";
import { isPremium } from "../utils/subscription";

const router = Router();

/**
 * @swagger
 * /api/external-reviews/list:
 *   get:
 *     summary: List external reviews for a restaurant
 *     tags: [External Reviews]
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: List of external reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ExternalReview'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/list", requireAuth, async (req, res) => {
  try {
    const restaurantId = req.restaurantId as string;

    const reviewRepo = AppDataSource.getRepository(ExternalReview);

    const reviews = await reviewRepo.find({
      where: { restaurantId },
      order: { reviewDate: "DESC" },
    });

    return res.json({ reviews });
  } catch (error) {
    console.error("Error fetching external reviews:", error);
    return res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

/**
 * @swagger
 * /api/external-reviews/sync:
 *   post:
 *     summary: Sync external reviews from Google, Facebook, Instagram
 *     tags: [External Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *             properties:
 *               restaurantId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sync initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 syncedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Internal server error
 */
router.post("/sync", requireAuth, async (req, res) => {
  try {
    const restaurantId = req.restaurantId as string;
    const { platforms } = req.body;

    // Check premium access
    const hasPremium = await isPremium(restaurantId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: "Premium subscription required",
        requiresPremium: true,
      });
    }

    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const metaIntegrationRepo = AppDataSource.getRepository(MetaIntegration);

    const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const platformsToSync = platforms || ["google"];
    const results: Record<string, { success: boolean; count: number; error?: string }> = {};
    const { placeId } = req.body; // Optional Place ID for Serper API

    // Sync Google Reviews via Serper API
    if (platformsToSync.includes("google")) {
      try {
        // Use provided placeId, or get from restaurant's saved placeId
        let finalPlaceId = placeId;
        if (!finalPlaceId && restaurant.googlePlaceId) {
          finalPlaceId = restaurant.googlePlaceId;
        }
        
        if (!finalPlaceId) {
          results.google = {
            success: false,
            count: 0,
            error: "Place ID is required. Please provide a Google Place ID.",
          };
        } else {
          // Get last sync time for incremental sync
          // Find the most recent synced review to determine sinceDate
          const reviewRepo = AppDataSource.getRepository(ExternalReview);
          const lastReview = await reviewRepo.findOne({
            where: { restaurantId, platform: "google" },
            order: { syncedAt: "DESC" },
          });
          
          const sinceDate = lastReview?.syncedAt || undefined;
          const count = await fetchGoogleReviewsFromSerper(restaurantId, finalPlaceId, sinceDate);

          results.google = {
            success: true,
            count,
          };
        }
      } catch (error: any) {
        console.error("Serper sync error:", error);
        results.google = {
          success: false,
          count: 0,
          error: error.message || "Failed to sync Google reviews via Serper API",
        };
      }
    }

    // Sync Facebook Reviews
    if (platformsToSync.includes("facebook") || platformsToSync.includes("meta")) {
      try {
        const integration = await metaIntegrationRepo.findOne({ where: { restaurantId } });

        if (!integration || integration.status !== "active") {
          results.facebook = {
            success: false,
            count: 0,
            error: "Meta integration not connected or inactive. Please connect your Meta account first.",
          };
        } else {
          // Get last sync time for incremental sync
          const sinceDate = integration.lastSyncedAt || undefined;
          const count = await fetchMetaReviews(restaurantId, sinceDate);

          results.facebook = {
            success: true,
            count,
          };
        }
      } catch (error: any) {
        console.error("Meta sync error:", error);
        results.facebook = {
          success: false,
          count: 0,
          error: error.message || "Failed to sync Meta reviews",
        };
      }
    }

    // Check if any sync succeeded
    const hasSuccess = Object.values(results).some((r) => r.success);
    const totalSynced = Object.values(results).reduce((sum, r) => sum + r.count, 0);

    return res.json({
      success: hasSuccess,
      results,
      totalSynced,
      syncedAt: new Date(),
    });
  } catch (error) {
    console.error("Error syncing external reviews:", error);
    return res.status(500).json({ error: "Failed to sync reviews" });
  }
});


export default router;

