import { Router } from "express";
import { AppDataSource } from "../data-source";
import { ExternalReview, Restaurant, GoogleIntegration } from "../models";
import { fetchGoogleReviews } from "../utils/google-reviews";

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
router.get("/list", async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId as string;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

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
router.post("/sync", async (req, res) => {
  try {
    const { restaurantId, platforms } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const integrationRepo = AppDataSource.getRepository(GoogleIntegration);

    const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    const platformsToSync = platforms || ["google"];
    const results: Record<string, { success: boolean; count: number; error?: string }> = {};

    // Sync Google Reviews
    if (platformsToSync.includes("google")) {
      try {
        const integration = await integrationRepo.findOne({ where: { restaurantId } });

        if (!integration || integration.status !== "active") {
          results.google = {
            success: false,
            count: 0,
            error: "Google integration not connected or inactive. Please connect your Google account first.",
          };
        } else {
          // Get last sync time for incremental sync
          const sinceDate = integration.lastSyncedAt || undefined;
          const count = await fetchGoogleReviews(restaurantId, sinceDate);

          results.google = {
            success: true,
            count,
          };
        }
      } catch (error: any) {
        console.error("Google sync error:", error);
        results.google = {
          success: false,
          count: 0,
          error: error.message || "Failed to sync Google reviews",
        };
      }
    }

    // TODO: Add Facebook and Instagram sync here

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

