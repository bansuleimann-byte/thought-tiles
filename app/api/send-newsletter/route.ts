import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const ADMIN_EMAIL = "bansuleimann@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const { thoughtId, title, content, date, accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Verify the request comes from the admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // Fetch all subscribers using admin's authenticated client
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    const { data: subscribers, error: subError } = await adminSupabase
      .from("subscribers")
      .select("email");

    if (subError) {
      console.error("fetch subscribers error:", subError);
      return NextResponse.json({ error: "Failed to fetch subscribers." }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ count: 0, message: "No subscribers yet." });
    }

    // Determine site URL — prefer explicit env var, then Vercel production URL, then deployment URL
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    const thoughtUrl = `${origin}/thought/${thoughtId}`;
    const snippet = content
      ? content.slice(0, 220) + (content.length > 220 ? "…" : "")
      : "";

    const resend = new Resend(process.env.RESEND_API_KEY!);

    // Send one email per subscriber in batches of 50
    const emails = subscribers.map((s: { email: string }) => s.email);
    const BATCH = 50;
    let sentCount = 0;

    for (let i = 0; i < emails.length; i += BATCH) {
      const batch = emails.slice(i, i + BATCH).map((to: string) => ({
        from: "thought tiles <updates@mythoughttiles.com>",
        to: [to],
        subject: `new thought — ${title}`,
        html: buildEmail({ title, date, snippet, thoughtUrl }),
      }));

      const { error: sendError } = await resend.batch.send(batch);
      if (sendError) {
        console.error("resend batch error:", sendError);
        return NextResponse.json({ error: (sendError as { message?: string }).message ?? JSON.stringify(sendError) }, { status: 500 });
      }
      sentCount += batch.length;
    }

    return NextResponse.json({ count: sentCount });
  } catch (e) {
    console.error("send-newsletter route error:", e);
    const msg = e instanceof Error ? e.message : JSON.stringify(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function buildEmail({
  title,
  date,
  snippet,
  thoughtUrl,
}: {
  title: string;
  date: string;
  snippet: string;
  thoughtUrl: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#fbf7ef;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fbf7ef;padding:48px 24px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

          <tr>
            <td style="padding-bottom:28px;">
              <p style="margin:0;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#aaa;font-family:'Courier New',Courier,monospace;">thought tiles</p>
            </td>
          </tr>

          <tr>
            <td style="border-top:1px solid rgba(0,0,0,0.1);padding-top:28px;">
              ${date ? `<p style="margin:0 0 8px 0;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#999;">${date}</p>` : ""}
              <h1 style="margin:0 0 18px 0;font-size:17px;font-weight:400;letter-spacing:0.03em;color:#111;font-family:'Courier New',Courier,monospace;">${title}</h1>
              ${snippet ? `<p style="margin:0 0 28px 0;font-size:13px;line-height:1.75;color:#555;font-family:'Courier New',Courier,monospace;">${snippet}</p>` : ""}
              <a href="${thoughtUrl}" style="display:inline-block;border:1px solid rgba(0,0,0,0.2);padding:9px 20px;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#111;text-decoration:none;font-family:'Courier New',Courier,monospace;">read thought →</a>
            </td>
          </tr>

          <tr>
            <td style="padding-top:40px;">
              <p style="margin:0;font-size:10px;color:#bbb;font-family:'Courier New',Courier,monospace;">to unsubscribe, reply with "unsubscribe"</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
