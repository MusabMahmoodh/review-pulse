import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Restaurant } from "../models";

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
router.get("/keywords", async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId as string;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
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

export default router;

