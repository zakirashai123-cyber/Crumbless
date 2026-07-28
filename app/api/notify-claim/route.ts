// Emails the business when a driver claims their pickup.
// Runs only on a server (Vercel), never on GitHub Pages. It no-ops safely
// until you set these env vars in Vercel → Project → Settings → Environment:
//   SUPABASE_URL               e.g. https://<ref>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY  (Supabase → Settings → API → service_role)
//   RESEND_API_KEY             (resend.com — free tier is fine)
// The client calls this fire-and-forget after a successful claim; it never
// blocks the claim, and any missing piece just skips the email.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  try {
    const { pickupId } = await req.json().catch(() => ({}));
    if (!pickupId) return json({ sent: false, reason: "missing pickupId" });

    const SUPA_URL = process.env.SUPABASE_URL;
    const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const RESEND = process.env.RESEND_API_KEY;
    if (!SUPA_URL || !SERVICE) return json({ sent: false, reason: "supabase server env not set" });

    const authHeaders = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` };

    const pRes = await fetch(
      `${SUPA_URL}/rest/v1/pickups?id=eq.${encodeURIComponent(pickupId)}&select=business_id,food,student_name,pickup_window`,
      { headers: authHeaders },
    );
    const pk = (await pRes.json())?.[0];
    if (!pk) return json({ sent: false, reason: "pickup not found" });

    const bRes = await fetch(
      `${SUPA_URL}/rest/v1/profiles?id=eq.${pk.business_id}&select=email,name,business_name`,
      { headers: authHeaders },
    );
    const biz = (await bRes.json())?.[0];
    if (!biz?.email) return json({ sent: false, reason: "no business email" });

    if (!RESEND) return json({ sent: false, reason: "RESEND_API_KEY not set — email skipped" });

    const who = pk.student_name || "A student driver";
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Crumbless <hello@crumbless.org>",
        to: biz.email,
        subject: `A driver claimed your pickup: ${pk.food}`,
        text:
          `Good news${biz.business_name ? ", " + biz.business_name : ""}!\n\n` +
          `${who} claimed "${pk.food}" and will arrive during your window (${pk.pickup_window || "soon"}).\n\n` +
          `— Crumbless · crumbless.org`,
      }),
    });
    if (!emailRes.ok) return json({ sent: false, reason: `email provider ${emailRes.status}` });
    return json({ sent: true });
  } catch (e) {
    return json({ sent: false, reason: (e as Error)?.message || "error" });
  }
}
