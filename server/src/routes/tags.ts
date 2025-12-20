import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Tag, Teacher, Organization, StudentFeedback, ExternalReview, FeedbackTag, ExternalReviewTag } from "../models";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: Get all tags for a teacher or organization
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *         description: Filter by teacher ID (returns teacher-specific and org tags)
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *         description: Filter by organization ID (returns org-level tags)
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive tags
 *     responses:
 *       200:
 *         description: List of tags
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.query.organizationId as string | undefined;
    const includeInactive = req.query.includeInactive === "true";

    const tagRepo = AppDataSource.getRepository(Tag);
    const teacherRepo = AppDataSource.getRepository(Teacher);

    let tags: Tag[] = [];

    if (teacherId) {
      // Get teacher and their organization
      const teacher = await teacherRepo.findOne({
        where: { id: teacherId },
        relations: ["organization"],
      });

      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      // Get teacher-specific tags and organization-level tags
      const whereConditions: any[] = [
        { teacherId, isActive: true },
      ];

      if (teacher.organizationId) {
        whereConditions.push({ organizationId: teacher.organizationId, isActive: true });
      }

      if (includeInactive) {
        whereConditions.push(
          { teacherId, isActive: false },
          ...(teacher.organizationId ? [{ organizationId: teacher.organizationId, isActive: false }] : [])
        );
      }

      tags = await tagRepo.find({
        where: whereConditions,
        order: { createdAt: "DESC" },
      });
    } else if (organizationId) {
      // Get organization-level tags only
      const whereCondition: any = { organizationId, isActive: true };
      if (includeInactive) {
        tags = await tagRepo.find({
          where: [
            { organizationId, isActive: true },
            { organizationId, isActive: false },
          ],
          order: { createdAt: "DESC" },
        });
      } else {
        tags = await tagRepo.find({
          where: whereCondition,
          order: { createdAt: "DESC" },
        });
      }
    } else {
      return res.status(400).json({ error: "teacherId or organizationId required" });
    }

    return res.json({ tags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return res.status(500).json({ error: "Failed to fetch tags" });
  }
});

/**
 * @swagger
 * /api/tags:
 *   post:
 *     summary: Create a new tag
 *     tags: [Tags]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *               teacherId:
 *                 type: string
 *               organizationId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tag created successfully
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, description, color, teacherId, organizationId } = req.body;
    const authenticatedTeacherId = req.teacherId as string | undefined;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Tag name is required" });
    }

    // Validate that either teacherId or organizationId is provided, but not both
    if (!teacherId && !organizationId) {
      return res.status(400).json({ error: "Either teacherId or organizationId must be provided" });
    }

    if (teacherId && organizationId) {
      return res.status(400).json({ error: "Cannot specify both teacherId and organizationId" });
    }

    const tagRepo = AppDataSource.getRepository(Tag);
    const teacherRepo = AppDataSource.getRepository(Teacher);
    const orgRepo = AppDataSource.getRepository(Organization);

    // If creating a teacher tag, verify the teacher exists and belongs to authenticated user
    if (teacherId) {
      if (authenticatedTeacherId && teacherId !== authenticatedTeacherId) {
        return res.status(403).json({ error: "Cannot create tags for other teachers" });
      }

      const teacher = await teacherRepo.findOne({ where: { id: teacherId } });
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }
    }

    // If creating an organization tag, verify the organization exists
    if (organizationId) {
      const org = await orgRepo.findOne({ where: { id: organizationId } });
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // If authenticated as a teacher, verify they belong to this organization
      if (authenticatedTeacherId) {
        const teacher = await teacherRepo.findOne({
          where: { id: authenticatedTeacherId, organizationId },
        });
        if (!teacher) {
          return res.status(403).json({ error: "Cannot create organization tags if not a member" });
        }
      }
    }

    // Check if tag with same name already exists for this scope
    const existingTag = await tagRepo.findOne({
      where: teacherId
        ? { name: name.trim(), teacherId }
        : { name: name.trim(), organizationId },
    });

    if (existingTag) {
      return res.status(400).json({ error: "Tag with this name already exists" });
    }

    const tag = tagRepo.create({
      id: `tag_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      description: description?.trim() || undefined,
      color: color || undefined,
      teacherId: teacherId || undefined,
      organizationId: organizationId || undefined,
      isActive: true,
    });

    await tagRepo.save(tag);

    return res.status(201).json({ success: true, tag });
  } catch (error) {
    console.error("Error creating tag:", error);
    return res.status(500).json({ error: "Failed to create tag" });
  }
});

/**
 * @swagger
 * /api/tags/{tagId}:
 *   patch:
 *     summary: Update a tag
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: tagId
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
 *               description:
 *                 type: string
 *               color:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tag updated successfully
 */
