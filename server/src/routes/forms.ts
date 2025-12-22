import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Form, Teacher, Organization, FormTag, Tag } from "../models";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/forms:
 *   get:
 *     summary: Get all forms for a teacher or organization
 *     tags: [Forms]
 *     parameters:
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *         description: Filter by teacher ID
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *         description: Filter by organization ID
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Include inactive forms
 *     responses:
 *       200:
 *         description: List of forms
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    const teacherId = req.teacherId as string | undefined;
    const organizationId = req.organizationId as string | undefined;
    const queryTeacherId = req.query.teacherId as string | undefined;
    const queryOrganizationId = req.query.organizationId as string | undefined;
    const includeInactive = req.query.includeInactive === "true";

    const formRepo = AppDataSource.getRepository(Form);
    const teacherRepo = AppDataSource.getRepository(Teacher);

    let forms: Form[] = [];

    if (teacherId || queryTeacherId) {
      const targetTeacherId = teacherId || queryTeacherId;
      
      // Verify teacher access if authenticated as teacher
      if (teacherId && queryTeacherId && teacherId !== queryTeacherId) {
        return res.status(403).json({ error: "Cannot access other teacher's forms" });
      }

      // If authenticated as organization, verify teacher belongs to organization
      if (organizationId && queryTeacherId) {
        const teacher = await teacherRepo.findOne({
          where: { id: queryTeacherId, organizationId },
        });
        if (!teacher) {
          return res.status(403).json({ error: "Teacher not found in organization" });
        }
      }

      const whereCondition: any = { teacherId: targetTeacherId, isActive: true };
      if (includeInactive) {
        forms = await formRepo.find({
          where: [
            { teacherId: targetTeacherId, isActive: true },
            { teacherId: targetTeacherId, isActive: false },
          ],
          relations: ["tags", "tags.tag"],
          order: { isGeneral: "DESC", createdAt: "DESC" },
        });
      } else {
        forms = await formRepo.find({
          where: whereCondition,
          relations: ["tags", "tags.tag"],
          order: { isGeneral: "DESC", createdAt: "DESC" },
        });
      }
    } else if (organizationId || queryOrganizationId) {
      const targetOrgId = organizationId || queryOrganizationId;
      
      // Verify organization access if authenticated as organization
      if (organizationId && queryOrganizationId && organizationId !== queryOrganizationId) {
        return res.status(403).json({ error: "Cannot access other organization's forms" });
      }

      const whereCondition: any = { organizationId: targetOrgId, isActive: true };
      if (includeInactive) {
        forms = await formRepo.find({
          where: [
            { organizationId: targetOrgId, isActive: true },
            { organizationId: targetOrgId, isActive: false },
          ],
          relations: ["tags", "tags.tag"],
          order: { isGeneral: "DESC", createdAt: "DESC" },
        });
      } else {
        forms = await formRepo.find({
          where: whereCondition,
          relations: ["tags", "tags.tag"],
          order: { isGeneral: "DESC", createdAt: "DESC" },
        });
      }
    } else {
      return res.status(400).json({ error: "teacherId or organizationId required" });
    }

    return res.json({ forms });
  } catch (error) {
    console.error("Error fetching forms:", error);
    return res.status(500).json({ error: "Failed to fetch forms" });
  }
});

