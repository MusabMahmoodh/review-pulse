import { Router } from "express";
import { AppDataSource } from "../data-source";
import { AIInsight, Teacher, Organization, StudentFeedback, ExternalReview } from "../models";
import { generateInsights, chatAboutFeedback, chatAboutFeedbackStream } from "../utils/openai";
import { MoreThanOrEqual } from "typeorm";
import { requireAuth } from "../middleware/auth";
import { isPremium } from "../utils/subscription";

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
 *     summary: Get AI insights for a teacher
 *     tags: [AI]
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
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
 *                     teacherId:
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
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;
    const timePeriod = req.query.timePeriod as TimePeriod | undefined;
    const formId = req.query.formId as string | undefined;

    if (!teacherId && !organizationId) {
      return res.status(400).json({ error: "Teacher ID or organization ID required" });
    }

    // Check premium access
    if (teacherId) {
      const hasPremium = await isPremium(teacherId, "teacher");
      if (!hasPremium) {
        return res.status(403).json({ 
          error: "Premium subscription required",
          requiresPremium: true,
        });
      }
    } else if (organizationId) {
      const hasPremium = await isPremium(organizationId, "organization");
      if (!hasPremium) {
        return res.status(403).json({ 
          error: "Premium subscription required",
          requiresPremium: true,
        });
      }
    }

    const insightRepo = AppDataSource.getRepository(AIInsight);

    let query = insightRepo.createQueryBuilder("insight");
    if (teacherId) {
      query = query.where("insight.teacherId = :teacherId", { teacherId });
    } else if (organizationId) {
      query = query.where("insight.organizationId = :organizationId", { organizationId });
    }

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
 *     summary: Generate AI insights for a teacher
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacherId
 *             properties:
 *               teacherId:
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
 *         description: Teacher not found
 *       500:
 *         description: Internal server error
 */