router.patch("/:tagId", requireAuth, async (req, res) => {
  try {
    const { tagId } = req.params;
    const { name, description, color, isActive } = req.body;
    const authenticatedTeacherId = req.teacherId as string | undefined;

    const tagRepo = AppDataSource.getRepository(Tag);
    const tag = await tagRepo.findOne({ where: { id: tagId } });

    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    // Verify ownership
    if (authenticatedTeacherId) {
      if (tag.teacherId && tag.teacherId !== authenticatedTeacherId) {
        return res.status(403).json({ error: "Cannot update tags for other teachers" });
      }

      if (tag.organizationId) {
        const teacherRepo = AppDataSource.getRepository(Teacher);
        const teacher = await teacherRepo.findOne({
          where: { id: authenticatedTeacherId, organizationId: tag.organizationId },
        });
        if (!teacher) {
          return res.status(403).json({ error: "Cannot update organization tags if not a member" });
        }
      }
    }

    // Update fields
    if (name !== undefined) tag.name = name.trim();
    if (description !== undefined) tag.description = description?.trim() || undefined;
    if (color !== undefined) tag.color = color || undefined;
    if (isActive !== undefined) tag.isActive = isActive;

    await tagRepo.save(tag);

    return res.json({ success: true, tag });
  } catch (error) {
    console.error("Error updating tag:", error);
    return res.status(500).json({ error: "Failed to update tag" });
  }
});

/**
 * @swagger
 * /api/tags/{tagId}:
 *   delete:
 *     summary: Delete a tag (soft delete by setting isActive to false)
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tag deleted successfully
 */
router.delete("/:tagId", requireAuth, async (req, res) => {
  try {
    const { tagId } = req.params;
    const authenticatedTeacherId = req.teacherId as string | undefined;

    const tagRepo = AppDataSource.getRepository(Tag);
    const tag = await tagRepo.findOne({ where: { id: tagId } });

    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    // Verify ownership
    if (authenticatedTeacherId) {
      if (tag.teacherId && tag.teacherId !== authenticatedTeacherId) {
        return res.status(403).json({ error: "Cannot delete tags for other teachers" });
      }

      if (tag.organizationId) {
        const teacherRepo = AppDataSource.getRepository(Teacher);
        const teacher = await teacherRepo.findOne({
          where: { id: authenticatedTeacherId, organizationId: tag.organizationId },
        });
        if (!teacher) {
          return res.status(403).json({ error: "Cannot delete organization tags if not a member" });
        }
      }
    }

    // Soft delete
    tag.isActive = false;
    await tagRepo.save(tag);

    return res.json({ success: true, message: "Tag deleted successfully" });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return res.status(500).json({ error: "Failed to delete tag" });
  }
});

/**
 * @swagger
 * /api/tags/stats/{tagId}:
 *   get:
 *     summary: Get statistics for a tag
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tag statistics
 */
router.get("/stats/:tagId", requireAuth, async (req, res) => {
  try {
    const { tagId } = req.params;

    const tagRepo = AppDataSource.getRepository(Tag);
    const feedbackTagRepo = AppDataSource.getRepository(FeedbackTag);
    const reviewTagRepo = AppDataSource.getRepository(ExternalReviewTag);

    const tag = await tagRepo.findOne({ where: { id: tagId } });
    if (!tag) {
      return res.status(404).json({ error: "Tag not found" });
    }

    // Count feedback with this tag
    const feedbackCount = await feedbackTagRepo.count({ where: { tagId } });

    // Count external reviews with this tag
    const reviewCount = await reviewTagRepo.count({ where: { tagId } });

    // Get average ratings for feedback with this tag
    const feedbackTags = await feedbackTagRepo.find({
      where: { tagId },
      relations: ["feedback"],
    });

    let avgOverallRating = 0;
    if (feedbackTags.length > 0) {
      const totalRating = feedbackTags.reduce(
        (sum, ft) => sum + (ft.feedback?.overallRating || 0),
        0
      );
      avgOverallRating = totalRating / feedbackTags.length;
    }

    return res.json({
      tag,
      stats: {
        feedbackCount,
        reviewCount,
        totalCount: feedbackCount + reviewCount,
        averageRating: Math.round(avgOverallRating * 100) / 100,
      },
    });
  } catch (error) {
    console.error("Error fetching tag stats:", error);
    return res.status(500).json({ error: "Failed to fetch tag statistics" });
  }
});

export default router;

