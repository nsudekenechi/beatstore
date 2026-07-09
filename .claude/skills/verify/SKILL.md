---
name: verify
description: How to build, run, and drive alabahmusic-next for runtime verification of admin dashboard pages and /api/admin routes.
---

# Verifying alabahmusic-next

## Run

- `npm run dev` — check first whether a dev server is already on port 3000 (the owner often has one running; it hot-reloads, just use it).
- `.env.local` at repo root has MONGODB_URI, JWT_SECRET, CLOUDINARY_* — the dev server picks it up automatically.
- **The dev DB and Cloudinary account are live/shared with the owner.** Name test records obviously (e.g. "verify test beat") and delete them when done.

## Auth

- `/api/admin/*` is gated by `src/middleware.ts` (Bearer JWT verified against `JWT_SECRET`).
- Mint a token locally (run from repo root so `jsonwebtoken` resolves):
  ```js
  const env = Object.fromEntries(fs.readFileSync('.env.local','utf8').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>[l.slice(0,l.indexOf('=')), l.slice(l.indexOf('=')+1).trim()]));
  require('jsonwebtoken').sign({ userId: 'verify-agent' }, env.JWT_SECRET)
  ```
- The dashboard UI reads `sessionStorage.admin_token` (`src/app/admin/dashboard/layout.tsx` redirects to `/admin` without it). Set it via page.evaluate before navigating.

## Drive the UI

- `npm i playwright-core` in a scratch dir; `chromium.launch({ channel: "chrome" })` uses system Chrome — no browser download needed.
- Flow: goto `/admin` → set sessionStorage token → goto `/admin/dashboard/<page>`.
- Custom dropdowns/listboxes stay in the DOM with `opacity-0` when closed — Playwright counts them "visible", so scope locators to the container you opened (or use the keyboard: focus input, ArrowDown/Enter).

## API probes

- The beat API is JSON-only: files upload directly browser → Cloudinary via signed params from `POST /api/admin/upload` (`{ access: "public" | "gated" }`), then `POST /api/admin/beat` receives metadata `{ name, bpm, key, genre[], tags[], isAvailable, files: { image|mp3|wav|trackout: { publicId, resourceType, version, signature } } }`. `version`+`signature` come from Cloudinary's upload response and are verified server-side — you can't fabricate file metadata; do a real upload first.
- Seeding beats from a script: request a signature from `/api/admin/upload`, POST the file to `https://api.cloudinary.com/v1_1/<cloud>/<resourceType>/upload`, then POST the beat JSON. Tiny valid PNG/MP3/WAV/ZIP generated in the scratchpad work with Cloudinary.
- Cloudinary uploads: image → `image/upload`, audio → `video/authenticated`, zip → `raw/authenticated`. Cleanup must pass matching `resource_type` + `type` to `destroy` or it silently reports "not found".
- `DELETE /api/admin/upload` with `{ publicId, resourceType }` removes an orphaned `beats/` asset.

## Gotchas

- Legacy beat records may lack `genre`/`tags`/`isAvailable` fields.
- The form cleans up its own unused uploads (cancel/replace/failed submit) via `DELETE /api/admin/upload`; if you kill a script mid-flow, check `beats/` for strays.
