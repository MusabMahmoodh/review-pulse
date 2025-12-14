import { Router } from "express";
import { AppDataSource } from "../data-source";
import { CustomerFeedback, Restaurant, ExternalReview } from "../models";

const router = Router();

/**
 * @swagger
 * /api/feedback/submit:
 *   post:
 *     summary: Submit customer feedback
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - foodRating
 *               - staffRating
 *               - ambienceRating
 *               - overallRating
 *             properties:
 *               restaurantId:
 *                 type: string
 *               customerName:
 *                 type: string
 *               customerContact:
 *                 type: string
 *               foodRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               staffRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               ambienceRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               overallRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               suggestions:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Internal server error
 */
router.post("/submit", async (req, res) => {
  try {
    const {
      restaurantId,
      customerName,
      customerContact,
      foodRating,
      staffRating,
      ambienceRating,
      overallRating,
      suggestions,
    } = req.body;

    if (!restaurantId || !foodRating || !staffRating || !ambienceRating || !overallRating) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate ratings
    const ratings = [foodRating, staffRating, ambienceRating, overallRating];
    if (ratings.some((r) => r < 1 || r > 5)) {
      return res.status(400).json({ error: "Invalid ratings (must be 1-5)" });
    }

    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const feedbackRepo = AppDataSource.getRepository(CustomerFeedback);

    // Validate restaurant exists
    const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Create feedback entry
    const feedback = feedbackRepo.create({
      id: `feedback_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      restaurantId,
      customerName: customerName || undefined,
      customerContact: customerContact || undefined,
      foodRating,
      staffRating,
      ambienceRating,
      overallRating,
      suggestions: suggestions || undefined,
    });

    await feedbackRepo.save(feedback);

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return res.status(500).json({ error: "Failed to submit feedback" });
  }
});

/**
 * @swagger
 * /api/feedback/list:
 *   get:
 *     summary: List feedback for a restaurant
 *     tags: [Feedback]
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: List of feedback
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feedback:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CustomerFeedback'
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

    const feedbackRepo = AppDataSource.getRepository(CustomerFeedback);

    const feedback = await feedbackRepo.find({
      where: { restaurantId },
      order: { createdAt: "DESC" },
    });

    return res.json({ feedback });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

/**
 * @swagger
 * /api/feedback/stats:
 *   get:
 *     summary: Get feedback statistics for a restaurant
 *     tags: [Feedback]
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Feedback statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalFeedback:
 *                       type: number
 *                     averageRatings:
 *                       type: object
 *                       properties:
 *                         food:
 *                           type: number
 *                         staff:
 *                           type: number
 *                         ambience:
 *                           type: number
 *                         overall:
 *                           type: number
 *                     recentTrend:
 *                       type: string
 *                       enum: [improving, stable, declining]
 *                     externalReviewsCount:
 *                       type: object
 *                       properties:
 *                         google:
 *                           type: number
 *                         facebook:
 *                           type: number
 *                         instagram:
 *                           type: number
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/stats", async (req, res) => {
  try {
    const restaurantId = req.query.restaurantId as string;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    const feedbackRepo = AppDataSource.getRepository(CustomerFeedback);
    const externalReviewRepo = AppDataSource.getRepository(ExternalReview);

    const feedback = await feedbackRepo.find({
      where: { restaurantId },
      order: { createdAt: "DESC" },
    });

    const externalReviews = await externalReviewRepo.find({
      where: { restaurantId },
    });

    // Calculate averages
    const totalFeedback = feedback.length;
    const avgFood =
      totalFeedback > 0 ? feedback.reduce((sum, f) => sum + f.foodRating, 0) / totalFeedback : 0;
    const avgStaff =
      totalFeedback > 0 ? feedback.reduce((sum, f) => sum + f.staffRating, 0) / totalFeedback : 0;
    const avgAmbience =
      totalFeedback > 0
        ? feedback.reduce((sum, f) => sum + f.ambienceRating, 0) / totalFeedback
        : 0;
    const avgOverall =
      totalFeedback > 0
        ? feedback.reduce((sum, f) => sum + f.overallRating, 0) / totalFeedback
        : 0;

    // Calculate trend (simple logic - compare last 3 vs previous 3)
    let recentTrend: "improving" | "stable" | "declining" = "stable";
    if (feedback.length >= 6) {
      const recent = feedback.slice(0, 3);
      const previous = feedback.slice(3, 6);
      const recentAvg = recent.reduce((sum, f) => sum + f.overallRating, 0) / 3;
      const previousAvg = previous.reduce((sum, f) => sum + f.overallRating, 0) / 3;
      if (recentAvg > previousAvg + 0.3) recentTrend = "improving";
      else if (recentAvg < previousAvg - 0.3) recentTrend = "declining";
    }

    const stats = {
      totalFeedback,
      averageRatings: {
        food: Math.round(avgFood * 100) / 100,
        staff: Math.round(avgStaff * 100) / 100,
        ambience: Math.round(avgAmbience * 100) / 100,
        overall: Math.round(avgOverall * 100) / 100,
      },
      recentTrend,
      externalReviewsCount: {
        google: externalReviews.filter((r) => r.platform === "google").length,
        facebook: externalReviews.filter((r) => r.platform === "facebook").length,
        instagram: externalReviews.filter((r) => r.platform === "instagram").length,
      },
    };

    return res.json({ stats });
  } catch (error) {
    console.error("Error calculating stats:", error);
    return res.status(500).json({ error: "Failed to calculate stats" });
  }
});

export default router;

