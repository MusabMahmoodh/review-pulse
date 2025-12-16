import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Restaurant, GoogleIntegration, MetaIntegration } from "../models";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/restaurants/keywords:
 *   get:
 *     summary: Get restaurant social keywords
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant keywords
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keywords:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Internal server error
 */
router.get("/keywords", requireAuth, async (req, res) => {
  try {
    const restaurantId = req.restaurantId as string;

    const restaurantRepo = AppDataSource.getRepository(Restaurant);

    const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    return res.json({ keywords: restaurant.socialKeywords || [] });
  } catch (error) {
    console.error("Error fetching keywords:", error);
    return res.status(500).json({ error: "Failed to fetch keywords" });
  }
});

/**
 * @swagger
 * /api/restaurants/keywords:
 *   put:
 *     summary: Update restaurant social keywords
 *     tags: [Restaurants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - keywords
 *             properties:
 *               restaurantId:
 *                 type: string
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Keywords updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Internal server error
 */
router.put("/keywords", requireAuth, async (req, res) => {
  try {
    const restaurantId = req.restaurantId as string;
    const { keywords } = req.body;

    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: "Keywords array required" });
    }

    if (keywords.length < 3 || keywords.length > 5) {
      return res.status(400).json({ error: "Keywords must be between 3 and 5" });
    }

    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId } });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    restaurant.socialKeywords = keywords;
    await restaurantRepo.save(restaurant);

    return res.json({
      success: true,
      message: "Keywords updated successfully",
      keywords: restaurant.socialKeywords,
    });
  } catch (error) {
    console.error("Error updating keywords:", error);
    return res.status(500).json({ error: "Failed to update keywords" });
  }
});

/**
 * @swagger
 * /api/restaurants/google-integration:
 *   get:
 *     summary: Get Google integration status for a restaurant
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Google integration status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connected:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 lastSyncedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/google-integration", requireAuth, async (req, res) => {
  try {
    const restaurantId = req.restaurantId as string;

    const integrationRepo = AppDataSource.getRepository(GoogleIntegration);
    const integration = await integrationRepo.findOne({ where: { restaurantId } });

    if (!integration) {
      return res.json({
        connected: false,
        status: null,
        lastSyncedAt: null,
      });
    }

    return res.json({
      connected: true,
      status: integration.status,
      lastSyncedAt: integration.lastSyncedAt || null,
    });
  } catch (error) {
    console.error("Error fetching Google integration:", error);
    return res.status(500).json({ error: "Failed to fetch integration status" });
  }
});

/**
 * @swagger
 * /api/restaurants/meta-integration:
 *   get:
 *     summary: Get Meta integration status for a restaurant
 *     tags: [Restaurants]
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Meta integration status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 connected:
 *                   type: boolean
 *                 status:
 *                   type: string
 *                 lastSyncedAt:
 *                   type: string
 *                   format: date-time
 *                 pageId:
 *                   type: string
 *                 instagramBusinessAccountId:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/meta-integration", requireAuth, async (req, res) => {
  try {
    const restaurantId = req.restaurantId as string;

    const integrationRepo = AppDataSource.getRepository(MetaIntegration);
    const integration = await integrationRepo.findOne({ where: { restaurantId } });

    if (!integration) {
      return res.json({
        connected: false,
        status: null,
        lastSyncedAt: null,
        pageId: null,
        instagramBusinessAccountId: null,
      });
    }

    return res.json({
      connected: true,
      status: integration.status,
      lastSyncedAt: integration.lastSyncedAt || null,
      pageId: integration.pageId,
      instagramBusinessAccountId: integration.instagramBusinessAccountId || null,
    });
  } catch (error) {
    console.error("Error fetching Meta integration:", error);
    return res.status(500).json({ error: "Failed to fetch integration status" });
  }
});

export default router;

