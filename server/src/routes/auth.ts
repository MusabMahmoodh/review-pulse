import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Restaurant, RestaurantAuth } from "../models";
import { hashPassword, comparePassword } from "../utils/password";
import { generateRestaurantId, generateQRCodeUrl } from "../utils/qr-generator";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new restaurant
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurantName
 *               - email
 *               - password
 *               - phone
 *               - address
 *             properties:
 *               restaurantName:
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
 *               socialKeywords:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Restaurant registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 restaurantId:
 *                   type: string
 *                 qrCodeUrl:
 *                   type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/register", async (req, res) => {
  try {
    const { restaurantName, email, password, phone, address, socialKeywords } = req.body;

    if (!restaurantName || !email || !password || !phone || !address) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const authRepo = AppDataSource.getRepository(RestaurantAuth);

    // Check if restaurant already exists
    const existingRestaurant = await restaurantRepo.findOne({ where: { email } });
    if (existingRestaurant) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create restaurant ID
    const restaurantId = generateRestaurantId();

    // Create restaurant
    const restaurant = restaurantRepo.create({
      id: restaurantId,
      name: restaurantName,
      email,
      phone,
      address,
      qrCode: restaurantId,
      socialKeywords: socialKeywords || [],
      status: "active",
    });

    await restaurantRepo.save(restaurant);

    // Create auth entry
    const passwordHash = await hashPassword(password);
    const auth = authRepo.create({
      restaurantId,
      email,
      passwordHash,
    });

    await authRepo.save(auth);

    return res.status(201).json({
      success: true,
      restaurantId,
      qrCodeUrl: generateQRCodeUrl(restaurantId),
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Registration failed" });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login restaurant
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 restaurantId:
 *                   type: string
 *                 restaurant:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const authRepo = AppDataSource.getRepository(RestaurantAuth);
    const restaurantRepo = AppDataSource.getRepository(Restaurant);

    // Find auth entry
    const auth = await authRepo.findOne({ where: { email } });
    if (!auth) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isValid = await comparePassword(password, auth.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Get restaurant
    const restaurant = await restaurantRepo.findOne({ where: { id: auth.restaurantId } });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    return res.json({
      success: true,
      restaurantId: restaurant.id,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        email: restaurant.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed" });
  }
});

export default router;

