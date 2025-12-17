import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Restaurant, GoogleIntegration, MetaIntegration, ReviewPageSettings } from "../models";
import { requireAuth } from "../middleware/auth";
import { isPremium } from "../utils/subscription";

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

    // Check premium access
    const hasPremium = await isPremium(restaurantId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: "Premium subscription required",
        requiresPremium: true,
      });
    }

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

    // Check premium access
    const hasPremium = await isPremium(restaurantId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: "Premium subscription required",
        requiresPremium: true,
      });
    }

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

    // Check premium access
    const hasPremium = await isPremium(restaurantId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: "Premium subscription required",
        requiresPremium: true,
      });
    }

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

    // Check premium access
    const hasPremium = await isPremium(restaurantId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: "Premium subscription required",
        requiresPremium: true,
      });
    }

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

/**
 * @swagger
 * /api/restaurants/review-page-settings:
 *   get:
 *     summary: Get review page settings for a restaurant
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
 *         description: Review page settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 welcomeMessage:
 *                   type: string
 *                 primaryColor:
 *                   type: string
 *                 secondaryColor:
 *                   type: string
 *                 backgroundColor:
 *                   type: string
 *                 designVariation:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/review-page-settings", async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId as string;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    const settingsRepo = AppDataSource.getRepository(ReviewPageSettings);
    let settings = await settingsRepo.findOne({ where: { restaurantId } });

    // If no settings exist, return defaults
    if (!settings) {
      return res.json({
        welcomeMessage: "We Value Your Feedback",
        primaryColor: "#3b82f6",
        secondaryColor: "#1e40af",
        backgroundColor: "#f3f4f6",
        designVariation: "default",
      });
    }

    return res.json({
      welcomeMessage: settings.welcomeMessage,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      backgroundColor: settings.backgroundColor,
      designVariation: settings.designVariation,
    });
  } catch (error) {
    console.error("Error fetching review page settings:", error);
    return res.status(500).json({ error: "Failed to fetch review page settings" });
  }
});

/**
 * @swagger
 * /api/restaurants/review-page-settings:
 *   put:
 *     summary: Update review page settings (premium only)
 *     tags: [Restaurants]
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
 *               welcomeMessage:
 *                 type: string
 *               primaryColor:
 *                 type: string
 *               secondaryColor:
 *                 type: string
 *               backgroundColor:
 *                 type: string
 *               designVariation:
 *                 type: string
 *                 enum: [default, modern, minimal, elegant]
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Premium subscription required
 *       500:
 *         description: Internal server error
 */
router.put("/review-page-settings", requireAuth, async (req, res) => {
  try {
    const restaurantId = req.restaurantId as string;
    const { welcomeMessage, primaryColor, secondaryColor, backgroundColor, designVariation } = req.body;

    // Check premium access
    const hasPremium = await isPremium(restaurantId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: "Premium subscription required",
        requiresPremium: true,
      });
    }

    // Validate restaurant exists
    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Validate design variation
    const validVariations = ["default", "modern", "minimal", "elegant"];
    if (designVariation && !validVariations.includes(designVariation)) {
      return res.status(400).json({ error: `Design variation must be one of: ${validVariations.join(", ")}` });
    }

    // Validate color format (hex)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (primaryColor && !hexColorRegex.test(primaryColor)) {
      return res.status(400).json({ error: "Primary color must be a valid hex color (e.g., #3b82f6)" });
    }
    if (secondaryColor && !hexColorRegex.test(secondaryColor)) {
      return res.status(400).json({ error: "Secondary color must be a valid hex color (e.g., #1e40af)" });
    }
    if (backgroundColor && !hexColorRegex.test(backgroundColor)) {
      return res.status(400).json({ error: "Background color must be a valid hex color (e.g., #f3f4f6)" });
    }

    const settingsRepo = AppDataSource.getRepository(ReviewPageSettings);
    let settings = await settingsRepo.findOne({ where: { restaurantId } });

    if (!settings) {
      // Create new settings
      settings = settingsRepo.create({
        restaurantId,
        welcomeMessage: welcomeMessage || "We Value Your Feedback",
        primaryColor: primaryColor || "#3b82f6",
        secondaryColor: secondaryColor || "#1e40af",
        backgroundColor: backgroundColor || "#f3f4f6",
        designVariation: designVariation || "default",
      });
    } else {
      // Update existing settings
      if (welcomeMessage !== undefined) settings.welcomeMessage = welcomeMessage;
      if (primaryColor !== undefined) settings.primaryColor = primaryColor;
      if (secondaryColor !== undefined) settings.secondaryColor = secondaryColor;
      if (backgroundColor !== undefined) settings.backgroundColor = backgroundColor;
      if (designVariation !== undefined) settings.designVariation = designVariation;
    }

    await settingsRepo.save(settings);

    return res.json({
      success: true,
      message: "Review page settings updated successfully",
      settings: {
        welcomeMessage: settings.welcomeMessage,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        backgroundColor: settings.backgroundColor,
        designVariation: settings.designVariation,
      },
    });
  } catch (error) {
    console.error("Error updating review page settings:", error);
    return res.status(500).json({ error: "Failed to update review page settings" });
  }
});

export default router;

