import "reflect-metadata";
import dotenv from "dotenv";
import { AppDataSource } from "../data-source";
import { Restaurant, RestaurantAuth, CustomerFeedback, ExternalReview, AIInsight } from "../models";
import { hashPassword } from "../utils/password";
import { generateRestaurantId } from "../utils/qr-generator";

dotenv.config();

async function bootstrapData() {
  try {
    console.log("Initializing database connection...");
    await AppDataSource.initialize();

    const restaurantRepo = AppDataSource.getRepository(Restaurant);
    const authRepo = AppDataSource.getRepository(RestaurantAuth);
    const feedbackRepo = AppDataSource.getRepository(CustomerFeedback);
    const reviewRepo = AppDataSource.getRepository(ExternalReview);
    const insightRepo = AppDataSource.getRepository(AIInsight);

    // Check if demo restaurant already exists
    const existingRestaurant = await restaurantRepo.findOne({
      where: { email: "demo@restaurant.com" },
    });

    if (existingRestaurant) {
      console.log("⚠️  Demo restaurant already exists!");
      console.log(`   Restaurant ID: ${existingRestaurant.id}`);
      console.log("   Delete it first if you want to recreate it.");
      await AppDataSource.destroy();
      process.exit(0);
    }

    console.log("Creating demo restaurant...");

    // Create restaurant
    const restaurantId = generateRestaurantId();
    const restaurant = restaurantRepo.create({
      id: restaurantId,
      name: "The Culinary Corner",
      email: "demo@restaurant.com",
      phone: "+1234567890",
      address: "123 Food Street, Flavor Town",
      qrCode: restaurantId,
      socialKeywords: [
        "culinary corner",
        "flavor town restaurant",
        "food street dining",
        "best italian food",
        "authentic pasta",
      ],
      status: "active",
    });

    await restaurantRepo.save(restaurant);
    console.log(`✅ Restaurant created: ${restaurant.name} (${restaurantId})`);

    // Create auth
    const passwordHash = await hashPassword("demo123");
    const auth = authRepo.create({
      restaurantId,
      email: restaurant.email,
      passwordHash,
    });

    await authRepo.save(auth);
    console.log("✅ Authentication credentials created");

    // Create sample feedback
    const feedbackData = [
      {
        id: `feedback_${Date.now()}_1`,
        restaurantId,
        customerName: "John Smith",
        customerContact: "+1234567891",
        foodRating: 5,
        staffRating: 5,
        ambienceRating: 4,
        overallRating: 5,
        suggestions: "Great food! Would love more vegetarian options.",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      },
      {
        id: `feedback_${Date.now()}_2`,
        restaurantId,
        customerName: "Sarah Johnson",
        foodRating: 4,
        staffRating: 5,
        ambienceRating: 5,
        overallRating: 4,
        suggestions: "Amazing service and cozy atmosphere!",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: `feedback_${Date.now()}_3`,
        restaurantId,
        foodRating: 5,
        staffRating: 4,
        ambienceRating: 5,
        overallRating: 5,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        id: `feedback_${Date.now()}_4`,
        restaurantId,
        customerName: "Mike Chen",
        foodRating: 4,
        staffRating: 4,
        ambienceRating: 4,
        overallRating: 4,
        suggestions: "Good experience overall. The dessert menu could use more variety.",
        createdAt: new Date(),
      },
      {
        id: `feedback_${Date.now()}_5`,
        restaurantId,
        customerName: "Emily Rodriguez",
        foodRating: 5,
        staffRating: 5,
        ambienceRating: 5,
        overallRating: 5,
        suggestions: "Perfect evening! The pasta was incredible.",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
      {
        id: `feedback_${Date.now()}_6`,
        restaurantId,
        customerName: "David Lee",
        foodRating: 3,
        staffRating: 4,
        ambienceRating: 4,
        overallRating: 3,
        suggestions: "Food was okay but service was a bit slow.",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    ];

    for (const feedback of feedbackData) {
      const feedbackEntity = feedbackRepo.create(feedback);
      await feedbackRepo.save(feedbackEntity);
    }
    console.log(`✅ Created ${feedbackData.length} feedback entries`);

    // Create external reviews
    const externalReviewsData = [
      {
        id: `ext_${Date.now()}_1`,
        restaurantId,
        platform: "google" as const,
        author: "Emily Rodriguez",
        rating: 5,
        comment: "Best Italian food in town! The pasta is authentic and the staff is wonderful.",
        reviewDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        syncedAt: new Date(),
      },
      {
        id: `ext_${Date.now()}_2`,
        restaurantId,
        platform: "facebook" as const,
        author: "David Lee",
        rating: 4,
        comment: "Great atmosphere and friendly service. Would recommend!",
        reviewDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        syncedAt: new Date(),
      },
      {
        id: `ext_${Date.now()}_3`,
        restaurantId,
        platform: "instagram" as const,
        author: "@foodlover123",
        rating: 5,
        comment: "Amazing food and presentation! 📸✨",
        reviewDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        syncedAt: new Date(),
      },
    ];

    for (const review of externalReviewsData) {
      const reviewEntity = reviewRepo.create(review);
      await reviewRepo.save(reviewEntity);
    }
    console.log(`✅ Created ${externalReviewsData.length} external reviews`);

    // Create AI insight
    const insight = insightRepo.create({
      id: `insight_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      restaurantId,
      summary:
        "Your restaurant is performing exceptionally well with an average rating of 4.5 stars across all platforms. Customers consistently praise your food quality and service, with particular emphasis on authentic flavors and friendly staff.",
      recommendations: [
        "Expand Vegetarian Options - Multiple customers have requested more vegetarian dishes",
        "Diversify Dessert Menu - Current dessert offerings are limited",
        "Maintain Current Ambience Standards - Customers love your cozy atmosphere",
      ],
      sentiment: "positive" as const,
      keyTopics: [
        "Excellent food quality and authentic taste",
        "Outstanding customer service",
        "Cozy and inviting atmosphere",
        "Request for more vegetarian options",
        "Dessert menu expansion needed",
      ],
      generatedAt: new Date(),
    });

    await insightRepo.save(insight);
    console.log("✅ Created AI insight");

    console.log("\n✅ Bootstrap data created successfully!");
    console.log("\nDemo Restaurant Credentials:");
    console.log(`  Email: demo@restaurant.com`);
    console.log(`  Password: demo123`);
    console.log(`  Restaurant ID: ${restaurantId}`);
    console.log(`  QR Code URL: ${process.env.CLIENT_URL || "http://localhost:3000"}/feedback/${restaurantId}`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error bootstrapping data:", error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

bootstrapData();


