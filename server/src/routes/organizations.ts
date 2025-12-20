import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Teacher, Organization, TeacherAuth, StudentFeedback, ExternalReview, FeedbackTag } from "../models";
import { requireAuth } from "../middleware/auth";
import { hashPassword } from "../utils/password";
import { generateTeacherId } from "../utils/qr-generator";
import { IsNull } from "typeorm";

const router = Router();

/**
 * @swagger
 * /api/organizations/teachers:
 *   get:
 *     summary: Get all teachers for an organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teachers
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Organization access required
 */
router.get("/teachers", requireAuth, async (req, res) => {
  try {
    const organizationId = req.organizationId as string | undefined;

    if (!organizationId) {
      return res.status(403).json({ error: "Organization access required" });
    }

    const teacherRepo = AppDataSource.getRepository(Teacher);
    const feedbackRepo = AppDataSource.getRepository(StudentFeedback);
    const reviewRepo = AppDataSource.getRepository(ExternalReview);

    const teachers = await teacherRepo.find({
      where: { organizationId },
      order: { createdAt: "DESC" },
    });

    // Get stats for each teacher
    const teachersWithStats = await Promise.all(
      teachers.map(async (teacher) => {
        const feedback = await feedbackRepo.find({
          where: { teacherId: teacher.id },
        });

        const externalReviews = await reviewRepo.find({
          where: { teacherId: teacher.id },
        });

        const totalFeedback = feedback.length + externalReviews.length;
        let averageRating = 0;

        if (feedback.length > 0) {
          const avgFeedbackRating =
            feedback.reduce((sum, f) => sum + f.overallRating, 0) / feedback.length;
          averageRating = avgFeedbackRating;
        }

        if (externalReviews.length > 0) {
          const avgReviewRating =
            externalReviews.reduce((sum, r) => sum + r.rating, 0) / externalReviews.length;
          if (averageRating === 0) {
            averageRating = avgReviewRating;
          } else {
            // Weighted average
            averageRating =
              (averageRating * feedback.length + avgReviewRating * externalReviews.length) /
              totalFeedback;
          }
        }

        return {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          address: teacher.address,
          subject: teacher.subject,
          department: teacher.department,
          status: teacher.status,
          qrCode: teacher.qrCode,
          createdAt: teacher.createdAt,
          updatedAt: teacher.updatedAt,
          stats: {
            totalFeedback,
            feedbackCount: feedback.length,
            reviewCount: externalReviews.length,
            averageRating: Math.round(averageRating * 100) / 100,
          },
        };
      })
    );

    return res.json({ teachers: teachersWithStats });
  } catch (error) {
    console.error("Error fetching organization teachers:", error);
    return res.status(500).json({ error: "Failed to fetch teachers" });
  }
});

/**
 * @swagger
 * /api/organizations/teachers:
 *   post:
 *     summary: Create a new teacher for the organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               subject:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       201:
 *         description: Teacher created successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Organization access required
 */
router.post("/teachers", requireAuth, async (req, res) => {
  try {
    const organizationId = req.organizationId as string | undefined;

    if (!organizationId) {
      return res.status(403).json({ error: "Organization access required" });
    }

    const { name, email, password, phone, address, subject, department } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const teacherRepo = AppDataSource.getRepository(Teacher);
    const authRepo = AppDataSource.getRepository(TeacherAuth);
    const orgRepo = AppDataSource.getRepository(Organization);

    // Verify organization exists
    const org = await orgRepo.findOne({ where: { id: organizationId } });
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Check if teacher already exists
    const existingTeacher = await teacherRepo.findOne({ where: { email } });
    if (existingTeacher) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create teacher ID
    const teacherId = generateTeacherId();

    // Create teacher
    const teacher = teacherRepo.create({
      id: teacherId,
      name,
      email,
      phone,
      address: address || undefined,
      subject: subject || undefined,
      department: department || undefined,
      qrCode: teacherId,
      organizationId,
      status: "active",
    });

    await teacherRepo.save(teacher);

    // Create auth entry
    const passwordHash = await hashPassword(password);
    const auth = authRepo.create({
      teacherId,
      email,
      passwordHash,
    });

    await authRepo.save(auth);

    return res.status(201).json({
      success: true,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        organizationId: teacher.organizationId,
      },
    });
  } catch (error) {
    console.error("Error creating teacher:", error);
    return res.status(500).json({ error: "Failed to create teacher" });
  }
});

/**
 * @swagger
 * /api/organizations/teachers/{teacherId}:
 *   patch:
 *     summary: Update a teacher in the organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               subject:
 *                 type: string
 *               department:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, blocked]
 *     responses:
 *       200:
 *         description: Teacher updated successfully
 *       403:
 *         description: Organization access required or teacher not in organization
 *       404:
 *         description: Teacher not found
 */
