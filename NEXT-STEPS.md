# Crumbless — what's done and what's next

_Last updated: 2026-07-09_

This is the working site (`index.html`, mirrored to `public/landing.html`, served live
on GitHub Pages at crumbless.org). The Next.js app in `app/`/`lib/` is a backup.

## 🚨 DO THESE 2 THINGS to finish the security hardening

The site code is already deployed and safe — it uses the new server functions if they
exist and falls back to the old path if not, so nothing is broken right now. To close
the security holes for real:

1. **Run `supabase/security.sql`** in Supabase → SQL Editor. This makes role and
   "verified" hours server-authoritative (a driver can no longer self-grant hours
   or make themselves admin), and fixes the `hours_entries` view that currently leaks
   to anyone with the public key. Safe to re-run. (Requires Postgres 15+, which your
   project is.) Drivers are **auto-approved** — the in-browser AI license scan is the
   gate; there is no manual approval queue.
2. **Set the `licenses` Storage bucket to Private** (Storage → licenses → make sure it
   is not Public). This holds minors' license photos.

Tell me once #1 is done and I'll verify the hardened claim/deliver/approve flows
end-to-end against your database.

## ✅ Done

- **Core food-rescue loop wired to Supabase** — when a user is logged in, posting,
  claiming, picking up, delivering, per-account service hours, and the hours export
  all run against the real database (`dropoff_sites` / `profiles` / `pickups` /
  `hours_entries`). Logged-out visitors still get the in-memory marketing demo.
  Verified end-to-end: post → claim → deliver → hours 0→1.5 → export unlocks →
  dashboard reflects real hours.
- **Schema live & validated** — `supabase/schema.sql` has been run; signup trigger
  auto-creates profiles, RLS is enforced.
- **Demo integrated into the dashboard** — each account is seeded with ≥2 demo
  deliveries; dashboard shows a "Your deliveries" list + export (file named per account).
- **Security hardening (client side, deployed)** — role now read from the `profiles`
  table, not editable metadata; claim/pickup/deliver go through server RPCs (deliver
  requires a shelter code); license upload surfaces real errors; demo vs saved-account
  is now explained. The matching `supabase/security.sql` is waiting for you to run.
- **Leaderboards removed for now** (2026-07-09). The `leaderboard()` SQL function is
  still in the database and `schema.sql`, so re-enabling is just re-adding the UI.
- **Manual driver approvals removed** (2026-07-09) — approval is automatic; the
  in-browser AI license scan is the gate.
- **Dashboard profile editing** (syncs to the profiles table), legal pages
  (Terms/Privacy), SEO/social meta + favicon, accessibility skip link, real Google
  Map with fullscreen.

## 🔧 Still needs you (after the 2 steps above)

### Known follow-ups
- `hours_entries.delivered_at` uses the pickup's `created_at` (no separate delivered
  timestamp yet).
- The `seed_demo_deliveries()` function grants demo hours without a real delivery —
  it's a demo affordance; remove it before a real public launch.
- Delete the `qa-selftest…@crumbless.org` test user (Supabase → Authentication).

### Driver vetting (if you ever want it stronger than the AI scan)
Approval is currently automatic via the in-browser AI license scan, which is a
screening layer, not fraud-proof — a determined user can bypass a browser-side check.
The thing that actually protects "verified hours" is the shelter code in
`deliver_pickup`, which is server-enforced. If you later want real vetting or to review
driver **license images**, that needs server-side access (Supabase service role),
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
