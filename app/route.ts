import { readFile } from "fs/promises";
import { join } from "path";

// Serve the self-contained standalone landing page (public/landing.html) at "/".
// It ships its own <html>/<head>/<style>/<script>, so it bypasses the React
// layout entirely. The working core-loop app still lives at /app.
export const dynamic = "force-dynamic";

export async function GET() {
  const html = await readFile(join(process.cwd(), "public", "landing.html"), "utf8");
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
