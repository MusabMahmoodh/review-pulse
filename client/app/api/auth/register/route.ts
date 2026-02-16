import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const registerSchema = z.object({
  restaurantName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(1),
  address: z.string().min(1),
  socialKeywords: z.array(z.string()).optional(),
});

function generateRestaurantId(): string {
  return `rest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getFeedbackBaseUrl(request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) {
    return configured;
  }
  return new URL(request.url).origin;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const parsed = registerSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
    }

    const { restaurantName, email, password, phone, address, socialKeywords } = parsed.data;
    const supabaseAdmin = getSupabaseAdminClient();

    const { data: existingRows, error: existingError } = await supabaseAdmin
      .from("restaurants")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (existingError) {
      return NextResponse.json(
        { error: "Registration failed", details: existingError.message },
        { status: 500 }
      );
    }

    if (existingRows && existingRows.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const restaurantId = generateRestaurantId();

    const { data: createdUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        restaurantId,
        restaurantName,
      },
    });

    if (createUserError || !createdUserData.user) {
      const createUserMessage = createUserError?.message || "Registration failed";
      const message = createUserMessage.toLowerCase().includes("already")
        ? "Email already registered"
        : "Registration failed";
      const status = message === "Email already registered" ? 400 : 500;
      return NextResponse.json(
        {
          error: message,
          ...(status >= 500 ? { details: createUserMessage } : {}),
        },
        { status }
      );
    }

    const qrCode = restaurantId;
    const socialKeywordsValue = socialKeywords && socialKeywords.length > 0 ? socialKeywords.join(",") : "";

    const { error: insertRestaurantError } = await supabaseAdmin.from("restaurants").insert({
      id: restaurantId,
      name: restaurantName,
      email,
      phone,
      address,
      qrCode,
      socialKeywords: socialKeywordsValue,
      status: "active",
    });

    if (insertRestaurantError) {
      await supabaseAdmin.auth.admin.deleteUser(createdUserData.user.id);
      return NextResponse.json(
        { error: "Registration failed", details: insertRestaurantError.message },
        { status: 500 }
      );
    }

    const qrCodeUrl = `${getFeedbackBaseUrl(request)}/feedback/${restaurantId}`;

    return NextResponse.json(
      {
        success: true,
        restaurantId,
        qrCodeUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = getErrorMessage(error);
    const isConfigError =
      message.includes("NEXT_PUBLIC_SUPABASE_URL") ||
      message.includes("SUPABASE_SERVICE_ROLE_KEY") ||
      message.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    return NextResponse.json(
      {
        error: isConfigError ? "Server configuration error" : "Registration failed",
        details: message,
      },
      { status: 500 }
    );
  }
}
