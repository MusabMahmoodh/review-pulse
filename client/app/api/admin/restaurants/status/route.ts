import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const statusSchema = z.object({
  restaurantId: z.string().min(1),
  status: z.enum(["active", "blocked"]),
});

export async function PATCH(request: NextRequest) {
  try {
    const parsed = statusSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Restaurant ID and status required" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.restaurantId)
      .select("id,name,email,phone,address,status,createdAt,updatedAt")
      .single();

    if (error) {
      return NextResponse.json({ error: "Failed to update restaurant status" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, restaurant: data });
  } catch {
    return NextResponse.json({ error: "Failed to update restaurant status" }, { status: 500 });
  }
}
