import { Router } from "express";
import { AppDataSource } from "../data-source";
import { ActionableItem, Teacher, Organization, StudentFeedback, ExternalReview, AIInsight, TeamMember } from "../models";
import { requireAuth } from "../middleware/auth";
import { isPremium } from "../utils/subscription";

const router = Router();

/**
 * @swagger
 * /api/actionable-items:
 *   get:
 *     summary: Get all actionable items for a teacher
 *     tags: [ActionableItems]
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
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
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;
    const completed = req.query.completed as string | undefined;
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

    const actionableItemRepo = AppDataSource.getRepository(ActionableItem);
    const feedbackRepo = AppDataSource.getRepository(StudentFeedback);

    const query = actionableItemRepo.createQueryBuilder("item");
    if (teacherId) {
      query.where("item.teacherId = :teacherId", { teacherId });
    } else if (organizationId) {
      query.where("item.organizationId = :organizationId", { organizationId });
    }

    if (completed !== undefined) {
      query.andWhere("item.completed = :completed", { completed: completed === "true" });
    }

    // Filter by formId if provided - only include items from feedback with this formId
    if (formId) {
      // Get all feedback IDs for this form
      const feedbackWithForm = await feedbackRepo.find({
        where: { formId },
        select: ["id"],
      });
      const feedbackIds = feedbackWithForm.map(f => f.id);
      
      if (feedbackIds.length > 0) {
        // Only include actionable items where sourceType is "comment" and sourceId is in the feedbackIds
        query.andWhere(
          "(item.sourceType = 'comment' AND item.sourceId IN (:...feedbackIds))",
          { feedbackIds }
        );
      } else {
        // No feedback for this form, return empty
        return res.json({ items: [] });
      }
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
 * /api/actionable-items/by-source:
 *   get:
 *     summary: Get actionable item by source ID and type
 *     tags: [ActionableItems]
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teacher ID
 *       - in: query
 *         name: sourceType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [comment, ai_suggestion]
 *         description: Source type
 *       - in: query
 *         name: sourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Source ID
 *     responses:
 *       200:
 *         description: Actionable item if found
 *       404:
 *         description: No actionable item found for this source
 *       500:
 *         description: Internal server error
 */
router.get("/by-source", requireAuth, async (req, res) => {
  try {
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;
    const sourceType = req.query.sourceType as string;
    const sourceId = req.query.sourceId as string;

    if ((!teacherId && !organizationId) || !sourceType || !sourceId) {
      return res.status(400).json({ error: "Teacher ID or organization ID, sourceType, and sourceId are required" });
    }

    if (sourceType !== "comment" && sourceType !== "ai_suggestion") {
      return res.status(400).json({ error: "Invalid sourceType. Must be 'comment' or 'ai_suggestion'" });
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

    const actionableItemRepo = AppDataSource.getRepository(ActionableItem);

    const whereClause: any = {
      sourceType: sourceType as "comment" | "ai_suggestion",
      sourceId,
    };
    if (teacherId) {
      whereClause.teacherId = teacherId;
    } else if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const item = await actionableItemRepo.findOne({
      where: whereClause,
    });

    if (!item) {
      return res.status(404).json({ error: "No actionable item found for this source" });
    }

    return res.json({ item });
  } catch (error) {
    console.error("Error fetching actionable item by source:", error);
    return res.status(500).json({ error: "Failed to fetch actionable item" });
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
 *               - teacherId
 *               - title
 *               - sourceType
 *               - sourceId
 *             properties:
 *               teacherId:
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
    const { title, description, sourceType, sourceId, sourceText, assignedTo, deadline } = req.body;
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;

    if ((!teacherId && !organizationId) || !title || !sourceType || !sourceId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (sourceType !== "comment" && sourceType !== "ai_suggestion") {
      return res.status(400).json({ error: "Invalid sourceType. Must be 'comment' or 'ai_suggestion'" });
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

    // Verify source exists
    if (sourceType === "comment") {
      const feedbackRepo = AppDataSource.getRepository(StudentFeedback);
      const reviewRepo = AppDataSource.getRepository(ExternalReview);
      
      let feedback, review;
      if (teacherId) {
        feedback = await feedbackRepo.findOne({ where: { id: sourceId, teacherId } });
        review = await reviewRepo.findOne({ where: { id: sourceId, teacherId } });
      } else if (organizationId) {
        feedback = await feedbackRepo.findOne({ where: { id: sourceId, organizationId } });
        // Reviews are teacher-specific, so check all teachers in org
        const teacherRepo = AppDataSource.getRepository(Teacher);
        const teachers = await teacherRepo.find({ where: { organizationId } });
        const teacherIds = teachers.map(t => t.id);
        if (teacherIds.length > 0) {
          review = await reviewRepo.findOne({ where: { id: sourceId, teacherId: teacherIds[0] } });
        }
      }
      
      if (!feedback && !review) {
        return res.status(404).json({ error: "Source comment not found" });
      }
    } else if (sourceType === "ai_suggestion") {
      const insightRepo = AppDataSource.getRepository(AIInsight);
      let insight;
      if (teacherId) {
        insight = await insightRepo.findOne({ where: { id: sourceId, teacherId } });
      } else if (organizationId) {
        insight = await insightRepo.findOne({ where: { id: sourceId, organizationId } });
      }
      
      if (!insight) {
        return res.status(404).json({ error: "Source AI insight not found" });
      }
    }

    const actionableItemRepo = AppDataSource.getRepository(ActionableItem);

    // Verify assignedTo team member exists if provided (only for teachers)
    if (assignedTo && teacherId) {
      const teamMemberRepo = AppDataSource.getRepository(TeamMember);
      const teamMember = await teamMemberRepo.findOne({
        where: { id: assignedTo, teacherId },
      });
      if (!teamMember) {
        return res.status(404).json({ error: "Team member not found" });
      }
    }

    const item = actionableItemRepo.create({
      id: `actionable_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      teacherId: teacherId || undefined,
      organizationId: organizationId || undefined,
      title,
      description: description || undefined,
      sourceType,
      sourceId,
      sourceText: sourceText || undefined,
      assignedTo: assignedTo || undefined,
      deadline: deadline ? new Date(deadline) : undefined,
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
    const { title, description, completed, assignedTo, deadline } = req.body;
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;

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

    const actionableItemRepo = AppDataSource.getRepository(ActionableItem);

    const whereClause: any = { id };
    if (teacherId) {
      whereClause.teacherId = teacherId;
    } else if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const item = await actionableItemRepo.findOne({
      where: whereClause,
    });

    if (!item) {
      return res.status(404).json({ error: "Actionable item not found" });
    }

    // Verify assignedTo team member exists if provided (only for teachers)
    if (assignedTo !== undefined && teacherId) {
      if (assignedTo) {
        const teamMemberRepo = AppDataSource.getRepository(TeamMember);
        const teamMember = await teamMemberRepo.findOne({
          where: { id: assignedTo, teacherId },
        });
        if (!teamMember) {
          return res.status(404).json({ error: "Team member not found" });
        }
      }
      item.assignedTo = assignedTo || undefined;
    }

    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (completed !== undefined) item.completed = completed;
    if (deadline !== undefined) item.deadline = deadline ? new Date(deadline) : undefined;

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
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;

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

    const actionableItemRepo = AppDataSource.getRepository(ActionableItem);

    const whereClause: any = { id };
    if (teacherId) {
      whereClause.teacherId = teacherId;
    } else if (organizationId) {
      whereClause.organizationId = organizationId;
    }

    const item = await actionableItemRepo.findOne({
      where: whereClause,
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