router.patch("/teachers/:teacherId", requireAuth, async (req, res) => {
  try {
    const organizationId = req.organizationId as string | undefined;
    const { teacherId } = req.params;

    if (!organizationId) {
      return res.status(403).json({ error: "Organization access required" });
    }

    const { name, email, phone, address, subject, department, status } = req.body;

    const teacherRepo = AppDataSource.getRepository(Teacher);

    const teacher = await teacherRepo.findOne({
      where: { id: teacherId, organizationId },
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found or not in organization" });
    }

    // Update fields
    if (name !== undefined) teacher.name = name;
    if (email !== undefined) teacher.email = email;
    if (phone !== undefined) teacher.phone = phone;
    if (address !== undefined) teacher.address = address;
    if (subject !== undefined) teacher.subject = subject;
    if (department !== undefined) teacher.department = department;
    if (status !== undefined) teacher.status = status as "active" | "blocked";

    await teacherRepo.save(teacher);

    return res.json({
      success: true,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        organizationId: teacher.organizationId,
        status: teacher.status,
      },
    });
  } catch (error) {
    console.error("Error updating teacher:", error);
    return res.status(500).json({ error: "Failed to update teacher" });
  }
});

/**
 * @swagger
 * /api/organizations/teachers/{teacherId}:
 *   delete:
 *     summary: Delete a teacher from the organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Teacher deleted successfully
 *       403:
 *         description: Organization access required or teacher not in organization
 *       404:
 *         description: Teacher not found
 */
