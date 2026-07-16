# RealOffer AI

An AI-positioned real estate deal analysis dashboard. Paste a Zillow listing link or enter a property manually and get an editable investment analysis: property facts, an active listing (when one exists), an automated valuation, comparable sales, and a deterministic financial calculation engine (MAO, projected profit, return on cost, deal classification).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up with any name/email (demo auth — see below) and go to **Analyze Deal**.

## Property data modes

The app ships in **demo mode** by default — no setup required. Every property, listing, valuation, and comparable is generated deterministically from the address (same address always produces the same result) so you can exercise the full workflow without any external account.

To use **real property data** from [RentCast](https://rentcast.io), see [docs/RENTCAST.md](docs/RENTCAST.md) for setup, endpoints used, field sourcing, and current limitations.

Quick version:

1. Create a RentCast account and API key at <https://app.rentcast.io/app/api>.
2. Copy `.env.example` to `.env.local`.
3. Set `RENTCAST_API_KEY=<your key>` and `PROPERTY_DATA_MODE=rentcast` in `.env.local`.
4. Restart `npm run dev` (Next.js also hot-reloads `.env.local` changes without a restart in most cases).

`.env.local` is git-ignored — your key is never committed. The key is only ever read server-side; it's never sent to the browser.

## Demo authentication

Login/signup accept any name and email — nothing is verified, and no password is stored or checked. This is a visual stand-in structured so a real provider (e.g. Supabase) can replace it later without touching consuming components. See `src/lib/auth/AuthProvider.tsx`.

## Saved deals

Deals save to `localStorage` in the current browser only — there is no backend or account sync in this milestone. Deals saved before the RentCast integration was added are automatically migrated on read and remain labeled "Demo."

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run a production build |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests (no network calls, no API key needed) |
| `npm run test:integration` | Optional live RentCast test — only runs when `RENTCAST_API_KEY` is set |

## Tech stack

Next.js (App Router) · TypeScript · Tailwind CSS · React Hook Form + Zod · Framer Motion · Vitest
