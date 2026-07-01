# Crumbless — what's done and what's next

_Last updated: 2026-06-30_

This is the working site (`index.html`, mirrored to `public/landing.html`, served live
on GitHub Pages at crumbless.org). The Next.js app in `app/`/`lib/` is a backup.

## ✅ Done in this pass (no action needed from you)

- **SEO & social sharing** — page description, Open Graph + Twitter card tags,
  canonical URL, theme color, and a brand favicon (inline SVG, no file needed).
- **Terms of Service & Privacy Policy** — real, plain-English drafts in a modal,
  linked from the footer and the login screen. _Have a lawyer review before you
  rely on them legally_ — they're a solid starting point, not legal advice.
- **Accessibility** — a "Skip to main content" link for keyboard users, and the
  legal modal closes with Esc / click-outside like the other dialogs.
- **`supabase/schema.sql`** — the database schema for the food-rescue loop, ready
  to run (see below).

## 🔧 Needs you (can't be done without your accounts/decisions)

### 1. Turn the demo loop into a real, shared app — the big one
The post → claim → pick up → deliver → hours flow is still a per-browser demo.
To make it real:
1. In Supabase → **SQL Editor**, paste and run **`supabase/schema.sql`**.
2. Fill in the queries in `lib/data/supabase.ts` (the stub matches `lib/data/types.ts`),
   or tell me to wire the standalone `index.html` directly to these tables — then I
   can finish the client code and test it against your project.
3. Once real per-account hours exist, flip `EXPORT_UNLOCKED = true` in `index.html`
   to re-enable the service-hours export, and point the leaderboards at real data.

### 2. Admin approval dashboard
Reviewing driver license uploads needs server-side access (Supabase service role),
so it can't be safely done in the public page. Decide: keep auto-approve, or add a
review step. If you want it, this is a small backend (Supabase Edge Function) build.

### 3. Real partners & content
- Replace "To Be Determined Food Banks" with real shelters/food banks you've signed.
- Add real social links (Instagram/TikTok/X are placeholders in the footer).

### 4. Notifications
Email/text when a pickup is posted or claimed. Needs an email/SMS provider
(e.g. Resend, Twilio) + a small backend. Tell me which provider and I'll wire it.

### 5. Map upgrades (optional)
The map is now a real Google Map (keyless embed). Showing **pins for live drivers
and pickups** requires the paid Google Maps JavaScript API (API key + billing) plus
real location data from step 1.

### 6. Photos & real addresses
Proof-of-delivery photo capture and real pickup/drop-off geocoding — both build on
step 1's tables and storage.

---

**Suggested order:** do **#1** first. Everything valuable (real hours, leaderboards,
export, admin review, map pins) depends on the core loop persisting to Supabase.
