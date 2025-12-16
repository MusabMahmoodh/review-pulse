import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Admin, Restaurant, CustomerFeedback, Subscription } from "../models";
import { comparePassword } from "../utils/password";

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

    return res.json({
      success: true,
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
 * /api/admin/restaurants:
 *   get:
 *     summary: Get all restaurants (admin only)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of restaurants with details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurants:
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
 *                       status:
 *                         type: string
 *                       feedbackCount:
 *                         type: number
 *                       averageRating:
 *                         type: number
 *       500:
 *         description: Internal server error
 */
router.get("/restaurants", async (req, res) => {
  try {
    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const feedbackRepo = AppDataSource.getRepository(CustomerFeedback);
    const subscriptionRepo = AppDataSource.getRepository(Subscription);

    const restaurants = await restaurantRepo.find({
      order: { createdAt: "DESC" },
    });

    // Get additional stats for each restaurant
    const restaurantsWithDetails = await Promise.all(
      restaurants.map(async (restaurant) => {
        const feedback = await feedbackRepo.find({
          where: { restaurantId: restaurant.id },
        });

        const feedbackCount = feedback.length;
        const averageRating =
          feedbackCount > 0
            ? feedback.reduce((sum, f) => sum + f.overallRating, 0) / feedbackCount
            : 0;

        // Get active subscription
        const subscription = await subscriptionRepo.findOne({
          where: {
            restaurantId: restaurant.id,
            status: "active",
          },
          order: { startDate: "DESC" },
        });

        return {
          id: restaurant.id,
          name: restaurant.name,
          email: restaurant.email,
          phone: restaurant.phone,
          address: restaurant.address,
          status: restaurant.status,
          feedbackCount,
          averageRating: Math.round(averageRating * 100) / 100,
          createdAt: restaurant.createdAt,
          updatedAt: restaurant.updatedAt,
          subscription: subscription
            ? {
                id: subscription.id,
                plan: subscription.plan,
                status: subscription.status,
                startDate: subscription.startDate,
                endDate: subscription.endDate,
                monthlyPrice: subscription.monthlyPrice,
              }
            : undefined,
        };
      })
    );

    return res.json({ restaurants: restaurantsWithDetails });
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

/**
 * @swagger
 * /api/admin/restaurants/status:
 *   patch:
 *     summary: Update restaurant status (admin only)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *               - status
 *             properties:
 *               restaurantId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, blocked]
 *     responses:
 *       200:
 *         description: Restaurant status updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Internal server error
 */
router.patch("/restaurants/status", async (req, res) => {
  try {
    const { restaurantId, status } = req.body;

    if (!restaurantId || !status) {
      return res.status(400).json({ error: "Restaurant ID and status required" });
    }

    if (status !== "active" && status !== "blocked") {
      return res.status(400).json({ error: "Invalid status" });
    }

    const restaurantRepo = AppDataSource.getRepository(Restaurant);

    const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    restaurant.status = status;
    await restaurantRepo.save(restaurant);

    return res.json({ success: true, restaurant });
  } catch (error) {
    console.error("Error updating restaurant status:", error);
    return res.status(500).json({ error: "Failed to update restaurant status" });
  }
});

/**
 * @swagger
 * /api/admin/restaurants/promote-premium:
 *   post:
 *     summary: Promote a restaurant to premium (admin only)
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantId
 *             properties:
 *               restaurantId:
 *                 type: string
 *               months:
 *                 type: number
 *                 description: Number of months for premium (null or undefined means forever)
 *     responses:
 *       200:
 *         description: Restaurant promoted to premium
 *       400:
 *         description: Bad request
 *       404:
 *         description: Restaurant not found
 *       500:
 *         description: Internal server error
 */
router.post("/restaurants/promote-premium", async (req, res) => {
  try {
    const { restaurantId, months } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const subscriptionRepo = AppDataSource.getRepository(Subscription);

    const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Cancel any existing active subscriptions
    const existingSubscriptions = await subscriptionRepo.find({
      where: {
        restaurantId,
        status: "active",
      },
    });

    for (const sub of existingSubscriptions) {
      sub.status = "cancelled";
      await subscriptionRepo.save(sub);
    }

    // Create new premium subscription
    const startDate = new Date();
    let endDate: Date | null = null;

    if (months !== null && months !== undefined && months > 0) {
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + months);
    }
    // If months is null/undefined/0, endDate remains null (forever)

    const subscription = subscriptionRepo.create({
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      restaurantId,
      plan: "premium",
      status: "active",
      startDate,
      endDate: endDate || undefined,
      monthlyPrice: 0, // Admin promotion is free
    });

    await subscriptionRepo.save(subscription);

    return res.json({
      success: true,
      subscription: {
        id: subscription.id,
        restaurantId: subscription.restaurantId,
        plan: subscription.plan,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        monthlyPrice: subscription.monthlyPrice,
      },
      message: months ? `Premium enabled for ${months} months` : "Premium enabled forever",
    });
  } catch (error) {
    console.error("Error promoting restaurant to premium:", error);
    return res.status(500).json({ error: "Failed to promote restaurant to premium" });
  }
});

export default router;