router.post("/generate-insights", requireAuth, async (req, res) => {
  try {
    const { timePeriod = "month", filter = "overall", formId } = req.body;
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;
    
    // Validate filter type
    const validFilters = ["external", "internal", "overall"];
    if (!validFilters.includes(filter)) {
      return res.status(400).json({
        error: `Invalid filter. Must be one of: ${validFilters.join(", ")}`,
      });
    }

    if (!teacherId && !organizationId) {
      return res.status(400).json({ error: "Teacher ID or organization ID required" });
    }

    // Check premium access
    if (teacherId) {
      const hasPremium = await isPremium(teacherId, "teacher");
      if (!hasPremium) {
        return res.status(403).json({ 
          error: "Premium subscription required",
          requiresPremium: true,
        });
      }
    } else if (organizationId) {
      const hasPremium = await isPremium(organizationId, "organization");
      if (!hasPremium) {
        return res.status(403).json({ 
          error: "Premium subscription required",
          requiresPremium: true,
        });
      }
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

    const teacherRepo = AppDataSource.getRepository(Teacher);
    const orgRepo = AppDataSource.getRepository(Organization);
    const feedbackRepo = AppDataSource.getRepository(StudentFeedback);
    const reviewRepo = AppDataSource.getRepository(ExternalReview);
    const insightRepo = AppDataSource.getRepository(AIInsight);

    let teacher: Teacher | null = null;
    let organization: Organization | null = null;
    let teacherIds: string[] = [];

    if (teacherId) {
      teacher = await teacherRepo.findOne({ where: { id: teacherId } });
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }
      teacherIds = [teacherId];
    } else if (organizationId) {
      organization = await orgRepo.findOne({ where: { id: organizationId } });
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      // Get all teachers in organization
      const teachers = await teacherRepo.find({ where: { organizationId } });
      teacherIds = teachers.map(t => t.id);
    }

    // Calculate start date based on time period
    const startDate = getStartDate(timePeriod);

    // Get feedback for analysis within the time period
    let feedback: StudentFeedback[] = [];
    if (teacherId) {
      const whereCondition: any = {
        teacherId,
        createdAt: MoreThanOrEqual(startDate),
      };
      if (formId) {
        whereCondition.formId = formId;
      }
      feedback = await feedbackRepo.find({
        where: whereCondition,
        order: { createdAt: "DESC" },
      });
    } else if (organizationId) {
      // Get organization-level feedback and all teachers' feedback
      const orgWhereCondition: any = {
        organizationId,
        createdAt: MoreThanOrEqual(startDate),
      };
      if (formId) {
        orgWhereCondition.formId = formId;
      }
      const orgFeedback = await feedbackRepo.find({
        where: orgWhereCondition,
        order: { createdAt: "DESC" },
      });
      
      const teachersWhereConditions = teacherIds.map(id => {
        const condition: any = { teacherId: id, createdAt: MoreThanOrEqual(startDate) };
        if (formId) {
          condition.formId = formId;
        }
        return condition;
      });
      const teachersFeedback = await feedbackRepo.find({
        where: teachersWhereConditions,
        order: { createdAt: "DESC" },
      });
      feedback = [...orgFeedback, ...teachersFeedback];
    }

    // Get external reviews for analysis within the time period (only for teachers)
    let reviews: ExternalReview[] = [];
    if (teacherIds.length > 0) {
      reviews = await reviewRepo.find({
        where: teacherIds.map(id => ({ teacherId: id, reviewDate: MoreThanOrEqual(startDate) })),
        order: { reviewDate: "DESC" },
      });
    }

    // Filter data based on filter type
    if (filter === "internal") {
      reviews = []; // Only use internal feedback
      if (feedback.length === 0) {
        return res.status(400).json({
          error: `No internal feedback found for the selected time period (${timePeriod})`,
        });
      }
    } else if (filter === "external") {
      feedback = []; // Only use external reviews
      if (reviews.length === 0) {
        return res.status(400).json({
          error: `No external reviews found for the selected time period (${timePeriod})`,
        });
      }
    } else {
      // Overall - use both, but check if we have at least one
      if (feedback.length === 0 && reviews.length === 0) {
        return res.status(400).json({
          error: `No feedback or reviews found for the selected time period (${timePeriod})`,
        });
      }
    }

    // Generate insights using OpenAI
    let insightData;
    const entityName = teacherId ? teacher?.name : organization?.name || "Organization";
    console.log("Generating insights...");
    console.log(`Filter: ${filter}`);
    console.log(`Feedback count: ${feedback.length}`);
    console.log(`Reviews count: ${reviews.length}`);
    console.log(entityName);
    try {
      insightData = await generateInsights(feedback, reviews, entityName);
    } catch (error: any) {
      console.error("OpenAI error:", error);
      return res.status(500).json({
        error: error.message || "Failed to generate insights with AI",
      });
    }

    // Save insight to database
    const insight = insightRepo.create({
      id: `insight_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      teacherId: teacherId || undefined,
      organizationId: organizationId || undefined,
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
 *     summary: AI chat - Ask questions about teacher feedback
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacherId
 *               - message
 *             properties:
 *               teacherId:
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
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;

    if ((!teacherId && !organizationId) || !message) {
      return res.status(400).json({ error: "Message required" });
    }

    // Check premium access
    if (teacherId) {
      const hasPremium = await isPremium(teacherId, "teacher");
      if (!hasPremium) {
        return res.status(403).json({ 
          error: "Premium subscription required",
          requiresPremium: true,
        });
      }
    } else if (organizationId) {
      const hasPremium = await isPremium(organizationId, "organization");
      if (!hasPremium) {
        return res.status(403).json({ 
          error: "Premium subscription required",
          requiresPremium: true,
        });
      }
    }

    const teacherRepo = AppDataSource.getRepository(Teacher);
    const orgRepo = AppDataSource.getRepository(Organization);
    const feedbackRepo = AppDataSource.getRepository(StudentFeedback);
    const reviewRepo = AppDataSource.getRepository(ExternalReview);

    let teacher: Teacher | null = null;
    let organization: Organization | null = null;
    let teacherIds: string[] = [];
    let entityName = "";

    if (teacherId) {
      teacher = await teacherRepo.findOne({ where: { id: teacherId } });
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }
      entityName = teacher.name;
      teacherIds = [teacherId];
    } else if (organizationId) {
      organization = await orgRepo.findOne({ where: { id: organizationId } });
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      entityName = organization.name;
      const teachers = await teacherRepo.find({ where: { organizationId } });
      teacherIds = teachers.map(t => t.id);
    }

    // Get recent feedback and reviews for context (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let feedback: StudentFeedback[] = [];
    if (teacherId) {
      feedback = await feedbackRepo.find({
        where: {
          teacherId,
          createdAt: MoreThanOrEqual(thirtyDaysAgo),
        },
        order: { createdAt: "DESC" },
      });
    } else if (organizationId) {
      const orgFeedback = await feedbackRepo.find({
        where: {
          organizationId,
          createdAt: MoreThanOrEqual(thirtyDaysAgo),
        },
        order: { createdAt: "DESC" },
      });
      const teachersFeedback = await feedbackRepo.find({
        where: teacherIds.map(id => ({ teacherId: id, createdAt: MoreThanOrEqual(thirtyDaysAgo) })),
        order: { createdAt: "DESC" },
      });
      feedback = [...orgFeedback, ...teachersFeedback];
    }

    const reviews = await reviewRepo.find({
      where: teacherIds.map(id => ({ teacherId: id, reviewDate: MoreThanOrEqual(thirtyDaysAgo) })),
      order: { reviewDate: "DESC" },
    });

    // Generate AI response using OpenAI
    let aiResponse;
    try {
      aiResponse = await chatAboutFeedback(message, feedback, reviews, entityName);
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

/**
 * @swagger
 * /api/ai/chat/stream:
 *   post:
 *     summary: AI chat with streaming response - Ask questions about teacher feedback
 *     tags: [AI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacherId
 *               - message
 *             properties:
 *               teacherId:
 *                 type: string
 *               message:
 *                 type: string
 *                 description: User's question about their feedback
 *     responses:
 *       200:
 *         description: Streaming AI response (Server-Sent Events)
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/chat/stream", requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;

    if ((!teacherId && !organizationId) || !message) {
      return res.status(400).json({ error: "Message required" });
    }

    // Check premium access
    if (teacherId) {
      const hasPremium = await isPremium(teacherId, "teacher");
      if (!hasPremium) {
        return res.status(403).json({ 
          error: "Premium subscription required",
          requiresPremium: true,
        });
      }
    } else if (organizationId) {
      const hasPremium = await isPremium(organizationId, "organization");
      if (!hasPremium) {
        return res.status(403).json({ 
          error: "Premium subscription required",
          requiresPremium: true,
        });
      }
    }

    const teacherRepo = AppDataSource.getRepository(Teacher);
    const orgRepo = AppDataSource.getRepository(Organization);
    const feedbackRepo = AppDataSource.getRepository(StudentFeedback);
    const reviewRepo = AppDataSource.getRepository(ExternalReview);

    let teacher: Teacher | null = null;
    let organization: Organization | null = null;
    let teacherIds: string[] = [];
    let entityName = "";

    if (teacherId) {
      teacher = await teacherRepo.findOne({ where: { id: teacherId } });
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }
      entityName = teacher.name;
      teacherIds = [teacherId];
    } else if (organizationId) {
      organization = await orgRepo.findOne({ where: { id: organizationId } });
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      entityName = organization.name;
      const teachers = await teacherRepo.find({ where: { organizationId } });
      teacherIds = teachers.map(t => t.id);
    }

    // Get recent feedback and reviews for context (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let feedback: StudentFeedback[] = [];
    if (teacherId) {
      feedback = await feedbackRepo.find({
        where: {
          teacherId,
          createdAt: MoreThanOrEqual(thirtyDaysAgo),
        },
        order: { createdAt: "DESC" },
      });
    } else if (organizationId) {
      const orgFeedback = await feedbackRepo.find({
        where: {
          organizationId,
          createdAt: MoreThanOrEqual(thirtyDaysAgo),
        },
        order: { createdAt: "DESC" },
      });
      const teachersFeedback = await feedbackRepo.find({
        where: teacherIds.map(id => ({ teacherId: id, createdAt: MoreThanOrEqual(thirtyDaysAgo) })),
        order: { createdAt: "DESC" },
      });
      feedback = [...orgFeedback, ...teachersFeedback];
    }

    const reviews = await reviewRepo.find({
      where: teacherIds.map(id => ({ teacherId: id, reviewDate: MoreThanOrEqual(thirtyDaysAgo) })),
      order: { reviewDate: "DESC" },
    });

    // Set headers for Server-Sent Events
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    // Generate streaming AI response
    try {
      const stream = chatAboutFeedbackStream(message, feedback, reviews, entityName);
      
      for await (const chunk of stream) {
        // Send chunk as SSE data
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
      
      // Send completion marker
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (error: any) {
      console.error("OpenAI streaming chat error:", error);
      res.write(`data: ${JSON.stringify({ error: error.message || "Failed to process chat message with AI" })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error("Error in AI chat stream:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process chat message" });
    } else {
      res.end();
    }
  }
});

export default router;

