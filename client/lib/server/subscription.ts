import { getSupabaseAdminClient } from "@/lib/supabase/server";

export type ActiveSubscription = {
  id: string;
  plan: "free" | "basic" | "premium" | "enterprise";
  status: "active" | "cancelled" | "expired" | "trial";
  startDate: string;
  endDate: string | null;
  monthlyPrice: number;
};

export async function getActiveSubscription(restaurantId: string): Promise<ActiveSubscription | null> {
  const supabaseAdmin = getSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("id,plan,status,startDate,endDate,monthlyPrice")
    .eq("restaurantId", restaurantId)
    .eq("status", "active")
    .order("startDate", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  const subscription = data[0] as ActiveSubscription;
  if (subscription.endDate && new Date(subscription.endDate) <= new Date()) {
    return null;
  }

  return subscription;
}

export async function isPremium(restaurantId: string): Promise<boolean> {
  const subscription = await getActiveSubscription(restaurantId);
  if (!subscription) {
    return false;
  }
  return subscription.plan === "premium" || subscription.plan === "enterprise";
}