/**
 * @swagger
 * /api/forms:
 *   post:
 *     summary: Create a new form
 *     tags: [Forms]
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
 *               teacherId:
 *                 type: string
 *               organizationId:
 *                 type: string
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Form created successfully
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, description, teacherId, organizationId, tagIds } = req.body;
    const authenticatedTeacherId = req.teacherId as string | undefined;
    const authenticatedOrganizationId = req.organizationId as string | undefined;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Form name is required" });
    }

    // Validate that either teacherId or organizationId is provided, but not both
    if (!teacherId && !organizationId) {
      return res.status(400).json({ error: "Either teacherId or organizationId must be provided" });
    }

    if (teacherId && organizationId) {
      return res.status(400).json({ error: "Cannot specify both teacherId and organizationId" });
    }

    const formRepo = AppDataSource.getRepository(Form);
    const teacherRepo = AppDataSource.getRepository(Teacher);
    const orgRepo = AppDataSource.getRepository(Organization);
    const tagRepo = AppDataSource.getRepository(Tag);
    const formTagRepo = AppDataSource.getRepository(FormTag);

    // If creating a teacher form, verify the teacher exists and belongs to authenticated user
    if (teacherId) {
      if (authenticatedTeacherId && teacherId !== authenticatedTeacherId) {
        return res.status(403).json({ error: "Cannot create forms for other teachers" });
      }

      // If authenticated as organization, verify teacher belongs to organization
      if (authenticatedOrganizationId) {
        const teacher = await teacherRepo.findOne({
          where: { id: teacherId, organizationId: authenticatedOrganizationId },
        });
        if (!teacher) {
          return res.status(403).json({ error: "Teacher not found in organization" });
        }
      }

      const teacher = await teacherRepo.findOne({ where: { id: teacherId } });
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }
    }

    // If creating an organization form, verify the organization exists
    if (organizationId) {
      const org = await orgRepo.findOne({ where: { id: organizationId } });
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }

      // If authenticated as organization, verify it's their own organization
      if (authenticatedOrganizationId && organizationId !== authenticatedOrganizationId) {
        return res.status(403).json({ error: "Cannot create forms for other organizations" });
      }

      // If authenticated as a teacher, verify they belong to this organization
      if (authenticatedTeacherId) {
        const teacher = await teacherRepo.findOne({
          where: { id: authenticatedTeacherId, organizationId },
        });
        if (!teacher) {
          return res.status(403).json({ error: "Cannot create organization forms if not a member" });
        }
      }
    }

    // Create form (custom forms only - general forms are created automatically)
    const form = formRepo.create({
      id: `form_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: name.trim(),
      description: description?.trim() || undefined,
      isGeneral: false, // Only allow creating custom forms via API
      teacherId: teacherId || undefined,
      organizationId: organizationId || undefined,
      isActive: true,
    });

    await formRepo.save(form);

    // Associate tags with form
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      // Verify all tags exist and belong to the same scope
      const tags = await tagRepo.find({
        where: tagIds.map((tagId: string) => ({
          id: tagId,
          ...(teacherId ? { teacherId } : { organizationId }),
        })),
      });

      if (tags.length !== tagIds.length) {
        return res.status(400).json({ error: "One or more tags not found" });
      }

      const formTags = tagIds.map((tagId: string) =>
        formTagRepo.create({
          id: `form_tag_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          formId: form.id,
          tagId,
        })
      );
      await formTagRepo.save(formTags);
    }

    // Reload form with relations
    const savedForm = await formRepo.findOne({
      where: { id: form.id },
      relations: ["tags", "tags.tag"],
    });

    return res.status(201).json({ success: true, form: savedForm });
  } catch (error) {
    console.error("Error creating form:", error);
    return res.status(500).json({ error: "Failed to create form" });
  }
});

/**
 * @swagger
 * /api/forms/{formId}:
 *   patch:
 *     summary: Update a form
 *     tags: [Forms]
 *     parameters:
 *       - in: path
 *         name: formId
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
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Form updated successfully
 */
