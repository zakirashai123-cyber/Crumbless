# Crumbless — what's done and what's next

_Last updated: 2026-07-07_

This is the working site (`index.html`, mirrored to `public/landing.html`, served live
on GitHub Pages at crumbless.org). The Next.js app in `app/`/`lib/` is a backup.

## ✅ Done

- **Core food-rescue loop wired to Supabase** — when a user is logged in, posting,
  claiming, picking up, delivering, per-account service hours, and the hours export
  all run against the real database (`dropoff_sites` / `profiles` / `pickups` /
  `hours_entries`). Logged-out visitors still get the in-memory marketing demo.
  Verified end-to-end: post → claim → deliver → hours 0→1.5 → export unlocks →
  dashboard reflects real hours.
- **Schema live & validated** — `supabase/schema.sql` has been run; signup trigger
  auto-creates profiles, RLS is enforced.
- **Dashboard profile editing**, legal pages (Terms/Privacy), SEO/social meta +
  favicon, accessibility skip link, real Google Map with fullscreen.

## 🔧 Needs you (can't be done without your accounts/decisions)

### 1. Real leaderboards
The dashboard leaderboards are empty because RLS only lets a user read their own
hours. A cross-user ranking needs a **public aggregate view or `security definer`
function** in Supabase (safe to add — I can write it). Say the word and I'll add it
to `schema.sql` and wire the leaderboards.

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
and pickups** requires the paid Google Maps JavaScript API (API key + billing).

### 6. Photos & real addresses
Proof-of-delivery photo capture and pickup/drop-off geocoding. Pickups already store
a typed pickup address; photos would use a Supabase Storage bucket like `licenses`.

### 7. Note on hours timestamps
`hours_entries` currently uses the pickup's `created_at` as the delivery date. If you
want the exact delivery time, add a `delivered_at` timestamp column to `pickups` set
when status flips to `delivered`, and point the view at it.

---

**Suggested next:** real leaderboards (#1) — quickest win now that the loop is live —
then admin approval (#2) and notifications (#4).
