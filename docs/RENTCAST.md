# RentCast integration

This app can source property, listing, valuation, and comparable-sales data from [RentCast](https://rentcast.io) instead of the deterministic demo generator. This document explains setup, exactly what data comes from where, and the current limitations.

## Setup

1. Create a RentCast account and generate an API key at <https://app.rentcast.io/app/api>.
2. Copy `.env.example` to `.env.local` in the project root (this file is git-ignored — never commit it).
3. Set both variables:
   ```
   RENTCAST_API_KEY=your-real-key-here
   PROPERTY_DATA_MODE=rentcast
   ```
4. Restart `npm run dev` if it doesn't pick up the change automatically (Next.js reloads `.env.local` on save in most dev sessions — watch the terminal for a `Reload env: .env.local` line).

Leaving `PROPERTY_DATA_MODE` unset, or set to anything other than `rentcast`, keeps the app in demo mode regardless of whether a key is present. Setting `PROPERTY_DATA_MODE=rentcast` without a key does **not** silently fall back to demo data — every analysis attempt will show a clear "not configured" error with the choice to retry, enter the property manually, or explicitly continue with labeled demo data instead.

## Where the key lives

`RENTCAST_API_KEY` is read only in `src/config/env.ts`, which is marked `import "server-only"` — bundling it into a client component is a build error, not just a lint warning. It's consumed by `src/lib/property/rentcast/client.ts`, which is the only file that ever sends the `X-Api-Key` header. No RentCast request is ever made from the browser; the client calls a Next.js Server Action (`src/lib/property/providerSelection.ts`) that runs entirely server-side. You can confirm this yourself: `grep -r "api.rentcast.io" .next/static/` after a build returns nothing.

## Endpoints used

| Endpoint | Method | What we ask for | Why |
| --- | --- | --- | --- |
| `/v1/properties` | GET | `address` | Property-record facts: beds, baths, sqft, lot size, year built, county, last sale, tax assessment |
| `/v1/listings/sale` | GET | `address`, `status=Active` | The current active listing, if one exists: list price, days on market, MLS #, HOA fee |
| `/v1/avm/value` | GET | `address` | Automated valuation (AVM) and up to the endpoint's default comparable set |

All three are called for every analysis (in parallel where possible). Authentication is the `X-Api-Key` header. Rate limit per RentCast's docs: 20 requests/second — comfortably above what a single analysis (3 calls) needs.

## Field sourcing

The workspace tags every value with a source badge so you always know what's real, what's an estimate, what's calculated, and what's missing:

| Badge | Meaning |
| --- | --- |
| **Provider record** | Reported directly by RentCast's property-record endpoint |
| **Active listing** | Reported by RentCast's sale-listing endpoint |
| **Automated estimate** | RentCast's AVM output |
| **Calculated** | Computed by RealOffer's own deterministic formulas (ARV suggestion, MAO, profit, etc.) |
| **User-entered** | You typed it, or overrode a suggested value |
| **Unavailable** | RentCast didn't return this field — shown as "Not available," never guessed |
| **Demo** | Deterministically generated demo data, not from any live source |

A missing field is always shown as "Not available" rather than defaulted to zero or omitted silently — a $0 lot size and an unknown lot size are different things, and the UI never conflates them.

## Why the AVM is not ARV

RentCast's `/v1/avm/value` returns its model's estimate of the property's **current** value. That is not the same thing as **after-repair value (ARV)** — a renovation changes the property, and the AVM doesn't know your renovation plan. The app therefore keeps these as two separate, separately-labeled numbers:

- **Current estimated value (AVM)** — shown on the property overview, badged "Automated estimate." Informational only; it never feeds the financial calculations.
- **Suggested ARV** — calculated by `suggestArvFromComparables()` from the comparable sales you've included, badged "Calculated." This is what actually feeds the MAO/profit math, and you can override it manually at any time.

## Comparable sales and the RealOffer similarity score

RentCast's AVM comparables come with a `status` field (e.g. "Active," "Inactive") rather than a guaranteed closed-sale price — an "Active" comp's price is a **list** price, not a sale price. The app is explicit about this rather than asserting every comp is a completed sale:

- Comps are labeled **Off-market** (non-Active status) or **Active listing**.
- Off-market comps are included in the ARV suggestion by default; active-listing comps are excluded by default (you can toggle either).

When RentCast supplies its own `correlation` figure for a comp, it's used directly (badged "provider"). When it doesn't, the app calculates its own documented **RealOffer similarity score** (badged "RealOffer") from five weighted factors — see the formula and weights in `src/lib/property/similarity.ts`.

## Caching and API usage

- Results are cached server-side in memory per normalized address for 15 minutes, and concurrent requests for the same address are de-duplicated rather than firing twice.
- The workspace has an explicit **Refresh Property Data** button (bypasses the cache) — saved analyses are never silently overwritten by a background refresh.
- **Expected usage per analysis:** 3 RentCast requests (property, listing, AVM) on a cache miss; 0 on a cache hit within the 15-minute window.
- In development, each request is logged to the server console as `[rentcast] request #N -> <endpoint>` — endpoint name and a counter only, never the key, address, or response body.

This is an in-memory cache (a `Map`, scoped to the server process) — it resets on redeploy/restart and isn't shared across server instances. It's intentionally simple for this milestone; swapping in Redis or a database later only requires changing `src/lib/property/rentcast/rentcastProvider.ts`.

## Why Zillow isn't scraped

The app never fetches a Zillow page or bypasses any access control. Pasting a Zillow URL only extracts the address (and zpid, if present) from the URL string itself — see `src/lib/property/zillowUrl.ts`. That extracted address is then looked up through RentCast (or the demo generator) exactly the same way a manually-typed address would be. The URL is validated against an exact hostname allowlist (`zillow.com` / `www.zillow.com`) before anything is parsed, rejecting look-alike domains, non-http(s) schemes, and malformed input.

## Current limitations

- No property photos are displayed — RentCast's photo licensing wasn't confirmed for this milestone, so photo URLs are simply never requested or shown.
- Owner contact information is neither retrieved nor stored, even though RentCast's property-record schema includes it.
- Ambiguous address matches (RentCast returns more than one candidate) resolve by asking you to pick a candidate and re-enter it through the manual form — there's no "fetch by RentCast ID" round-trip yet.
- The cache is in-memory and per-process; it does not survive a server restart or scale across multiple server instances.
- MLS data, where RentCast returns it, is shown as an identifier only — no attempt is made to reproduce restricted MLS content beyond what RentCast's API itself returns.
