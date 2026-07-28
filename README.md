# Trivia Board

A big-screen, post-it-note style trivia game. Think a whiteboard covered in
sticky notes — click one to reveal the question, tick it off when the room has
answered.

- **Game page (`/`)** — the board itself. Rows are difficulty tiers, columns
  are categories. Every cell is a post-it that flips open into a large
  centered card, with a green "Answered" tick that removes it from the board.
- **Admin page (`/admin`)** — set the number of rows (difficulties) and
  columns (categories), rename them, pick a post-it color per category, and
  fill in each cell's question. Hit **Save** and the board updates.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- [Motion](https://motion.dev/) (formerly Framer Motion) for the post-it
  flip / grow / crumple animations
- Zustand (persisted to `localStorage`) for the in-session "which questions
  have been answered" state
- Supabase (Postgres) as the persistent store — with a `./.data/board.json`
  file fallback for local dev
- Vercel-friendly, everything runs on the free tiers

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000> for the game, <http://localhost:3000/admin> for
setup. With no env vars set:

- `/admin` is open (no login).
- The board is persisted to `./.data/board.json` on the server filesystem.

That's enough to play locally. For production, keep reading.

## Production setup

### 1. Set an admin password

Add to `.env.local` (and to your Vercel project's environment variables):

```
ADMIN_PASSWORD=some-strong-password
```

With this set, `/admin` redirects to `/admin/login` and requires the password.
The login sets an `httpOnly` cookie for 30 days.

### 2. Point at Supabase (recommended)

The local file store works great in dev but does **not** persist on Vercel
(their production filesystem is read-only outside of `/tmp`). Use Supabase's
free tier for real hosting.

1. Create a project at <https://supabase.com>. The free tier gives you 500 MB
   Postgres — more than enough for a trivia board.
2. In the Supabase SQL editor, run:

   ```sql
   create table if not exists boards (
     id text primary key,
     data jsonb not null,
     updated_at timestamptz not null default now()
   );
   ```

3. Grab the following from **Project Settings → API** (or the "Connect →
   API" panel):
   - `Project URL` → `SUPABASE_URL`
   - **secret key** (aka `service_role` in the old naming — the one that is
     NOT the publishable/anon key) → `SUPABASE_SERVICE_ROLE_KEY`
     (the code also accepts `SUPABASE_SECRET_KEY` if you prefer to match
     Supabase's new naming exactly).

   This key is used only from server-side API routes, never sent to the
   browser. Do not expose it as `NEXT_PUBLIC_*`.

4. Add both to `.env.local` and to your Vercel environment variables.

### 3. Deploy to Vercel

```bash
# From this directory:
npx vercel
```

Or push to GitHub and click "Import Project" on <https://vercel.com/new>.
Add the three env vars in the Vercel dashboard, then redeploy.

The badge in the admin page header shows whether the app is currently talking
to Supabase or the local file — a handy sanity check after deploying.

## Playing on a big screen

The layout uses `clamp()` and CSS Grid so the board scales cleanly from a
laptop to a 65″ TV without changing anything. Recommended:

- Full-screen the browser (F11 / ⌘⌃F).
- The board title, category headers, and post-it point values all scale to
  viewport width.
- Small screens fall back to smaller post-its and hide the "Reset" / "Admin"
  labels (icons only) so the board still fits.

## Session state

Whether a question has been "ticked off" is stored in `localStorage` under
`trivia-session`, so a page refresh doesn't lose progress mid-game. When the
admin saves a new board, the game page detects the new `updatedAt` and
automatically resets the session. There is also a manual **Reset** button in
the header.

## Project layout

```
src/
├── app/
│   ├── page.tsx              # Game board (server component, loads board + renders GameBoard)
│   ├── layout.tsx            # Fonts + global CSS
│   ├── globals.css           # Cork background, post-it paper, handwritten font
│   ├── admin/
│   │   ├── page.tsx          # Admin editor (auth-gated)
│   │   └── login/page.tsx    # Password entry
│   └── api/
│       ├── board/route.ts    # GET/POST board JSON
│       └── auth/route.ts     # Sign in / sign out
├── components/
│   ├── game/
│   │   ├── GameBoard.tsx     # Grid, headers, score pill, empty state
│   │   ├── PostIt.tsx        # Individual sticky note with tilt + hover lift
│   │   └── QuestionModal.tsx # Expanded card with tick button
│   └── admin/
│       ├── AdminEditor.tsx   # Row/column stepper + editable grid + save
│       └── LoginForm.tsx     # Password form
└── lib/
    ├── types.ts              # Board / Category / Difficulty / Question
    ├── utils.ts              # cn(), deterministic tilt, id helper
    ├── auth.ts               # Cookie-based admin session
    ├── storage.ts            # Supabase + local file store
    └── session-store.ts      # Zustand session (answered questions)
```

## Ideas for later

- Team scoring: split the score pill into two/three columns, tick per team.
- Timer per question with a soft ring animation.
- Sound effects when a post-it opens or is ticked off.
- Export the board as a JSON file so you can share pre-made packs.
