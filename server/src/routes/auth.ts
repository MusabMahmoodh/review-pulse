import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Restaurant, RestaurantAuth, GoogleIntegration } from "../models";
import { hashPassword, comparePassword } from "../utils/password";
import { generateRestaurantId, generateQRCodeUrl } from "../utils/qr-generator";
import { encrypt } from "../utils/encryption";

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

/**
 * @swagger
 * /api/auth/google/authorize:
 *   get:
 *     summary: Initiate Google OAuth authorization
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
 *         description: Redirect to Google OAuth consent screen
 *       400:
 *         description: Bad request
 */
router.get("/google/authorize", async (req, res) => {
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

    // Build Google OAuth authorization URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
    authUrl.searchParams.set("redirect_uri", process.env.GOOGLE_REDIRECT_URI!);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/business.manage");
    authUrl.searchParams.set("access_type", "offline"); // Required for refresh token
    authUrl.searchParams.set("prompt", "consent"); // Force consent to get refresh token
    authUrl.searchParams.set("state", restaurantId as string); // Pass restaurant ID in state

    res.redirect(authUrl.toString());
  } catch (error) {
    console.error("Google OAuth authorization error:", error);
    return res.status(500).json({ error: "Failed to initiate authorization" });
  }
});

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Restaurant ID passed in state parameter
 *     responses:
 *       302:
 *         description: Redirect to client with success/error status
 */
router.get("/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    const restaurantId = state as string;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";

    if (!code || !restaurantId) {
      // If this is an API call (from Next.js), return JSON, otherwise redirect
      if (req.headers["content-type"]?.includes("application/json") || req.query.format === "json") {
        return res.status(400).json({ error: "Missing authorization code or restaurant ID" });
      }
      return res.redirect(`${clientUrl}/dashboard/settings?google_error=missing_params`);
    }

    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token || !tokens.refresh_token) {
      console.error("Failed to obtain tokens:", tokens);
      const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
      if (isJsonRequest) {
        return res.status(400).json({ error: "Failed to obtain tokens from Google" });
      }
      return res.redirect(`${clientUrl}/dashboard/settings?google_error=token_failed`);
    }

    // 2. Get user's business account info using Business Information API
    // This is the correct API for Google Business Profile (formerly Google My Business)
    let accountName: string | null = null;
    let locations: any[] = [];

    // Step 1: List accounts using Account Management API
    // Note: Account management uses a different service than Business Information
    const accountResponse = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      
      console.error("Failed to fetch accounts:", accountResponse.status, errorText);
      
      // Handle quota exceeded error (429)
      if (accountResponse.status === 429) {
        const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
        if (isJsonRequest) {
          return res.status(429).json({ 
            error: "API quota exceeded",
            message: "Your Google Business Profile API quota limit is 0. This usually means your API access request is still pending approval, or the quota hasn't been allocated yet.",
            details: errorData.error?.message || "Quota limit: 0 requests per minute",
            help: "Please request API access and quota increase at: https://cloud.google.com/docs/quotas/help/request_increase"
          });
        }
        return res.redirect(`${clientUrl}/dashboard/settings?google_error=quota_exceeded`);
      }
      
      const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
      if (isJsonRequest) {
        return res.status(400).json({ 
          error: "Failed to fetch Google Business Profile accounts",
          details: errorData.error?.message || "Make sure 'My Business Account Management API' and 'My Business Business Information API' are enabled in Google Cloud Console",
          status: accountResponse.status
        });
      }
      return res.redirect(`${clientUrl}/dashboard/settings?google_error=account_failed`);
    }

    const accountsData = await accountResponse.json();
    // API returns accounts in accounts array
    const accounts = accountsData.accounts || [];
    
    if (accounts.length === 0) {
      const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
      if (isJsonRequest) {
        return res.status(400).json({ 
          error: "No Google Business Profile account found",
          hint: "Please ensure you have a Google Business Profile set up for your account"
        });
      }
      return res.redirect(`${clientUrl}/dashboard/settings?google_error=no_account`);
    }

    // Use the first account (most users have one account)
    accountName = accounts[0].name; // Format: "accounts/123456789"

    // Step 2: List locations for this account
    const locationsResponse = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`,
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!locationsResponse.ok) {
      const errorText = await locationsResponse.text();
      console.error("Failed to fetch locations:", locationsResponse.status, errorText);
      const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
      if (isJsonRequest) {
        return res.status(400).json({ 
          error: "Failed to fetch business locations",
          details: errorText.substring(0, 200)
        });
      }
      return res.redirect(`${clientUrl}/dashboard/settings?google_error=location_failed`);
    }

    const locationsData = await locationsResponse.json();
    locations = locationsData.locations || [];

    // If we still don't have locations, return error
    if (locations.length === 0) {
      const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
      if (isJsonRequest) {
        return res.status(400).json({ 
          error: "Unable to find Google Business Profile account or locations. Please ensure you have a Google Business Profile set up and the Business Profile API is enabled in your Google Cloud project.",
          hint: "Make sure the 'Google Business Profile API' (formerly My Business API) is enabled in Google Cloud Console"
        });
      }
      return res.redirect(`${clientUrl}/dashboard/settings?google_error=no_account`);
    }

    // Use the first location we found
    const location = locations[0];

    if (!location) {
      const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
      if (isJsonRequest) {
        return res.status(400).json({ error: "No business location found. Please ensure your Google Business Profile has at least one location." });
      }
      return res.redirect(`${clientUrl}/dashboard/settings?google_error=no_location`);
    }

    // Location name should be in format "accounts/{accountId}/locations/{locationId}" or "locations/{locationId}"
    const locationName = location.name || location.locationName;
    
    if (!locationName) {
      const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
      if (isJsonRequest) {
        return res.status(400).json({ error: "Invalid location format returned from Google API" });
      }
      return res.redirect(`${clientUrl}/dashboard/settings?google_error=invalid_location`);
    }

    // Ensure we have accountName - extract from location if needed
    if (!accountName && locationName.includes("/")) {
      const parts = locationName.split("/");
      const accountIndex = parts.indexOf("accounts");
      if (accountIndex !== -1 && parts[accountIndex + 1]) {
        accountName = `accounts/${parts[accountIndex + 1]}`;
      }
    }

    // 4. Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = encrypt(tokens.refresh_token);

    // 5. Calculate token expiry
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + (tokens.expires_in || 3600));

    // 6. Save or update integration
    const integrationRepo = AppDataSource.getRepository(GoogleIntegration);

    // Ensure we have both accountName and locationName
    if (!accountName) {
      const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
      if (isJsonRequest) {
        return res.status(400).json({ error: "Unable to determine Google account ID from location" });
      }
      return res.redirect(`${clientUrl}/dashboard/settings?google_error=invalid_account`);
    }

    await integrationRepo.upsert(
      {
        restaurantId,
        googleAccountId: accountName,
        locationId: locationName,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiry,
        status: "active",
      },
      ["restaurantId"]
    );

    // 7. Return success (JSON if API call, redirect if direct browser call)
    const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
    if (isJsonRequest) {
      return res.json({
        success: true,
        message: "Google account connected successfully",
        restaurantId,
      });
    }
    
    res.redirect(`${clientUrl}/dashboard/settings?google_connected=true`);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const isJsonRequest = req.headers["content-type"]?.includes("application/json") || req.query.format === "json";
    
    if (isJsonRequest) {
      return res.status(500).json({
        error: "Failed to connect Google account",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
    
    res.redirect(`${clientUrl}/dashboard/settings?google_error=unknown`);
  }
});

export default router;

