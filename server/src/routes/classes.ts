import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Class, Teacher, Organization } from "../models";
import { requireAuth } from "../middleware/auth";
import { generateClassId, generateQRCodeUrl, generateOrganizationQRCodeUrl } from "../utils/qr-generator";
import { isPremium } from "../utils/subscription";

const router = Router();

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Create a new class (teacher or organization)
 *     tags: [Classes]
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
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Class created successfully
 *       400:
 *         description: Bad request
 *       403:
 *         description: Premium required (for solo teachers with more than 1 class)
 *       500:
 *         description: Internal server error
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;

    if (!name) {
      return res.status(400).json({ error: "Class name is required" });
    }

    const classRepo = AppDataSource.getRepository(Class);
    const teacherRepo = AppDataSource.getRepository(Teacher);
    const orgRepo = AppDataSource.getRepository(Organization);

    let teacher: Teacher | null = null;
    let organization: Organization | null = null;

    // Handle teacher-level class creation
    if (teacherId) {
      teacher = await teacherRepo.findOne({ where: { id: teacherId } });
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      // Check if teacher is solo (not in organization)
      if (!teacher.organizationId) {
        // Check class limit for solo teachers (1 class for non-premium)
        const existingClasses = await classRepo.find({
          where: { teacherId, status: "active" },
        });

        const hasPremium = await isPremium(teacherId, "teacher");
        if (!hasPremium && existingClasses.length >= 1) {
          return res.status(403).json({
            error: "Premium subscription required to create more than 1 class",
            requiresPremium: true,
          });
        }
      }

      organization = teacher.organizationId
        ? await orgRepo.findOne({ where: { id: teacher.organizationId } })
        : null;
    }
    // Handle organization-level class creation
    else if (organizationId) {
      organization = await orgRepo.findOne({ where: { id: organizationId } });
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // Organizations can create classes but need to specify teacherId
      if (!req.body.teacherId) {
        return res.status(400).json({ error: "teacherId is required for organization-level class creation" });
      }

      teacher = await teacherRepo.findOne({
        where: { id: req.body.teacherId, organizationId },
      });

      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found in this organization" });
      }
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Create class
    const classId = generateClassId();
    const qrCode = classId;

    const newClass = classRepo.create({
      id: classId,
      name,
      description: description || undefined,
      teacherId: teacher.id,
      organizationId: organization?.id || undefined,
      qrCode,
      status: "active",
    });

    await classRepo.save(newClass);

    const qrCodeUrl = organization
      ? generateOrganizationQRCodeUrl(organization.id, classId)
      : generateQRCodeUrl(teacher.id, classId);

    return res.status(201).json({
      success: true,
      class: {
        id: newClass.id,
        name: newClass.name,
        description: newClass.description,
        teacherId: newClass.teacherId,
        organizationId: newClass.organizationId,
        qrCode: newClass.qrCode,
        qrCodeUrl,
        status: newClass.status,
        createdAt: newClass.createdAt,
        updatedAt: newClass.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error creating class:", error);
    return res.status(500).json({ error: "Failed to create class" });
  }
});

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: List classes for a teacher or organization
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *         description: Filter by teacher ID (for organizations)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, archived]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of classes
 *       500:
 *         description: Internal server error
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;
    const filterTeacherId = req.query.teacherId as string | undefined;
    const status = req.query.status as string | undefined;

    const classRepo = AppDataSource.getRepository(Class);
    const teacherRepo = AppDataSource.getRepository(Teacher);

    let whereClause: any = {};

    // Handle teacher-level access
    if (teacherId) {
      const teacher = await teacherRepo.findOne({ where: { id: teacherId } });
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      // If teacher belongs to organization, they can see all org classes
      if (teacher.organizationId && filterTeacherId) {
        // Organization admin viewing specific teacher's classes
        whereClause.teacherId = filterTeacherId;
        whereClause.organizationId = teacher.organizationId;
      } else {
        // Teacher viewing their own classes
        whereClause.teacherId = teacherId;
      }
    }
    // Handle organization-level access
    else if (organizationId) {
      if (filterTeacherId) {
        // Filter by specific teacher
        whereClause.teacherId = filterTeacherId;
        whereClause.organizationId = organizationId;
      } else {
        // All classes in organization
        whereClause.organizationId = organizationId;
      }
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (status) {
      whereClause.status = status;
    }

    const classes = await classRepo.find({
      where: whereClause,
      order: { createdAt: "DESC" },
      relations: ["teacher"],
    });

    const classesWithUrls = classes.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      teacherId: c.teacherId,
      organizationId: c.organizationId,
      qrCode: c.qrCode,
      qrCodeUrl: c.organizationId
        ? generateOrganizationQRCodeUrl(c.organizationId, c.id)
        : generateQRCodeUrl(c.teacherId, c.id),
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      teacher: c.teacher
        ? {
            id: c.teacher.id,
            name: c.teacher.name,
            email: c.teacher.email,
          }
        : undefined,
    }));

    return res.json({ classes: classesWithUrls });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return res.status(500).json({ error: "Failed to fetch classes" });
  }
});