router.delete("/teachers/:teacherId", requireAuth, async (req, res) => {
  try {
    const organizationId = req.organizationId as string | undefined;
    const { teacherId } = req.params;

    if (!organizationId) {
      return res.status(403).json({ error: "Organization access required" });
    }

    const teacherRepo = AppDataSource.getRepository(Teacher);

    const teacher = await teacherRepo.findOne({
      where: { id: teacherId, organizationId },
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found or not in organization" });
    }

    // Note: This will cascade delete auth, feedback, etc. due to CASCADE constraints
    await teacherRepo.remove(teacher);

    return res.json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return res.status(500).json({ error: "Failed to delete teacher" });
  }
});

/**
 * @swagger
 * /api/organizations/feedback:
 *   get:
 *     summary: Get aggregated feedback for all teachers in the organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *         description: Filter by specific teacher
 *       - in: query
 *         name: tagId
 *         schema:
 *           type: string
 *         description: Filter by tag
 *     responses:
 *       200:
 *         description: Aggregated feedback
 *       403:
 *         description: Organization access required
 */
router.get("/feedback", requireAuth, async (req, res) => {
  try {
    const organizationId = req.organizationId as string | undefined;
    const teacherId = req.query.teacherId as string | undefined;
    const tagId = req.query.tagId as string | undefined;

    if (!organizationId) {
      return res.status(403).json({ error: "Organization access required" });
    }

    const teacherRepo = AppDataSource.getRepository(Teacher);
    const feedbackRepo = AppDataSource.getRepository(StudentFeedback);
    const feedbackTagRepo = AppDataSource.getRepository(FeedbackTag);

    // Get teachers in organization
    const whereClause: any = { organizationId };
    if (teacherId) {
      whereClause.id = teacherId;
    }

    const teachers = await teacherRepo.find({ where: whereClause });
    const teacherIds = teachers.map((t) => t.id);

    // Get organization-level feedback (where organizationId is set but teacherId is null)
    const orgLevelFeedback = await feedbackRepo.find({
      where: { organizationId, teacherId: IsNull() },
      order: { createdAt: "DESC" },
      relations: ["class"],
    });

    // Get teacher-level feedback
    let teacherFeedback: any[] = [];
    if (teacherIds.length > 0) {
      if (teacherId) {
        // Filter by specific teacher
        teacherFeedback = await feedbackRepo.find({
          where: { teacherId, organizationId: IsNull() },
          order: { createdAt: "DESC" },
          relations: ["teacher", "class"],
        });
      } else {
        // Include all teachers' feedback
        teacherFeedback = await feedbackRepo.find({
          where: teacherIds.map((id) => ({ teacherId: id, organizationId: IsNull() })),
          order: { createdAt: "DESC" },
          relations: ["teacher", "class"],
        });
      }
    }

    // Combine both types of feedback
    let feedback = [...orgLevelFeedback, ...teacherFeedback].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Filter by tag if specified
    if (tagId) {
      const feedbackWithTag = await feedbackTagRepo.find({
        where: { tagId },
        relations: ["feedback"],
      });
      const feedbackIds = new Set(feedbackWithTag.map((ft) => ft.feedbackId));
      feedback = feedback.filter((f) => feedbackIds.has(f.id));
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
          tags: tags.map((ft) => ({
            id: ft.tag.id,
            name: ft.tag.name,
            color: ft.tag.color,
            description: ft.tag.description,
          })),
          teacher: f.teacher
            ? {
                id: f.teacher.id,
                name: f.teacher.name,
                email: f.teacher.email,
              }
            : undefined,
        };
      })
    );

    // Calculate aggregated stats
    const totalFeedback = feedback.length;
    let avgTeaching = 0;
    let avgCommunication = 0;
    let avgMaterial = 0;
    let avgOverall = 0;

    if (totalFeedback > 0) {
      avgTeaching =
        feedback.reduce((sum, f) => sum + f.teachingRating, 0) / totalFeedback;
      avgCommunication =
        feedback.reduce((sum, f) => sum + f.communicationRating, 0) / totalFeedback;
      avgMaterial =
        feedback.reduce((sum, f) => sum + f.materialRating, 0) / totalFeedback;
      avgOverall =
        feedback.reduce((sum, f) => sum + f.overallRating, 0) / totalFeedback;
    }

    return res.json({
      feedback: feedbackWithTags,
      stats: {
        totalFeedback,
        averageRatings: {
          teaching: Math.round(avgTeaching * 100) / 100,
          communication: Math.round(avgCommunication * 100) / 100,
          material: Math.round(avgMaterial * 100) / 100,
          overall: Math.round(avgOverall * 100) / 100,
        },
        teacherCount: teachers.length,
      },
    });
  } catch (error) {
    console.error("Error fetching organization feedback:", error);
    return res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

/**
 * @swagger
 * /api/organizations/stats:
 *   get:
 *     summary: Get aggregated statistics for the organization
 *     tags: [Organizations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organization statistics
 *       403:
 *         description: Organization access required
 */
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const organizationId = req.organizationId as string | undefined;

    if (!organizationId) {
      return res.status(403).json({ error: "Organization access required" });
    }

    const teacherRepo = AppDataSource.getRepository(Teacher);
    const feedbackRepo = AppDataSource.getRepository(StudentFeedback);
    const reviewRepo = AppDataSource.getRepository(ExternalReview);

    // Get all teachers in organization
    const teachers = await teacherRepo.find({ where: { organizationId } });
    const teacherIds = teachers.map((t) => t.id);

    if (teacherIds.length === 0) {
      return res.json({
        stats: {
          totalTeachers: 0,
          totalFeedback: 0,
          totalReviews: 0,
          averageRatings: {
            teaching: 0,
            communication: 0,
            material: 0,
            overall: 0,
          },
        },
      });
    }

    // Get all feedback
    const feedback = await feedbackRepo.find({
      where: teacherIds.map((id) => ({ teacherId: id })),
    });

    // Get all external reviews
    const reviews = await reviewRepo.find({
      where: teacherIds.map((id) => ({ teacherId: id })),
    });

    // Calculate averages
    const totalFeedback = feedback.length;
    let avgTeaching = 0;
    let avgCommunication = 0;
    let avgMaterial = 0;
    let avgOverall = 0;

    if (totalFeedback > 0) {
      avgTeaching =
        feedback.reduce((sum, f) => sum + f.teachingRating, 0) / totalFeedback;
      avgCommunication =
        feedback.reduce((sum, f) => sum + f.communicationRating, 0) / totalFeedback;
      avgMaterial =
        feedback.reduce((sum, f) => sum + f.materialRating, 0) / totalFeedback;
      avgOverall =
        feedback.reduce((sum, f) => sum + f.overallRating, 0) / totalFeedback;
    }

    // If we have external reviews, incorporate them
    if (reviews.length > 0) {
      const avgReviewRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      if (avgOverall === 0) {
        avgOverall = avgReviewRating;
      } else {
        const total = totalFeedback + reviews.length;
        avgOverall =
          (avgOverall * totalFeedback + avgReviewRating * reviews.length) / total;
      }
    }

    return res.json({
      stats: {
        totalTeachers: teachers.length,
        totalFeedback,
        totalReviews: reviews.length,
        averageRatings: {
          teaching: Math.round(avgTeaching * 100) / 100,
          communication: Math.round(avgCommunication * 100) / 100,
          material: Math.round(avgMaterial * 100) / 100,
          overall: Math.round(avgOverall * 100) / 100,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching organization stats:", error);
    return res.status(500).json({ error: "Failed to fetch stats" });
  }
});

export default router;

