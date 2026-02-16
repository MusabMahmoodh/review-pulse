import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/lib/server/auth";
import { isPremium } from "@/lib/server/subscription";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().optional(),
});

function premiumRequiredResponse() {
  return NextResponse.json(
    {
      error: "Premium subscription required",
      requiresPremium: true,
    },
    { status: 403 }
  );
}

export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const hasPremium = await isPremium(authContext.restaurant.id);
    if (!hasPremium) {
      return premiumRequiredResponse();
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("team_members")
      .select("id,restaurantId,name,email,phone,role,createdAt,updatedAt")
      .eq("restaurantId", authContext.restaurant.id)
      .order("createdAt", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
    }

    return NextResponse.json({ members: data || [] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch team members" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const hasPremium = await isPremium(authContext.restaurant.id);
    if (!hasPremium) {
      return premiumRequiredResponse();
    }

    const json = await request.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Restaurant ID and name are required" }, { status: 400 });
    }

    const { name, email, phone, role } = parsed.data;
    const memberId = `member_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("team_members")
      .insert({
        id: memberId,
        restaurantId: authContext.restaurant.id,
        name,
        email: email || null,
        phone: phone || null,
        role: role || null,
      })
      .select("id,restaurantId,name,email,phone,role,createdAt,updatedAt")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        member: data,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
  }
}