/**
 * @swagger
 * /api/classes/{classId}:
 *   get:
 *     summary: Get a specific class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class details
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.get("/:classId", requireAuth, async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;

    const classRepo = AppDataSource.getRepository(Class);
    const teacherRepo = AppDataSource.getRepository(Teacher);

    const classEntity = await classRepo.findOne({
      where: { id: classId },
      relations: ["teacher"],
    });

    if (!classEntity) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Verify access
    if (teacherId) {
      const teacher = await teacherRepo.findOne({ where: { id: teacherId } });
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      // Teacher can access their own classes or classes in their organization
      if (
        classEntity.teacherId !== teacherId &&
        (!teacher.organizationId || classEntity.organizationId !== teacher.organizationId)
      ) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (organizationId) {
      if (classEntity.organizationId !== organizationId) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const qrCodeUrl = classEntity.organizationId
      ? generateOrganizationQRCodeUrl(classEntity.organizationId, classEntity.id)
      : generateQRCodeUrl(classEntity.teacherId, classEntity.id);

    return res.json({
      class: {
        id: classEntity.id,
        name: classEntity.name,
        description: classEntity.description,
        teacherId: classEntity.teacherId,
        organizationId: classEntity.organizationId,
        qrCode: classEntity.qrCode,
        qrCodeUrl,
        status: classEntity.status,
        createdAt: classEntity.createdAt,
        updatedAt: classEntity.updatedAt,
        teacher: classEntity.teacher
          ? {
              id: classEntity.teacher.id,
              name: classEntity.teacher.name,
              email: classEntity.teacher.email,
            }
          : undefined,
      },
    });
  } catch (error) {
    console.error("Error fetching class:", error);
    return res.status(500).json({ error: "Failed to fetch class" });
  }
});

/**
 * @swagger
 * /api/classes/{classId}:
 *   patch:
 *     summary: Update a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, archived]
 *     responses:
 *       200:
 *         description: Class updated successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.patch("/:classId", requireAuth, async (req, res) => {
  try {
    const { classId } = req.params;
    const { name, description, status } = req.body;
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;

    const classRepo = AppDataSource.getRepository(Class);
    const teacherRepo = AppDataSource.getRepository(Teacher);

    const classEntity = await classRepo.findOne({ where: { id: classId } });

    if (!classEntity) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Verify access
    if (teacherId) {
      const teacher = await teacherRepo.findOne({ where: { id: teacherId } });
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      if (
        classEntity.teacherId !== teacherId &&
        (!teacher.organizationId || classEntity.organizationId !== teacher.organizationId)
      ) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (organizationId) {
      if (classEntity.organizationId !== organizationId) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Update fields
    if (name !== undefined) classEntity.name = name;
    if (description !== undefined) classEntity.description = description;
    if (status !== undefined) classEntity.status = status as "active" | "archived";

    await classRepo.save(classEntity);

    const qrCodeUrl = classEntity.organizationId
      ? generateOrganizationQRCodeUrl(classEntity.organizationId, classEntity.id)
      : generateQRCodeUrl(classEntity.teacherId, classEntity.id);

    return res.json({
      success: true,
      class: {
        id: classEntity.id,
        name: classEntity.name,
        description: classEntity.description,
        teacherId: classEntity.teacherId,
        organizationId: classEntity.organizationId,
        qrCode: classEntity.qrCode,
        qrCodeUrl,
        status: classEntity.status,
        createdAt: classEntity.createdAt,
        updatedAt: classEntity.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating class:", error);
    return res.status(500).json({ error: "Failed to update class" });
  }
});

/**
 * @swagger
 * /api/classes/{classId}:
 *   delete:
 *     summary: Delete (archive) a class
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Class archived successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Class not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:classId", requireAuth, async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;

    const classRepo = AppDataSource.getRepository(Class);
    const teacherRepo = AppDataSource.getRepository(Teacher);

    const classEntity = await classRepo.findOne({ where: { id: classId } });

    if (!classEntity) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Verify access
    if (teacherId) {
      const teacher = await teacherRepo.findOne({ where: { id: teacherId } });
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      if (
        classEntity.teacherId !== teacherId &&
        (!teacher.organizationId || classEntity.organizationId !== teacher.organizationId)
      ) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else if (organizationId) {
      if (classEntity.organizationId !== organizationId) {
        return res.status(403).json({ error: "Access denied" });
      }
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Archive instead of delete (soft delete)
    classEntity.status = "archived";
    await classRepo.save(classEntity);

    return res.json({
      success: true,
      message: "Class archived successfully",
    });
  } catch (error) {
    console.error("Error archiving class:", error);
    return res.status(500).json({ error: "Failed to archive class" });
  }
});

export default router;

