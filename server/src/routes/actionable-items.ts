import { Router } from "express";
import { AppDataSource } from "../data-source";
import { ActionableItem, Restaurant, CustomerFeedback, ExternalReview, AIInsight } from "../models";
import { requireAuth } from "../middleware/auth";
import { isPremium } from "../utils/subscription";

const router = Router();

/**
 * @swagger
 * /api/actionable-items:
 *   get:
 *     summary: Get all actionable items for a restaurant
 *     tags: [ActionableItems]
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *       - in: query
 *         name: completed
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Filter by completion status
 *     responses:
 *       200:
 *         description: List of actionable items
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const restaurantId = req.restaurantId as string;
    const completed = req.query.completed as string | undefined;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    // Check premium access
    const hasPremium = await isPremium(restaurantId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: "Premium subscription required",
        requiresPremium: true,
      });
    }

    const actionableItemRepo = AppDataSource.getRepository(ActionableItem);

    const query = actionableItemRepo
      .createQueryBuilder("item")
      .where("item.restaurantId = :restaurantId", { restaurantId });

    if (completed !== undefined) {
      query.andWhere("item.completed = :completed", { completed: completed === "true" });
    }

    const items = await query.orderBy("item.createdAt", "DESC").getMany();

    return res.json({ items });
  } catch (error) {
    console.error("Error fetching actionable items:", error);
    return res.status(500).json({ error: "Failed to fetch actionable items" });
  }
});

/**
 * @swagger
 * /api/actionable-items:
 *   post:
 *     summary: Create a new actionable item
 *     tags: [ActionableItems]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - title
 *               - sourceType
 *               - sourceId
 *             properties:
 *               restaurantId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               sourceType:
 *                 type: string
 *                 enum: [comment, ai_suggestion]
 *               sourceId:
 *                 type: string
 *               sourceText:
 *                 type: string
 *     responses:
 *       201:
 *         description: Actionable item created
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, sourceType, sourceId, sourceText } = req.body;
    const restaurantId = req.restaurantId as string;

    if (!restaurantId || !title || !sourceType || !sourceId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (sourceType !== "comment" && sourceType !== "ai_suggestion") {
      return res.status(400).json({ error: "Invalid sourceType. Must be 'comment' or 'ai_suggestion'" });
    }

    // Check premium access
    const hasPremium = await isPremium(restaurantId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: "Premium subscription required",
        requiresPremium: true,
      });
    }

    // Verify source exists
    if (sourceType === "comment") {
      const feedbackRepo = AppDataSource.getRepository(CustomerFeedback);
      const reviewRepo = AppDataSource.getRepository(ExternalReview);
      
      const feedback = await feedbackRepo.findOne({ where: { id: sourceId, restaurantId } });
      const review = await reviewRepo.findOne({ where: { id: sourceId, restaurantId } });
      
      if (!feedback && !review) {
        return res.status(404).json({ error: "Source comment not found" });
      }
    } else if (sourceType === "ai_suggestion") {
      const insightRepo = AppDataSource.getRepository(AIInsight);
      const insight = await insightRepo.findOne({ where: { id: sourceId, restaurantId } });
      
      if (!insight) {
        return res.status(404).json({ error: "Source AI insight not found" });
      }
    }

    const actionableItemRepo = AppDataSource.getRepository(ActionableItem);

    const item = actionableItemRepo.create({
      id: `actionable_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      restaurantId,
      title,
      description: description || undefined,
      sourceType,
      sourceId,
      sourceText: sourceText || undefined,
      completed: false,
    });

    await actionableItemRepo.save(item);

    return res.status(201).json({
      success: true,
      item,
    });
  } catch (error) {
    console.error("Error creating actionable item:", error);
    return res.status(500).json({ error: "Failed to create actionable item" });
  }
});

/**
 * @swagger
 * /api/actionable-items/{id}:
 *   patch:
 *     summary: Update an actionable item
 *     tags: [ActionableItems]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Actionable item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Actionable item updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Item not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;
    const restaurantId = req.restaurantId as string;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    // Check premium access
    const hasPremium = await isPremium(restaurantId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: "Premium subscription required",
        requiresPremium: true,
      });
    }

    const actionableItemRepo = AppDataSource.getRepository(ActionableItem);

    const item = await actionableItemRepo.findOne({
      where: { id, restaurantId },
    });

    if (!item) {
      return res.status(404).json({ error: "Actionable item not found" });
    }

    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (completed !== undefined) item.completed = completed;

    await actionableItemRepo.save(item);

    return res.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error("Error updating actionable item:", error);
    return res.status(500).json({ error: "Failed to update actionable item" });
  }
});

/**
 * @swagger
 * /api/actionable-items/{id}:
 *   delete:
 *     summary: Delete an actionable item
 *     tags: [ActionableItems]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Actionable item ID
 *     responses:
 *       200:
 *         description: Actionable item deleted
 *       404:
 *         description: Item not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.restaurantId as string;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    // Check premium access
    const hasPremium = await isPremium(restaurantId);
    if (!hasPremium) {
      return res.status(403).json({ 
        error: "Premium subscription required",
        requiresPremium: true,
      });
    }

    const actionableItemRepo = AppDataSource.getRepository(ActionableItem);

    const item = await actionableItemRepo.findOne({
      where: { id, restaurantId },
    });

    if (!item) {
      return res.status(404).json({ error: "Actionable item not found" });
    }

    await actionableItemRepo.remove(item);

    return res.json({
      success: true,
      message: "Actionable item deleted",
    });
  } catch (error) {
    console.error("Error deleting actionable item:", error);
    return res.status(500).json({ error: "Failed to delete actionable item" });
  }
});

export default router;

