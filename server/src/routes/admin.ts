import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Admin, Teacher, Organization, StudentFeedback, Subscription } from "../models";
import { comparePassword } from "../utils/password";
import { signAccessToken } from "../utils/jwt";
import { requireAdmin } from "../middleware/auth";

const router = Router();

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [super_admin, admin]
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

    const adminRepo = AppDataSource.getRepository(Admin);

    const admin = await adminRepo.findOne({ where: { email } });
    if (!admin) {
      console.log(`Admin not found for email: ${email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check if password hash exists
    if (!admin.passwordHash || admin.passwordHash.length === 0) {
      console.error(`Admin ${admin.email} exists but has no password hash!`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(`Admin found: ${admin.email}, passwordHash length: ${admin.passwordHash.length}`);
    
    const isValid = await comparePassword(password, admin.passwordHash);
    console.log(`Password comparison result: ${isValid}`);
    
    if (!isValid) {
      console.log(`Password mismatch for admin ${admin.email}`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signAccessToken({
      adminId: admin.id,
      email: admin.email,
      userType: "admin",
      role: admin.role,
    });

    return res.json({
      success: true,
      token,
      userType: "admin",
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

/**
 * @swagger
 * /api/admin/teachers:
 *   get:
 *     summary: Get all teachers (admin only)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of teachers with details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 teachers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       address:
 *                         type: string
 *                       subject:
 *                         type: string
 *                       department:
 *                         type: string
 *                       organizationId:
 *                         type: string
 *                       status:
 *                         type: string
 *                       feedbackCount:
 *                         type: number
 *                       averageRating:
 *                         type: number
 *       500:
 *         description: Internal server error
 */
router.get("/teachers", requireAdmin, async (req, res) => {
  try {
    const teacherRepo = AppDataSource.getRepository(Teacher);
    const feedbackRepo = AppDataSource.getRepository(StudentFeedback);
    const subscriptionRepo = AppDataSource.getRepository(Subscription);

    const teachers = await teacherRepo.find({
      order: { createdAt: "DESC" },
    });

    // Get additional stats for each teacher
    const teachersWithDetails = await Promise.all(
      teachers.map(async (teacher) => {
        const feedback = await feedbackRepo.find({
          where: { teacherId: teacher.id },
        });

        const feedbackCount = feedback.length;
        const averageRating =
          feedbackCount > 0
            ? feedback.reduce((sum, f) => sum + f.overallRating, 0) / feedbackCount
            : 0;

        // Get active subscription
        const subscription = await subscriptionRepo.findOne({
          where: {
            teacherId: teacher.id,
            status: "active",
          },
          order: { startDate: "DESC" },
        });

        return {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          address: teacher.address,
          subject: teacher.subject,
          department: teacher.department,
          organizationId: teacher.organizationId,
          status: teacher.status,
          feedbackCount,
          averageRating: Math.round(averageRating * 100) / 100,
          createdAt: teacher.createdAt,
          updatedAt: teacher.updatedAt,
          subscription: subscription
            ? {
                id: subscription.id,
                plan: subscription.plan,
                status: subscription.status,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                monthlyPrice: subscription.monthlyPrice,
                defaultPrice: subscription.defaultPrice,
                discount: subscription.discount,
                finalPrice: subscription.finalPrice,
                amountPaid: subscription.amountPaid,
              }
            : undefined,
        };
      })
    );

    return res.json({ teachers: teachersWithDetails });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return res.status(500).json({ error: "Failed to fetch teachers" });
  }
});

/**
 * @swagger
 * /api/admin/teachers/status:
 *   patch:
 *     summary: Update teacher status (admin only)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacherId
 *               - status
 *             properties:
 *               teacherId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, blocked]
 *     responses:
 *       200:
 *         description: Teacher status updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Internal server error
 */
router.patch("/teachers/status", requireAdmin, async (req, res) => {
  try {
    const { teacherId, status } = req.body;

    if (!teacherId || !status) {
      return res.status(400).json({ error: "Teacher ID and status required" });
    }

    if (status !== "active" && status !== "blocked") {
      return res.status(400).json({ error: "Invalid status" });
    }

    const teacherRepo = AppDataSource.getRepository(Teacher);

    const teacher = await teacherRepo.findOne({ where: { id: teacherId } });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    teacher.status = status;
    await teacherRepo.save(teacher);

    return res.json({ success: true, teacher });
  } catch (error) {
    console.error("Error updating teacher status:", error);
    return res.status(500).json({ error: "Failed to update teacher status" });
  }
});

/**
 * @swagger
 * /api/admin/teachers/promote-premium:
 *   post:
 *     summary: Promote a teacher to premium (admin only)
 *     tags: [Admin]
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
 *               months:
 *                 type: number
 *                 description: Number of months for premium (null or undefined means forever)
 *     responses:
 *       200:
 *         description: Teacher promoted to premium
 *       400:
 *         description: Bad request
 *       404:
 *         description: Teacher not found
 *       500:
 *         description: Internal server error
 */
router.post("/teachers/promote-premium", requireAdmin, async (req, res) => {
  try {
    const { teacherId, months, discount, amountPaid } = req.body;

    if (!teacherId) {
      return res.status(400).json({ error: "Teacher ID required" });
    }

    const teacherRepo = AppDataSource.getRepository(Teacher);
    const subscriptionRepo = AppDataSource.getRepository(Subscription);

    const teacher = await teacherRepo.findOne({ where: { id: teacherId } });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Cancel any existing active subscriptions
    const existingSubscriptions = await subscriptionRepo.find({
      where: {
        teacherId,
        status: "active",
      },
    });

    for (const sub of existingSubscriptions) {
      sub.status = "cancelled";
      await subscriptionRepo.save(sub);
    }

    // Calculate pricing
    const DEFAULT_PRICE = 15000; // LKR 15,000 per month
    const numMonths = months && months > 0 ? months : null;
    const totalMonths = numMonths || 1; // For calculation purposes, use 1 if forever
    
    // Calculate total price
    const totalPrice = DEFAULT_PRICE * totalMonths;
    
    // Calculate discount (default to 0 if not provided)
    const discountAmount = discount || 0;
    
    // Calculate final price
    const finalPrice = totalPrice - discountAmount;
    
    // Use amountPaid if provided, otherwise use finalPrice
    const paidAmount = amountPaid !== undefined && amountPaid !== null ? amountPaid : finalPrice;

    // Create new premium subscription
    const startDate = new Date();
    let endDate: Date | null = null;

    if (numMonths !== null && numMonths > 0) {
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + numMonths);
    }
    // If months is null/undefined/0, endDate remains null (forever)

    const subscription = subscriptionRepo.create({
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      teacherId,
      plan: "premium",
      status: "active",
      startDate,
      endDate: endDate || undefined,
      monthlyPrice: DEFAULT_PRICE,
      defaultPrice: DEFAULT_PRICE,
      discount: discountAmount > 0 ? discountAmount : undefined,
      finalPrice: finalPrice,
      amountPaid: paidAmount,
    });

    await subscriptionRepo.save(subscription);

    return res.json({
      success: true,
      subscription: {
        id: subscription.id,
        teacherId: subscription.teacherId,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate || null,
        monthlyPrice: subscription.monthlyPrice,
        defaultPrice: subscription.defaultPrice,
        discount: subscription.discount || null,
        finalPrice: subscription.finalPrice,
        amountPaid: subscription.amountPaid || null,
      },
      message: numMonths ? `Premium enabled for ${numMonths} months` : "Premium enabled forever",
    });
  } catch (error) {
    console.error("Error promoting teacher to premium:", error);
    return res.status(500).json({ error: "Failed to promote teacher to premium" });
  }
});

/**
 * @swagger
 * /api/admin/teachers/cancel-subscription:
 *   post:
 *     summary: Cancel a teacher subscription (admin only)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionId
 *             properties:
 *               subscriptionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription cancelled
 *       400:
 *         description: Bad request
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */
router.post("/teachers/cancel-subscription", requireAdmin, async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: "Subscription ID required" });
    }

    const subscriptionRepo = AppDataSource.getRepository(Subscription);

    const subscription = await subscriptionRepo.findOne({ where: { id: subscriptionId } });
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    if (subscription.status === "cancelled") {
      return res.status(400).json({ error: "Subscription is already cancelled" });
    }

    subscription.status = "cancelled";
    await subscriptionRepo.save(subscription);

    return res.json({
      success: true,
      subscription: {
        id: subscription.id,
        teacherId: subscription.teacherId,
        organizationId: subscription.organizationId,
        plan: subscription.plan,
        status: subscription.status,
      },
      message: "Subscription cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

/**
 * @swagger
 * /api/admin/organizations:
 *   get:
 *     summary: Get all organizations (admin only)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of organizations with details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 organizations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       address:
 *                         type: string
 *                       website:
 *                         type: string
 *                       status:
 *                         type: string
 *                       teacherCount:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *       500:
 *         description: Internal server error
 */
router.get("/organizations", requireAdmin, async (req, res) => {
  try {
    const orgRepo = AppDataSource.getRepository(Organization);
    const teacherRepo = AppDataSource.getRepository(Teacher);
    const subscriptionRepo = AppDataSource.getRepository(Subscription);

    const organizations = await orgRepo.find({
      order: { createdAt: "DESC" },
    });

    // Get additional stats for each organization
    const organizationsWithDetails = await Promise.all(
      organizations.map(async (org) => {
        const teachers = await teacherRepo.find({
          where: { organizationId: org.id },
        });

        const teacherCount = teachers.length;

        // Get active subscription
        const subscription = await subscriptionRepo.findOne({
          where: {
            organizationId: org.id,
            status: "active",
          },
          order: { startDate: "DESC" },
        });

        return {
          id: org.id,
          name: org.name,
          email: org.email,
          phone: org.phone,
          address: org.address,
          website: org.website,
          status: org.status,
          teacherCount,
          createdAt: org.createdAt,
          updatedAt: org.updatedAt,
          subscription: subscription
            ? {
                id: subscription.id,
                plan: subscription.plan,
                status: subscription.status,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                monthlyPrice: subscription.monthlyPrice,
                defaultPrice: subscription.defaultPrice,
                discount: subscription.discount,
                finalPrice: subscription.finalPrice,
                amountPaid: subscription.amountPaid,
              }
            : undefined,
        };
      })
    );

    return res.json({ organizations: organizationsWithDetails });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return res.status(500).json({ error: "Failed to fetch organizations" });
  }
});

/**
 * @swagger
 * /api/admin/organizations/status:
 *   patch:
 *     summary: Update organization status (admin only)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - status
 *             properties:
 *               organizationId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, blocked]
 *     responses:
 *       200:
 *         description: Organization status updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Internal server error
 */
router.patch("/organizations/status", requireAdmin, async (req, res) => {
  try {
    const { organizationId, status } = req.body;

    if (!organizationId || !status) {
      return res.status(400).json({ error: "Organization ID and status required" });
    }

    if (status !== "active" && status !== "blocked") {
      return res.status(400).json({ error: "Invalid status" });
    }

    const orgRepo = AppDataSource.getRepository(Organization);

    const organization = await orgRepo.findOne({ where: { id: organizationId } });
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    organization.status = status;
    await orgRepo.save(organization);

    return res.json({ success: true, organization });
  } catch (error) {
    console.error("Error updating organization status:", error);
    return res.status(500).json({ error: "Failed to update organization status" });
  }
});

/**
 * @swagger
 * /api/admin/organizations/promote-premium:
 *   post:
 *     summary: Promote an organization to premium (admin only)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *             properties:
 *               organizationId:
 *                 type: string
 *               months:
 *                 type: number
 *                 description: Number of months for premium (null or undefined means forever)
 *               discount:
 *                 type: number
 *               amountPaid:
 *                 type: number
 *     responses:
 *       200:
 *         description: Organization promoted to premium
 *       400:
 *         description: Bad request
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Internal server error
 */
router.post("/organizations/promote-premium", requireAdmin, async (req, res) => {
  try {
    const { organizationId, months, discount, amountPaid } = req.body;

    if (!organizationId) {
      return res.status(400).json({ error: "Organization ID required" });
    }

    const orgRepo = AppDataSource.getRepository(Organization);
    const subscriptionRepo = AppDataSource.getRepository(Subscription);

    const organization = await orgRepo.findOne({ where: { id: organizationId } });
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    // Cancel any existing active subscriptions
    const existingSubscriptions = await subscriptionRepo.find({
      where: {
        organizationId,
        status: "active",
      },
    });

    for (const sub of existingSubscriptions) {
      sub.status = "cancelled";
      await subscriptionRepo.save(sub);
    }

    // Calculate pricing
    const DEFAULT_PRICE = 15000; // LKR 15,000 per month
    const numMonths = months && months > 0 ? months : null;
    const totalMonths = numMonths || 1; // For calculation purposes, use 1 if forever
    
    // Calculate total price
    const totalPrice = DEFAULT_PRICE * totalMonths;
    
    // Calculate discount (default to 0 if not provided)
    const discountAmount = discount || 0;
    
    // Calculate final price
    const finalPrice = totalPrice - discountAmount;
    
    // Use amountPaid if provided, otherwise use finalPrice
    const paidAmount = amountPaid !== undefined && amountPaid !== null ? amountPaid : finalPrice;

    // Create new premium subscription
    const startDate = new Date();
    let endDate: Date | null = null;

    if (numMonths !== null && numMonths > 0) {
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + numMonths);
    }
    // If months is null/undefined/0, endDate remains null (forever)

    const subscription = subscriptionRepo.create({
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      organizationId,
      plan: "premium",
      status: "active",
      startDate,
      endDate: endDate || undefined,
      monthlyPrice: DEFAULT_PRICE,
      defaultPrice: DEFAULT_PRICE,
      discount: discountAmount > 0 ? discountAmount : undefined,
      finalPrice: finalPrice,
      amountPaid: paidAmount,
    });

    await subscriptionRepo.save(subscription);

    return res.json({
      success: true,
      subscription: {
        id: subscription.id,
        organizationId: subscription.organizationId,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate || null,
        monthlyPrice: subscription.monthlyPrice,
        defaultPrice: subscription.defaultPrice,
        discount: subscription.discount || null,
        finalPrice: subscription.finalPrice,
        amountPaid: subscription.amountPaid || null,
      },
      message: numMonths ? `Premium enabled for ${numMonths} months` : "Premium enabled forever",
    });
  } catch (error) {
    console.error("Error promoting organization to premium:", error);
    return res.status(500).json({ error: "Failed to promote organization to premium" });
  }
});

/**
 * @swagger
 * /api/admin/organizations/cancel-subscription:
 *   post:
 *     summary: Cancel an organization subscription (admin only)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subscriptionId
 *             properties:
 *               subscriptionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription cancelled
 *       400:
 *         description: Bad request
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Internal server error
 */
router.post("/organizations/cancel-subscription", requireAdmin, async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: "Subscription ID required" });
    }

    const subscriptionRepo = AppDataSource.getRepository(Subscription);

    const subscription = await subscriptionRepo.findOne({ where: { id: subscriptionId } });
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    if (subscription.status === "cancelled") {
      return res.status(400).json({ error: "Subscription is already cancelled" });
    }

    subscription.status = "cancelled";
    await subscriptionRepo.save(subscription);

    return res.json({
      success: true,
      subscription: {
        id: subscription.id,
        teacherId: subscription.teacherId,
        organizationId: subscription.organizationId,
        plan: subscription.plan,
        status: subscription.status,
      },
      message: "Subscription cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return res.status(500).json({ error: "Failed to cancel subscription" });
  }
});

export default router;

