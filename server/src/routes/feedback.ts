import { Router } from "express";
import { AppDataSource } from "../data-source";
import { StudentFeedback, Teacher, ExternalReview, Class } from "../models";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/feedback/submit:
 *   post:
 *     summary: Submit student feedback
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacherId
 *               - teachingRating
 *               - communicationRating
 *               - materialRating
 *               - overallRating
 *             properties:
 *               teacherId:
 *                 type: string
 *               studentName:
 *                 type: string
 *               studentContact:
 *                 type: string
 *               studentId:
 *                 type: string
 *               teachingRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               communicationRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               materialRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               overallRating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               suggestions:
 *                 type: string
 *               courseName:
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
 *         description: Teacher not found
 *       500:
 *         description: Internal server error
 */
router.post("/submit", async (req, res) => {
  try {
    const {
      teacherId,
      classId,
      studentName,
      studentContact,
      studentId,
      teachingRating,
      communicationRating,
      materialRating,
      overallRating,
      suggestions,
      courseName,
    } = req.body;

    if (!teacherId || !teachingRating || !communicationRating || !materialRating || !overallRating) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate ratings
    const ratings = [teachingRating, communicationRating, materialRating, overallRating];
    if (ratings.some((r) => r < 1 || r > 5)) {
      return res.status(400).json({ error: "Invalid ratings (must be 1-5)" });
    }

    const teacherRepo = AppDataSource.getRepository(Teacher);
    const feedbackRepo = AppDataSource.getRepository(StudentFeedback);
    const classRepo = AppDataSource.getRepository(Class);

    // Validate teacher exists
    const teacher = await teacherRepo.findOne({ where: { id: teacherId } });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Validate class if provided
    if (classId) {
      const classEntity = await classRepo.findOne({
        where: { id: classId, teacherId, status: "active" },
      });
      if (!classEntity) {
        return res.status(404).json({ error: "Class not found or inactive" });
      }
    }

    // Create feedback entry
    const feedback = feedbackRepo.create({
      id: `feedback_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      teacherId,
      classId: classId || undefined,
      studentName: studentName || undefined,
      studentContact: studentContact || undefined,
      studentId: studentId || undefined,
      teachingRating,
      communicationRating,
      materialRating,
      overallRating,
      suggestions: suggestions || undefined,
      courseName: courseName || undefined,
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
 *     summary: List feedback for a teacher
 *     tags: [Feedback]
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
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
 *                     $ref: '#/components/schemas/StudentFeedback'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/list", requireAuth, async (req, res) => {
  try {
    const teacherId = req.teacherId as string;
    const classId = req.query.classId as string | undefined;

    const feedbackRepo = AppDataSource.getRepository(StudentFeedback);

    const whereClause: any = { teacherId };
    if (classId) {
      whereClause.classId = classId;
    }

    const feedback = await feedbackRepo.find({
      where: whereClause,
      order: { createdAt: "DESC" },
      relations: ["class"],
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
 *     summary: Get feedback statistics for a teacher
 *     tags: [Feedback]
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
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
 *                         teaching:
 *                           type: number
 *                         communication:
 *                           type: number
 *                         material:
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
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const teacherId = req.teacherId as string;

    const feedbackRepo = AppDataSource.getRepository(StudentFeedback);
    const externalReviewRepo = AppDataSource.getRepository(ExternalReview);

    const feedback = await feedbackRepo.find({
      where: { teacherId },
      order: { createdAt: "DESC" },
    });

    const externalReviews = await externalReviewRepo.find({
      where: { teacherId },
    });

    // Calculate averages from internal feedback
    const totalFeedback = feedback.length;
    let avgTeaching =
      totalFeedback > 0 ? feedback.reduce((sum, f) => sum + f.teachingRating, 0) / totalFeedback : 0;
    let avgCommunication =
      totalFeedback > 0 ? feedback.reduce((sum, f) => sum + f.communicationRating, 0) / totalFeedback : 0;
    let avgMaterial =
      totalFeedback > 0
        ? feedback.reduce((sum, f) => sum + f.materialRating, 0) / totalFeedback
        : 0;
    let avgOverall =
      totalFeedback > 0
        ? feedback.reduce((sum, f) => sum + f.overallRating, 0) / totalFeedback
        : 0;

    // If no internal feedback but we have external reviews, use external review average as fallback
    if (totalFeedback === 0 && externalReviews.length > 0) {
      const avgExternalRating =
        externalReviews.reduce((sum, r) => sum + r.rating, 0) / externalReviews.length;
      // Use external review average for overall rating
      avgOverall = avgExternalRating;
      // For teaching/communication/material, we can't map directly, but we can use overall as a proxy
      // This prevents showing 0.0 which triggers false "concerning" warnings
      avgTeaching = avgExternalRating;
      avgCommunication = avgExternalRating;
      avgMaterial = avgExternalRating;
    }

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
        teaching: Math.round(avgTeaching * 100) / 100,
        communication: Math.round(avgCommunication * 100) / 100,
        material: Math.round(avgMaterial * 100) / 100,
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

