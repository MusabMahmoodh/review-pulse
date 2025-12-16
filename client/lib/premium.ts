import type { Subscription } from "./types"

/**
 * Check if a subscription is premium (premium or enterprise plan)
 */
export function isPremiumPlan(subscription?: Subscription | null): boolean {
  if (!subscription) return false
  if (subscription.status !== "active") return false
  if (subscription.plan !== "premium" && subscription.plan !== "enterprise") return false
  
  // Check if subscription is still valid
  if (subscription.endDate) {
    const now = new Date()
    const endDate = new Date(subscription.endDate)
    return now < endDate
  }
  
  // No endDate means forever
  return true
}

/**
 * Check if an error response indicates premium is required
 */
export function isPremiumRequiredError(error: any): boolean {
  return error?.data?.requiresPremium === true || error?.requiresPremium === true
}

