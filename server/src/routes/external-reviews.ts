import { Router } from "express";
import { AppDataSource } from "../data-source";
import { ExternalReview, Restaurant } from "../models";

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
    const { restaurantId } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const reviewRepo = AppDataSource.getRepository(ExternalReview);

    const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // TODO: Implement actual sync with Google, Facebook, Instagram APIs
    // For now, this is a placeholder that returns success
    // In Phase 2, this will:
    // 1. Fetch reviews from Google Reviews API
    // 2. Fetch reviews from Facebook Reviews API
    // 3. Fetch mentions/comments from Instagram API
    // 4. Store them in the database

    return res.json({
      success: true,
      message: "Sync initiated (placeholder - actual sync to be implemented)",
      syncedAt: new Date(),
    });
  } catch (error) {
    console.error("Error syncing external reviews:", error);
    return res.status(500).json({ error: "Failed to sync reviews" });
  }
});

export default router;