router.patch("/:formId", requireAuth, async (req, res) => {
  try {
    const { formId } = req.params;
    const { name, description, tagIds } = req.body;
    const authenticatedTeacherId = req.teacherId as string | undefined;
    const authenticatedOrganizationId = req.organizationId as string | undefined;

    const formRepo = AppDataSource.getRepository(Form);
    const teacherRepo = AppDataSource.getRepository(Teacher);
    const tagRepo = AppDataSource.getRepository(Tag);
    const formTagRepo = AppDataSource.getRepository(FormTag);

    const form = await formRepo.findOne({
      where: { id: formId },
      relations: ["tags"],
    });

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Verify ownership
    if (authenticatedTeacherId) {
      if (form.teacherId && form.teacherId !== authenticatedTeacherId) {
        return res.status(403).json({ error: "Cannot update forms for other teachers" });
      }

      if (form.organizationId) {
        const teacher = await teacherRepo.findOne({
          where: { id: authenticatedTeacherId, organizationId: form.organizationId },
        });
        if (!teacher) {
          return res.status(403).json({ error: "Cannot update organization forms if not a member" });
        }
      }
    }

    if (authenticatedOrganizationId) {
      if (form.organizationId && form.organizationId !== authenticatedOrganizationId) {
        return res.status(403).json({ error: "Cannot update forms for other organizations" });
      }

      if (form.teacherId) {
        const teacher = await teacherRepo.findOne({
          where: { id: form.teacherId, organizationId: authenticatedOrganizationId },
        });
        if (!teacher) {
          return res.status(403).json({ error: "Teacher not found in organization" });
        }
      }
    }

    // Prevent archiving general form
    if (form.isGeneral) {
      return res.status(400).json({ error: "Cannot modify general form" });
    }

    // Update fields
    if (name !== undefined) form.name = name.trim();
    if (description !== undefined) form.description = description?.trim() || undefined;

    await formRepo.save(form);

    // Update tags if provided
    if (tagIds !== undefined) {
      // Remove existing tags
      await formTagRepo.delete({ formId: form.id });

      // Add new tags
      if (Array.isArray(tagIds) && tagIds.length > 0) {
        const scope = form.teacherId ? { teacherId: form.teacherId } : { organizationId: form.organizationId };
        const tags = await tagRepo.find({
          where: tagIds.map((tagId: string) => ({ id: tagId, ...scope })),
        });

        if (tags.length !== tagIds.length) {
          return res.status(400).json({ error: "One or more tags not found" });
        }

        const formTags = tagIds.map((tagId: string) =>
          formTagRepo.create({
            id: `form_tag_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            formId: form.id,
            tagId,
          })
        );
        await formTagRepo.save(formTags);
      }
    }

    // Reload form with relations
    const updatedForm = await formRepo.findOne({
      where: { id: form.id },
      relations: ["tags", "tags.tag"],
    });

    return res.json({ success: true, form: updatedForm });
  } catch (error) {
    console.error("Error updating form:", error);
    return res.status(500).json({ error: "Failed to update form" });
  }
});

/**
 * @swagger
 * /api/forms/{formId}:
 *   delete:
 *     summary: Delete a form (soft delete, but general form cannot be deleted)
 *     tags: [Forms]
 *     parameters:
 *       - in: path
 *         name: formId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Form deleted successfully
 */
router.delete("/:formId", requireAuth, async (req, res) => {
  try {
    const { formId } = req.params;
    const authenticatedTeacherId = req.teacherId as string | undefined;
    const authenticatedOrganizationId = req.organizationId as string | undefined;

    const formRepo = AppDataSource.getRepository(Form);
    const teacherRepo = AppDataSource.getRepository(Teacher);

    const form = await formRepo.findOne({ where: { id: formId } });

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    // Prevent deleting general form
    if (form.isGeneral) {
      return res.status(400).json({ error: "Cannot delete general form" });
    }

    // Verify ownership
    if (authenticatedTeacherId) {
      if (form.teacherId && form.teacherId !== authenticatedTeacherId) {
        return res.status(403).json({ error: "Cannot delete forms for other teachers" });
      }

      if (form.organizationId) {
        const teacher = await teacherRepo.findOne({
          where: { id: authenticatedTeacherId, organizationId: form.organizationId },
        });
        if (!teacher) {
          return res.status(403).json({ error: "Cannot delete organization forms if not a member" });
        }
      }
    }

    if (authenticatedOrganizationId) {
      if (form.organizationId && form.organizationId !== authenticatedOrganizationId) {
        return res.status(403).json({ error: "Cannot delete forms for other organizations" });
      }

      if (form.teacherId) {
        const teacher = await teacherRepo.findOne({
          where: { id: form.teacherId, organizationId: authenticatedOrganizationId },
        });
        if (!teacher) {
          return res.status(403).json({ error: "Teacher not found in organization" });
        }
      }
    }

    // Soft delete
    form.isActive = false;
    await formRepo.save(form);

    return res.json({ success: true, message: "Form deleted successfully" });
  } catch (error) {
    console.error("Error deleting form:", error);
    return res.status(500).json({ error: "Failed to delete form" });
  }
});

/**
 * @swagger
 * /api/forms/general:
 *   post:
 *     summary: Create or get the general form for a teacher or organization
 *     tags: [Forms]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacherId or organizationId
 *             properties:
 *               teacherId:
 *                 type: string
 *               organizationId:
 *                 type: string
 *     responses:
 *       200:
 *         description: General form (created or existing)
 */
router.post("/general", requireAuth, async (req, res) => {
  try {
    const { teacherId, organizationId } = req.body;
    const authenticatedTeacherId = req.teacherId as string | undefined;
    const authenticatedOrganizationId = req.organizationId as string | undefined;

    if (!teacherId && !organizationId) {
      return res.status(400).json({ error: "Either teacherId or organizationId must be provided" });
    }

    if (teacherId && organizationId) {
      return res.status(400).json({ error: "Cannot specify both teacherId and organizationId" });
    }

    const formRepo = AppDataSource.getRepository(Form);
    const teacherRepo = AppDataSource.getRepository(Teacher);
    const orgRepo = AppDataSource.getRepository(Organization);

    // Verify access
    if (teacherId) {
      if (authenticatedTeacherId && teacherId !== authenticatedTeacherId) {
        return res.status(403).json({ error: "Cannot create general form for other teachers" });
      }

      if (authenticatedOrganizationId) {
        const teacher = await teacherRepo.findOne({
          where: { id: teacherId, organizationId: authenticatedOrganizationId },
        });
        if (!teacher) {
          return res.status(403).json({ error: "Teacher not found in organization" });
        }
      }

      const teacher = await teacherRepo.findOne({ where: { id: teacherId } });
      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }
    }

    if (organizationId) {
      if (authenticatedOrganizationId && organizationId !== authenticatedOrganizationId) {
        return res.status(403).json({ error: "Cannot create general form for other organizations" });
      }

      const org = await orgRepo.findOne({ where: { id: organizationId } });
      if (!org) {
        return res.status(404).json({ error: "Organization not found" });
      }
    }

    // Check if general form already exists
    const existingForm = await formRepo.findOne({
      where: teacherId
        ? { teacherId, isGeneral: true }
        : { organizationId, isGeneral: true },
      relations: ["tags", "tags.tag"],
    });

    if (existingForm) {
      return res.json({ success: true, form: existingForm });
    }

    // Create general form
    const form = formRepo.create({
      id: `form_general_${teacherId || organizationId}_${Date.now()}`,
      name: "General Feedback Form",
      description: "Default feedback form for collecting student feedback",
      isGeneral: true,
      teacherId: teacherId || undefined,
      organizationId: organizationId || undefined,
      isActive: true,
    });

    await formRepo.save(form);

    // Reload with relations
    const savedForm = await formRepo.findOne({
      where: { id: form.id },
      relations: ["tags", "tags.tag"],
    });

    return res.status(201).json({ success: true, form: savedForm });
  } catch (error) {
    console.error("Error creating general form:", error);
    return res.status(500).json({ error: "Failed to create general form" });
  }
});

export default router;

