import { Router } from "express";
import { AppDataSource } from "../data-source";
import { AIInsight, Restaurant, CustomerFeedback, ExternalReview } from "../models";
import { generateInsights, chatAboutFeedback } from "../utils/openai";
import { MoreThanOrEqual } from "typeorm";
import { requireAuth } from "../middleware/auth";

const router = Router();

type TimePeriod = "2days" | "week" | "month" | "2months" | "3months" | "4months" | "5months" | "6months";

/**
 * Calculate the start date based on time period
 */
function getStartDate(period: TimePeriod): Date {
  const now = new Date();
  const startDate = new Date(now);

  switch (period) {
    case "2days":
      startDate.setDate(now.getDate() - 2);
      break;
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "2months":
      startDate.setMonth(now.getMonth() - 2);
      break;
    case "3months":
      startDate.setMonth(now.getMonth() - 3);
      break;
    case "4months":
      startDate.setMonth(now.getMonth() - 4);
      break;
    case "5months":
      startDate.setMonth(now.getMonth() - 5);
      break;
    case "6months":
      startDate.setMonth(now.getMonth() - 6);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  return startDate;
}

/**
 * @swagger
 * /api/ai/insights:
 *   get:
 *     summary: Get AI insights for a restaurant
 *     tags: [AI]
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *       - in: query
 *         name: timePeriod
 *         required: false
 *         schema:
 *           type: string
 *           enum: [2days, week, month, 2months, 3months, 4months, 5months, 6months]
 *         description: Time period for filtering insights (defaults to most recent)
 *     responses:
 *       200:
 *         description: AI insights
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 insight:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                     restaurantId:
 *                       type: string
 *                     summary:
 *                       type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     sentiment:
 *                       type: string
 *                       enum: [positive, neutral, negative]
 *                     keyTopics:
 *                       type: array
 *                       items:
 *                         type: string
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/insights", requireAuth, async (req, res) => {
  try {
    const restaurantId = req.restaurantId as string;
    const timePeriod = req.query.timePeriod as TimePeriod | undefined;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    const insightRepo = AppDataSource.getRepository(AIInsight);

    let query = insightRepo
      .createQueryBuilder("insight")
      .where("insight.restaurantId = :restaurantId", { restaurantId });

    // If time period is specified, filter insights generated within that period
    if (timePeriod) {
      const validPeriods: TimePeriod[] = [
        "2days",
        "week",
        "month",
        "2months",
        "3months",
        "4months",
        "5months",
        "6months",
      ];
      if (!validPeriods.includes(timePeriod)) {
        return res.status(400).json({
          error: `Invalid time period. Must be one of: ${validPeriods.join(", ")}`,
        });
      }

      const startDate = getStartDate(timePeriod);
      query = query.andWhere("insight.generatedAt >= :startDate", { startDate });
    }

    const insights = await query.orderBy("insight.generatedAt", "DESC").take(1).getMany();

    if (insights.length === 0) {
      return res.json({ insight: null });
    }

    return res.json({ insight: insights[0] });
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    return res.status(500).json({ error: "Failed to fetch insights" });
  }
});

/**
 * @swagger
 * /api/ai/generate-insights:
 *   post:
 *     summary: Generate AI insights for a restaurant
 *     tags: [AI]
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
 *               timePeriod:
 *                 type: string
 *                 enum: [2days, week, month, 2months, 3months, 4months, 5months, 6months]
 *                 description: Time period for analysis (defaults to month)
 *     responses:
 *       200:
 *         description: Insights generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 insight:
 *                   type: object
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Internal server error
 */
router.post("/generate-insights", requireAuth, async (req, res) => {
  try {
    const { timePeriod = "month" } = req.body;
    const restaurantId = req.restaurantId as string;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    // Validate time period
    const validPeriods: TimePeriod[] = [
      "2days",
      "week",
      "month",
      "2months",
      "3months",
      "4months",
      "5months",
      "6months",
    ];
    if (!validPeriods.includes(timePeriod)) {
      return res.status(400).json({
        error: `Invalid time period. Must be one of: ${validPeriods.join(", ")}`,
      });
    }

    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const feedbackRepo = AppDataSource.getRepository(CustomerFeedback);
    const reviewRepo = AppDataSource.getRepository(ExternalReview);
    const insightRepo = AppDataSource.getRepository(AIInsight);

    const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Calculate start date based on time period
    const startDate = getStartDate(timePeriod);

    // Get feedback for analysis within the time period
    const feedback = await feedbackRepo.find({
      where: {
        restaurantId,
        createdAt: MoreThanOrEqual(startDate),
      },
      order: { createdAt: "DESC" },
    });

    // Get external reviews for analysis within the time period
    const reviews = await reviewRepo.find({
      where: {
        restaurantId,
        reviewDate: MoreThanOrEqual(startDate),
      },
      order: { reviewDate: "DESC" },
    });

    // Check if we have any data to analyze
    if (feedback.length === 0 && reviews.length === 0) {
      return res.status(400).json({
        error: `No feedback or reviews found for the selected time period (${timePeriod})`,
      });
    }

    // Generate insights using OpenAI
    let insightData;
    try {
      insightData = await generateInsights(feedback, reviews, restaurant.name);
    } catch (error: any) {
      console.error("OpenAI error:", error);
      return res.status(500).json({
        error: error.message || "Failed to generate insights with AI",
      });
    }

    // Save insight to database
    const insight = insightRepo.create({
      id: `insight_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      restaurantId,
      summary: insightData.summary,
      recommendations: insightData.recommendations,
      sentiment: insightData.sentiment,
      keyTopics: insightData.keyTopics,
    });

    await insightRepo.save(insight);

    return res.json({
      success: true,
      insight,
      message: `Insights generated successfully for ${timePeriod} period`,
    });
  } catch (error) {
    console.error("Error generating insights:", error);
    return res.status(500).json({ error: "Failed to generate insights" });
  }
});

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: AI chat - Ask questions about restaurant feedback
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - message
 *             properties:
 *               restaurantId:
 *                 type: string
 *               message:
 *                 type: string
 *                 description: User's question about their feedback
 *     responses:
 *       200:
 *         description: AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 response:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/chat", requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    const restaurantId = req.restaurantId as string;

    if (!restaurantId || !message) {
      return res.status(400).json({ error: "Message required" });
    }

    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const feedbackRepo = AppDataSource.getRepository(CustomerFeedback);
    const reviewRepo = AppDataSource.getRepository(ExternalReview);

    const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Get recent feedback and reviews for context (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const feedback = await feedbackRepo.find({
      where: {
        restaurantId,
        createdAt: MoreThanOrEqual(thirtyDaysAgo),
      },
      order: { createdAt: "DESC" },
      take: 50, // Limit to recent 50 for context
    });

    const reviews = await reviewRepo.find({
      where: {
        restaurantId,
        reviewDate: MoreThanOrEqual(thirtyDaysAgo),
      },
      order: { reviewDate: "DESC" },
      take: 50, // Limit to recent 50 for context
    });

    // Generate AI response using OpenAI
    let aiResponse;
    try {
      aiResponse = await chatAboutFeedback(message, feedback, reviews, restaurant.name);
    } catch (error: any) {
      console.error("OpenAI chat error:", error);
      return res.status(500).json({
        error: error.message || "Failed to process chat message with AI",
      });
    }

    return res.json({
      success: true,
      response: aiResponse,
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    return res.status(500).json({ error: "Failed to process chat message" });
  }
});

export default router;

