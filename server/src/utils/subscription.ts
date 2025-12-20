import { AppDataSource } from "../data-source";
import { Subscription } from "../models/Subscription";
import { Teacher } from "../models/Teacher";

/**
 * Check if a teacher or organization has an active premium subscription
 * Premium plans include: "premium" and "enterprise"
 * For teachers, also checks organization subscription if teacher belongs to an organization
 */
export async function isPremium(id: string, userType: "teacher" | "organization" = "teacher"): Promise<boolean> {
  const subscriptionRepo = AppDataSource.getRepository(Subscription);
  
  // Use query builder for more explicit control
  const queryBuilder = subscriptionRepo
    .createQueryBuilder("subscription")
    .where("subscription.status = :status", { status: "active" })
    .andWhere("subscription.plan IN (:...plans)", { plans: ["premium", "enterprise"] });

  if (userType === "organization") {
    queryBuilder.andWhere("subscription.organizationId = :id", { id });
  } else {
    // For teachers, first check teacher's own subscription
    queryBuilder.andWhere("subscription.teacherId = :id", { id });
  }

  queryBuilder.orderBy("subscription.startDate", "DESC");
  
  let subscription = await queryBuilder.getOne();

  // If no teacher subscription found and user is a teacher, check organization subscription
  if (!subscription && userType === "teacher") {
    const teacherRepo = AppDataSource.getRepository(Teacher);
    const teacher = await teacherRepo.findOne({ where: { id } });
    
    if (teacher && teacher.organizationId) {
      // Check organization subscription
      const orgQueryBuilder = subscriptionRepo
        .createQueryBuilder("subscription")
        .where("subscription.status = :status", { status: "active" })
        .andWhere("subscription.plan IN (:...plans)", { plans: ["premium", "enterprise"] })
        .andWhere("subscription.organizationId = :orgId", { orgId: teacher.organizationId })
        .orderBy("subscription.startDate", "DESC");
      
      subscription = await orgQueryBuilder.getOne();
      
      if (subscription) {
        console.log(`[isPremium] Teacher ${id} has premium via organization ${teacher.organizationId}`);
      }
    }
  }

  if (!subscription) {
    console.log(`[isPremium] No premium subscription found for ${userType} ${id}`);
    return false;
  }

  // Check if subscription is still valid
  if (subscription.endDate) {
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const isValid = now < endDate;
    console.log(`[isPremium] Subscription found for ${userType} ${id}:`, {
      id: subscription.id,
      plan: subscription.plan,
      status: subscription.status,
      endDate: subscription.endDate,
      now: now.toISOString(),
      isValid,
      teacherId: subscription.teacherId,
      organizationId: subscription.organizationId,
    });
    return isValid;
  }
  // No endDate means forever
  console.log(`[isPremium] Subscription found (no endDate) for ${userType} ${id}:`, {
    id: subscription.id,
    plan: subscription.plan,
    status: subscription.status,
    teacherId: subscription.teacherId,
    organizationId: subscription.organizationId,
  });
  return true;
}

/**
 * Get the active subscription for a teacher or organization
 */
export async function getActiveSubscription(id: string, userType: "teacher" | "organization" = "teacher"): Promise<Subscription | null> {
  const subscriptionRepo = AppDataSource.getRepository(Subscription);
  
  const whereClause: any = {
    status: "active",
  };

  if (userType === "organization") {
    whereClause.organizationId = id;
  } else {
    whereClause.teacherId = id;
  }
  
  const subscription = await subscriptionRepo.findOne({
    where: whereClause,
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

