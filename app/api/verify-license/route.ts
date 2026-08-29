// Server-side driver's-licence check using Claude vision.
// A much stronger gate than the in-browser OCR: it looks at the actual image
// and judges whether it's a plausible real, unexpired licence — catching
// templates, watermarked downloads, celebrity/stock photos, and placeholders.
//
// Runs only on a server (Vercel). It fails OPEN — if ANTHROPIC_API_KEY isn't set,
// or the call errors, it returns without blocking, and the browser OCR still applies.
// Set ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables.
//
// NOT identity verification: it can't confirm the licence is really the user's,
// or that it's a genuine government record. For that, use a KYC provider.
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) return json({ configured: false });

    const { imageBase64, mediaType } = await req.json().catch(() => ({} as Record<string, unknown>));
    if (!imageBase64 || typeof imageBase64 !== "string") return json({ configured: true, ok: false, reason: "no image" });
    if (imageBase64.length > 9_000_000) return json({ configured: true, ok: false, reason: "image too large" });
    const media = /^image\/(png|jpe?g|webp|gif)$/.test((mediaType as string) || "") ? (mediaType as string) : "image/jpeg";

    const client = new Anthropic();
    const msg = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      output_config: { effort: "low" },
      system:
        "You verify photos of US driver's licenses for a food-rescue app that vets student drivers. " +
        "Judge only what is visible. Fail the licence if it is a blank template, sample, specimen or novelty ID; " +
        "is watermarked with a website; uses placeholder data (John/Jane Doe, all-zero or obviously repeated numbers); " +
        "is a photo of a celebrity or a stock/model image; is clearly expired; or is not actually a driver's licence. " +
        "Be strict about fakes but fair to real, ordinary licences.\n\n" +
        "Reply with ONLY a JSON object (no prose, no code fence) of exactly this shape: " +
        '{"is_real_license":boolean,"is_template_or_sample":boolean,"is_expired":boolean,' +
        '"looks_like_celebrity_or_stock_photo":boolean,"confidence":number,"reason":string}',
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: media as "image/jpeg", data: imageBase64 } },
            { type: "text", text: "Assess this image and return the JSON verdict." },
          ],
        },
      ],
    });

    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    let v: Record<string, unknown> | null = null;
    try {
      v = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    } catch {
      v = null;
    }
    if (!v) return json({ configured: true, error: true, reason: "could not read verdict" });

    const conf = typeof v.confidence === "number" ? (v.confidence as number) : 1;
    const ok =
      !!v.is_real_license &&
      !v.is_template_or_sample &&
      !v.is_expired &&
      !v.looks_like_celebrity_or_stock_photo &&
      conf >= 0.5;
    return json({
      configured: true,
      ok,
      isTemplate: !!v.is_template_or_sample,
      isExpired: !!v.is_expired,
      confidence: conf,
      reason: typeof v.reason === "string" ? v.reason : "",
    });
  } catch (e) {
    // fail open — never block signup on an API/outage error; browser OCR still applies
    return json({ configured: true, error: true, reason: (e as Error)?.message || "error" });
  }
}
