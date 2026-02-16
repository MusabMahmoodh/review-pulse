import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/server/auth";
import { isPremium } from "@/lib/server/subscription";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { chatAboutFeedbackStream } from "@/lib/server/ai";

function jsonLine(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export async function POST(request: NextRequest) {
  try {
    const authContext = await getAuthContext(request);
    if (!authContext) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }

    const hasPremium = await isPremium(authContext.restaurant.id);
    if (!hasPremium) {
      return NextResponse.json(
        {
          error: "Premium subscription required",
          requiresPremium: true,
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const supabaseAdmin = getSupabaseAdminClient();
    const [restaurantResult, feedbackResult, reviewResult] = await Promise.all([
      supabaseAdmin.from("restaurants").select("id,name").eq("id", authContext.restaurant.id).limit(1),
      supabaseAdmin
        .from("customer_feedback")
        .select("foodRating,staffRating,ambienceRating,overallRating,suggestions,createdAt")
        .eq("restaurantId", authContext.restaurant.id)
        .gte("createdAt", thirtyDaysAgo.toISOString())
        .order("createdAt", { ascending: false }),
      supabaseAdmin
        .from("external_reviews")
        .select("platform,rating,comment,reviewDate")
        .eq("restaurantId", authContext.restaurant.id)
        .gte("reviewDate", thirtyDaysAgo.toISOString())
        .order("reviewDate", { ascending: false }),
    ]);

    if (restaurantResult.error || feedbackResult.error || reviewResult.error) {
      return NextResponse.json({ error: "Failed to process chat message" }, { status: 500 });
    }

    const restaurant = restaurantResult.data?.[0];
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        try {
          const aiStream = chatAboutFeedbackStream(
            message,
            feedbackResult.data || [],
            reviewResult.data || [],
            restaurant.name
          );

          for await (const chunk of aiStream) {
            controller.enqueue(jsonLine({ content: chunk }));
          }

          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error: any) {
          controller.enqueue(jsonLine({ error: error?.message || "Failed to process chat message with AI" }));
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process chat message" },
      { status: 500 }
    );
  }
}
