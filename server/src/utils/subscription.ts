import { AppDataSource } from "../data-source";
import { Subscription } from "../models/Subscription";
import { In } from "typeorm";

/**
 * Check if a restaurant has an active premium subscription
 * Premium plans include: "premium" and "enterprise"
 */
export async function isPremium(restaurantId: string): Promise<boolean> {
  const subscriptionRepo = AppDataSource.getRepository(Subscription);
  
  const subscription = await subscriptionRepo.findOne({
    where: {
      restaurantId,
      status: "active",
      plan: In(["premium", "enterprise"]),
    },
    order: { startDate: "DESC" },
  });

  if (!subscription) {
    return false;
  }

  // Check if subscription is still valid
  if (subscription.endDate) {
    return new Date() < new Date(subscription.endDate);
  }
  // No endDate means forever
  return true;
}

/**
 * Get the active subscription for a restaurant
 */
export async function getActiveSubscription(restaurantId: string): Promise<Subscription | null> {
  const subscriptionRepo = AppDataSource.getRepository(Subscription);
  
  const subscription = await subscriptionRepo.findOne({
    where: {
      restaurantId,
      status: "active",
    },
    order: { startDate: "DESC" },
  });

  if (!subscription) {
    return null;
  }

  // Check if subscription is still valid
  if (subscription.endDate) {
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    if (now >= endDate) {
      return null; // Subscription expired
    }
  }

  return subscription;
}

