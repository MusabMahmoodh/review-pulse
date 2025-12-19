import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Restaurant, RestaurantAuth, MetaIntegration, Subscription } from "../models";
import { hashPassword, comparePassword } from "../utils/password";
import { generateRestaurantId, generateQRCodeUrl } from "../utils/qr-generator";
import { encrypt } from "../utils/encryption";
import { exchangeForPageToken } from "../utils/meta-auth";
import { signAccessToken, verifyAccessToken, extractTokenFromHeader } from "../utils/jwt";
import { getActiveSubscription } from "../utils/subscription";
import { isPremium } from "../utils/subscription";

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

    const token = signAccessToken({
      restaurantId: restaurant.id,
      email: restaurant.email,
    });

    return res.json({
      success: true,
      token,
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

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated restaurant
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current restaurant
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

    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const restaurant = await restaurantRepo.findOne({ where: { id: payload.restaurantId } });

    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Get active subscription
    const subscription = await getActiveSubscription(restaurant.id);

    return res.json({
      success: true,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        email: restaurant.email,
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
  } catch (error) {
    console.error("Auth me error:", error);
    return res.status(500).json({ error: "Failed to fetch current user" });
  }
});

/**
 * @swagger
 * /api/auth/meta/authorize:
 *   get:
 *     summary: Initiate Meta (Facebook) OAuth authorization
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Restaurant ID
 *     responses:
 *       302:
 *         description: Redirect to Meta OAuth consent screen
 *       400:
 *         description: Bad request
 */
router.get("/meta/authorize", async (req, res) => {
  try {
    const { restaurantId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    // Verify restaurant exists
    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const restaurant = await restaurantRepo.findOne({ where: { id: restaurantId as string } });
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found" });
    }

    // Check premium access
    const hasPremium = await isPremium(restaurantId as string);
    if (!hasPremium) {
      return res.redirect(`/dashboard/settings?meta_error=premium_required`);
    }

    // Build Meta OAuth authorization URL
    const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
    authUrl.searchParams.set("client_id", process.env.META_APP_ID!);
    authUrl.searchParams.set("redirect_uri", process.env.META_REDIRECT_URI!);
    authUrl.searchParams.set("response_type", "code");
    // Required permissions for pages, posts, and reviews
    // Note: For development mode, use basic scopes. For production, request advanced permissions through App Review.
    // Basic scopes that work in development:
    // - public_profile: Basic profile info (always available)
    // - pages_show_list: List user's pages (works for app admins/testers in dev mode)
    // Advanced permissions (require App Review for production):
    // - pages_read_engagement: Read page engagement data
    // - pages_read_user_content: Read page posts and content
    // - instagram_basic: Basic Instagram access
    // - instagram_content_publish: Instagram content publishing
    // 
    // For now, using minimal scopes. Page Access Tokens will have their own permissions.
    // Note: Only request pages_show_list - this is sufficient to list and access pages
    // public_profile is not needed for page access
    const scopes = process.env.META_OAUTH_SCOPES || "pages_show_list";
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("state", restaurantId as string); // Pass restaurant ID in state

    res.redirect(authUrl.toString());
  } catch (error) {
    console.error("Meta OAuth authorization error:", error);
    return res.status(500).json({ error: "Failed to initiate authorization" });
  }
});

/**
 * @swagger
 * /api/auth/meta/callback:
 *   get:
 *     summary: Handle Meta OAuth callback
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Meta
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Restaurant ID passed in state parameter
 *     responses:
 *       302:
 *         description: Redirect to client with success/error status
 */
router.get("/meta/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    const restaurantId = state as string;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    if (!code || !restaurantId) {
      const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
      if (isJsonRequest) {
        return res.status(400).json({ error: "Missing authorization code or restaurant ID" });
      }
      return res.redirect(`${clientUrl}/dashboard/settings?meta_error=missing_params`);
    }

    // 1. Exchange authorization code for short-lived user access token
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", process.env.META_APP_ID!);
    tokenUrl.searchParams.set("client_secret", process.env.META_APP_SECRET!);
    tokenUrl.searchParams.set("redirect_uri", process.env.META_REDIRECT_URI!);
    tokenUrl.searchParams.set("code", code as string);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
      if (isJsonRequest) {
        return res.status(400).json({ error: "Failed to get access token from Meta" });
      }
      return res.redirect(`${clientUrl}/dashboard/settings?meta_error=token_exchange_failed`);
    }

    // 2. Get user's pages to let them select which page to connect
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${tokens.access_token}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
      if (isJsonRequest) {
        return res.status(400).json({ error: "No Facebook pages found. Please create a page first." });
      }
      return res.redirect(`${clientUrl}/dashboard/settings?meta_error=no_pages`);
    }

    // For now, use the first page (in production, you might want to let user select)
    const selectedPage = pagesData.data[0];
    const pageId = selectedPage.id;

    // 3. Exchange user token for long-lived page token
    const { accessToken: pageAccessToken, expiresIn } = await exchangeForPageToken(
      tokens.access_token,
      pageId
    );

    // 4. Get Instagram Business Account ID if available
    let instagramBusinessAccountId: string | undefined;
    try {
      const instagramResponse = await fetch(
        `https://graph.facebook.com/v21.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
      );
      const instagramData = await instagramResponse.json();
      if (instagramData.instagram_business_account?.id) {
        instagramBusinessAccountId = instagramData.instagram_business_account.id;
      }
    } catch (error) {
      console.warn("Could not fetch Instagram Business Account:", error);
      // Continue without Instagram - it's optional
    }

    // 5. Encrypt tokens before storing
    const encryptedAccessToken = encrypt(pageAccessToken);
    const encryptedUserAccessToken = encrypt(tokens.access_token);

    // 6. Calculate token expiry
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + expiresIn);

    // 7. Save or update integration
    const integrationRepo = AppDataSource.getRepository(MetaIntegration);

    await integrationRepo.upsert(
      {
        restaurantId,
        pageId,
        instagramBusinessAccountId,
        accessToken: encryptedAccessToken,
        userAccessToken: encryptedUserAccessToken,
        tokenExpiry,
        status: "active",
      },
      ["restaurantId"]
    );

    // 8. Return success
    const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
    if (isJsonRequest) {
      return res.json({
        success: true,
        message: "Meta account connected successfully",
        restaurantId,
        pageId,
        instagramBusinessAccountId,
      });
    }
    
    res.redirect(`${clientUrl}/dashboard/settings?meta_connected=true`);
  } catch (error) {
    console.error("Meta OAuth callback error:", error);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
    
    if (isJsonRequest) {
      return res.status(500).json({
        error: "Failed to connect Meta account",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
    
    res.redirect(`${clientUrl}/dashboard/settings?meta_error=unknown`);
  }
});

export default router;

