import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Organization, OrganizationAuth, Teacher, TeacherAuth, Subscription } from "../models";
import { hashPassword, comparePassword } from "../utils/password";
import { generateTeacherId, generateOrganizationId, generateQRCodeUrl } from "../utils/qr-generator";
import { signAccessToken, verifyAccessToken, extractTokenFromHeader } from "../utils/jwt";
import { getActiveSubscription } from "../utils/subscription";
import { isPremium } from "../utils/subscription";

const router = Router();

/**
 * @swagger
 * /api/auth/register/organization:
 *   post:
 *     summary: Register a new organization (institute)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationName
 *               - email
 *               - password
 *               - phone
 *               - address
 *             properties:
 *               organizationName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               website:
 *                 type: string
 *     responses:
 *       201:
 *         description: Organization registered successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/register/organization", async (req, res) => {
  try {
    const { organizationName, email, password, phone, address, website } = req.body;

    if (!organizationName || !email || !password || !phone || !address) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const orgRepo = AppDataSource.getRepository(Organization);
    const authRepo = AppDataSource.getRepository(OrganizationAuth);

    // Check if organization already exists
    const existingOrg = await orgRepo.findOne({ where: { email } });
    if (existingOrg) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create organization ID
    const organizationId = generateOrganizationId();

    // Create organization
    const organization = orgRepo.create({
      id: organizationId,
      name: organizationName,
      email,
      phone,
      address,
      website,
      status: "active",
    });

    await orgRepo.save(organization);

    // Create auth entry
    const passwordHash = await hashPassword(password);
    const auth = authRepo.create({
      organizationId,
      email,
      passwordHash,
    });

    await authRepo.save(auth);

    const token = signAccessToken({
      organizationId,
      email,
      userType: "organization",
    });

    return res.status(201).json({
      success: true,
      organizationId,
      token,
      organization: {
        id: organization.id,
        name: organization.name,
        email: organization.email,
      },
    });
  } catch (error) {
    console.error("Organization registration error:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * @swagger
 * /api/auth/register/teacher:
 *   post:
 *     summary: Register a new teacher (single or under organization)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacherName
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               teacherName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
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
 *               organizationId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Teacher registered successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/register/teacher", async (req, res) => {
  try {
    const { teacherName, email, password, phone, address, subject, department, organizationId } = req.body;

    if (!teacherName || !email || !password || !phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const teacherRepo = AppDataSource.getRepository(Teacher);
    const authRepo = AppDataSource.getRepository(TeacherAuth);

    // Check if teacher already exists
    const existingTeacher = await teacherRepo.findOne({ where: { email } });
    if (existingTeacher) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // If organizationId provided, verify it exists
    if (organizationId) {
      const orgRepo = AppDataSource.getRepository(Organization);
      const org = await orgRepo.findOne({ where: { id: organizationId } });
      if (!org) {
        return res.status(400).json({ error: "Organization not found" });
      }
    }

    // Create teacher ID
    const teacherId = generateTeacherId();

    // Create teacher
    const teacher = teacherRepo.create({
      id: teacherId,
      name: teacherName,
      email,
      phone,
      address,
      subject,
      department,
      qrCode: teacherId,
      organizationId: organizationId || null,
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

    const token = signAccessToken({
      teacherId,
      email,
      userType: "teacher",
    });

    return res.status(201).json({
      success: true,
      teacherId,
      token,
      qrCodeUrl: generateQRCodeUrl(teacherId),
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        organizationId: teacher.organizationId,
      },
    });
  } catch (error) {
    console.error("Teacher registration error:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login (supports both organization and teacher)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Try organization auth
    const orgAuthRepo = AppDataSource.getRepository(OrganizationAuth);
    const orgAuth = await orgAuthRepo.findOne({ where: { email } });

    if (orgAuth) {
      const isValid = await comparePassword(password, orgAuth.passwordHash);
      if (isValid) {
        const orgRepo = AppDataSource.getRepository(Organization);
        const organization = await orgRepo.findOne({ where: { id: orgAuth.organizationId } });
        if (!organization) {
          return res.status(404).json({ error: "Organization not found" });
        }

        const token = signAccessToken({
          organizationId: organization.id,
          email: organization.email,
          userType: "organization",
        });

        return res.json({
          success: true,
          token,
          userType: "organization",
          organization: {
            id: organization.id,
            name: organization.name,
            email: organization.email,
          },
        });
      }
    }

    // Try teacher auth
    const teacherAuthRepo = AppDataSource.getRepository(TeacherAuth);
    const teacherAuth = await teacherAuthRepo.findOne({ where: { email } });

    if (teacherAuth) {
      const isValid = await comparePassword(password, teacherAuth.passwordHash);
      if (isValid) {
        const teacherRepo = AppDataSource.getRepository(Teacher);
        const teacher = await teacherRepo.findOne({ where: { id: teacherAuth.teacherId } });
        if (!teacher) {
          return res.status(404).json({ error: "Teacher not found" });
        }

        const token = signAccessToken({
          teacherId: teacher.id,
          email: teacher.email,
          userType: "teacher",
        });

        return res.json({
          success: true,
          token,
          userType: "teacher",
          teacherId: teacher.id,
          teacher: {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            organizationId: teacher.organizationId,
          },
        });
      }
    }

    return res.status(401).json({ error: "Invalid email or password" });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user (organization or teacher)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *       401:
 *         description: Unauthorized
 */
router.get("/me", async (req, res) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Handle organization
    if (payload.organizationId) {
      const orgRepo = AppDataSource.getRepository(Organization);
      const organization = await orgRepo.findOne({ where: { id: payload.organizationId } });

      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }

      const subscription = await getActiveSubscription(organization.id, "organization");

      return res.json({
        success: true,
        userType: "organization",
        organization: {
          id: organization.id,
          name: organization.name,
          email: organization.email,
          subscription: subscription
            ? {
                id: subscription.id,
                plan: subscription.plan,
                status: subscription.status,
                startDate: subscription.startDate,
                endDate: subscription.endDate || null,
                monthlyPrice: subscription.monthlyPrice,
              }
            : null,
        },
      });
    }

    // Handle teacher
    if (payload.teacherId) {
      const teacherRepo = AppDataSource.getRepository(Teacher);
      const teacher = await teacherRepo.findOne({ where: { id: payload.teacherId } });

      if (!teacher) {
        return res.status(404).json({ error: "Teacher not found" });
      }

      // Get subscription (check teacher's own subscription or organization's subscription)
      let subscription = await getActiveSubscription(teacher.id, "teacher");
      if (!subscription && teacher.organizationId) {
        subscription = await getActiveSubscription(teacher.organizationId, "organization");
      }

      return res.json({
        success: true,
        userType: "teacher",
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          organizationId: teacher.organizationId,
          subscription: subscription
            ? {
                id: subscription.id,
                plan: subscription.plan,
                status: subscription.status,
                startDate: subscription.startDate,
                endDate: subscription.endDate || null,
                monthlyPrice: subscription.monthlyPrice,
              }
            : null,
        },
      });
    }

    return res.status(401).json({ error: "Invalid token payload" });
  } catch (error) {
    console.error("Auth me error:", error);
    return res.status(500).json({ error: "Failed to fetch current user" });
  }
});

export default router;
