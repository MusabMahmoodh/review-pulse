import { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

type RestaurantRecord = {
  id: string;
  name: string;
  email: string;
};

type AuthContext = {
  token: string;
  userId: string;
  email: string;
  restaurant: RestaurantRecord;
};

export function extractBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  return authorization.slice(7).trim() || null;
}

export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const token = extractBearerToken(request);
  if (!token) {
    return null;
  }

  const supabaseAdmin = getSupabaseAdminClient();
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);

  if (userError || !userData.user) {
    return null;
  }

  const user = userData.user;
  const email = user.email;
  if (!email) {
    return null;
  }

  const metadataRestaurantId =
    typeof user.user_metadata?.restaurantId === "string" ? user.user_metadata.restaurantId : null;

  let query = supabaseAdmin.from("restaurants").select("id,name,email").limit(1);
  if (metadataRestaurantId) {
    query = query.eq("id", metadataRestaurantId);
  } else {
    query = query.eq("email", email);
  }

  const { data: restaurantRows, error: restaurantError } = await query;
  const restaurant = restaurantRows?.[0];

  if (restaurantError || !restaurant) {
    return null;
  }

  return {
    token,
    userId: user.id,
    email,
    restaurant,
  };
}
