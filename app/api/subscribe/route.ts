import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase
      .from("subscribers")
      .insert({ email: email.trim().toLowerCase() });

    if (error) {
      // Postgres unique violation code
      if (error.code === "23505") {
        return NextResponse.json({ error: "already_subscribed" }, { status: 409 });
      }
      console.error("subscribe error:", error);
      return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("subscribe route error:", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
