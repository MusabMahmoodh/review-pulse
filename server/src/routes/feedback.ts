import { Router } from "express";
import { AppDataSource } from "../data-source";
import { StudentFeedback, Teacher, Organization, ExternalReview, Class, Tag, FeedbackTag } from "../models";
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
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of tag IDs to associate with this feedback
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
      organizationId,
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
      tagIds, // Array of tag IDs that students can select
    } = req.body;

    // Validate that either teacherId or organizationId is provided, but not both
    if (!teacherId && !organizationId) {
      return res.status(400).json({ error: "Either teacherId or organizationId must be provided" });
    }

    if (teacherId && organizationId) {
      return res.status(400).json({ error: "Cannot specify both teacherId and organizationId" });
    }

    if (!teachingRating || !communicationRating || !materialRating || !overallRating) {
      return res.status(400).json({ error: "Missing required rating fields" });
    }

    // Validate ratings
    const ratings = [teachingRating, communicationRating, materialRating, overallRating];
    if (ratings.some((r) => r < 1 || r > 5)) {
      return res.status(400).json({ error: "Invalid ratings (must be 1-5)" });
    }

    const teacherRepo = AppDataSource.getRepository(Teacher);
    const orgRepo = AppDataSource.getRepository(Organization);
    const feedbackRepo = AppDataSource.getRepository(StudentFeedback);
    const classRepo = AppDataSource.getRepository(Class);
    const tagRepo = AppDataSource.getRepository(Tag);
    const feedbackTagRepo = AppDataSource.getRepository(FeedbackTag);

    let teacher: Teacher | null = null;
    let organization: Organization | null = null;
    let targetOrganizationId: string | undefined = undefined;

    // Validate teacher or organization exists
    if (teacherId) {
      teacher = await teacherRepo.findOne({ 
        where: { id: teacherId },
        relations: ["organization"],
      });
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }
      targetOrganizationId = teacher.organizationId || undefined;
    } else if (organizationId) {
      organization = await orgRepo.findOne({ 
        where: { id: organizationId },
      });
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      targetOrganizationId = organizationId;
    }

    // Validate class if provided (only for teacher feedback)
    if (classId) {
      if (!teacherId) {
        return res.status(400).json({ error: "classId can only be used with teacherId" });
      }
      const classEntity = await classRepo.findOne({
        where: { id: classId, teacherId, status: "active" },
      });
      if (!classEntity) {
        return res.status(404).json({ error: "Class not found or inactive" });
      }
    }

    // Validate tags if provided
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      const availableTagIds: string[] = [];
      
      if (teacherId) {
        // Get teacher-specific tags
        const teacherTags = await tagRepo.find({
          where: { teacherId, isActive: true },
        });
        availableTagIds.push(...teacherTags.map(t => t.id));

        // Get organization-level tags if teacher belongs to an organization
        if (teacher && teacher.organizationId) {
          const orgTags = await tagRepo.find({
            where: { organizationId: teacher.organizationId, isActive: true },
          });
          availableTagIds.push(...orgTags.map(t => t.id));
        }
      } else if (organizationId) {
        // Get organization-level tags
        const orgTags = await tagRepo.find({
          where: { organizationId, isActive: true },
        });
        availableTagIds.push(...orgTags.map(t => t.id));
      }

      // Validate all provided tag IDs are available
      const invalidTags = tagIds.filter((tagId: string) => !availableTagIds.includes(tagId));
      if (invalidTags.length > 0) {
        return res.status(400).json({ 
          error: `Invalid tag IDs: ${invalidTags.join(", ")}` 
        });
      }
    }

    // Create feedback entry
    const feedback = feedbackRepo.create({
      id: `feedback_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      teacherId: teacherId || undefined,
      organizationId: organizationId || undefined,
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

    // Associate tags with feedback
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      const feedbackTags = tagIds.map((tagId: string) =>
        feedbackTagRepo.create({
          id: `feedback_tag_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          feedbackId: feedback.id,
          tagId,
        })
      );
      await feedbackTagRepo.save(feedbackTags);
    }

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
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;
    const classId = req.query.classId as string | undefined;
    const tagId = req.query.tagId as string | undefined; // Optional filter by tag
    const filterTeacherId = req.query.filterTeacherId as string | undefined; // For org filtering by teacher

    const feedbackRepo = AppDataSource.getRepository(StudentFeedback);
    const feedbackTagRepo = AppDataSource.getRepository(FeedbackTag);
    const teacherRepo = AppDataSource.getRepository(Teacher);

    let feedback: StudentFeedback[] = [];

    if (teacherId) {
      // Teacher viewing their own feedback
      const whereClause: any = { teacherId };
      if (classId) {
        whereClause.classId = classId;
      }

      feedback = await feedbackRepo.find({
        where: whereClause,
        order: { createdAt: "DESC" },
        relations: ["class"],
      });
    } else if (organizationId) {
      // Organization viewing all teachers' feedback
      const teachers = await teacherRepo.find({
        where: { organizationId },
      });
      const teacherIds = teachers.map((t) => t.id);

      if (teacherIds.length > 0) {
        const whereConditions: any[] = teacherIds.map((id) => ({
          teacherId: filterTeacherId && filterTeacherId === id ? filterTeacherId : id,
        }));

        if (filterTeacherId) {
          // Filter by specific teacher
          feedback = await feedbackRepo.find({
            where: { teacherId: filterTeacherId },
            order: { createdAt: "DESC" },
            relations: ["class", "teacher"],
          });
        } else {
          // All teachers' feedback
          feedback = await feedbackRepo.find({
            where: teacherIds.map((id) => ({ teacherId: id })),
            order: { createdAt: "DESC" },
            relations: ["class", "teacher"],
          });
        }

        if (classId) {
          feedback = feedback.filter((f) => f.classId === classId);
        }
      }
    } else {
      return res.status(400).json({ error: "Teacher ID or organization access required" });
    }

    // Filter by tag if specified
    if (tagId) {
      const feedbackWithTag = await feedbackTagRepo.find({
        where: { tagId },
        relations: ["feedback"],
      });
      const feedbackIds = new Set(feedbackWithTag.map(ft => ft.feedbackId));
      feedback = feedback.filter(f => feedbackIds.has(f.id));
    }

    // Load tags for each feedback item
    const feedbackWithTags = await Promise.all(
      feedback.map(async (f) => {
        const tags = await feedbackTagRepo.find({
          where: { feedbackId: f.id },
          relations: ["tag"],
        });
        return {
          ...f,
          tags: tags.map(ft => ({
            id: ft.tag.id,
            name: ft.tag.name,
            color: ft.tag.color,
            description: ft.tag.description,
          })),
          teacher: (f as any).teacher
            ? {
                id: (f as any).teacher.id,
                name: (f as any).teacher.name,
                email: (f as any).teacher.email,
              }
            : undefined,
        };
      })
    );

    return res.json({ feedback: feedbackWithTags });
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
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;
    const filterTeacherId = req.query.filterTeacherId as string | undefined; // For org filtering by teacher

    const feedbackRepo = AppDataSource.getRepository(StudentFeedback);
    const externalReviewRepo = AppDataSource.getRepository(ExternalReview);
    const teacherRepo = AppDataSource.getRepository(Teacher);

    let feedback: StudentFeedback[] = [];
    let externalReviews: ExternalReview[] = [];

    if (teacherId) {
      // Teacher viewing their own stats
      feedback = await feedbackRepo.find({
        where: { teacherId },
        order: { createdAt: "DESC" },
      });

      externalReviews = await externalReviewRepo.find({
        where: { teacherId },
      });
    } else if (organizationId) {
      // Organization viewing aggregated stats
      const teachers = await teacherRepo.find({
        where: { organizationId },
      });
      const teacherIds = teachers.map((t) => t.id);

      if (teacherIds.length > 0) {
        if (filterTeacherId && teacherIds.includes(filterTeacherId)) {
          // Filter by specific teacher
          feedback = await feedbackRepo.find({
            where: { teacherId: filterTeacherId },
            order: { createdAt: "DESC" },
          });

          externalReviews = await externalReviewRepo.find({
            where: { teacherId: filterTeacherId },
          });
        } else {
          // All teachers' feedback
          feedback = await feedbackRepo.find({
            where: teacherIds.map((id) => ({ teacherId: id })),
            order: { createdAt: "DESC" },
          });

          externalReviews = await externalReviewRepo.find({
            where: teacherIds.map((id) => ({ teacherId: id })),
          });
        }
      }
    } else {
      return res.status(400).json({ error: "Teacher ID or organization access required" });
    }

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

