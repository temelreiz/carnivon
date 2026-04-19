# Carnivon

Institutional access to livestock yield. Real Asset Yield Infrastructure.

This repo contains:

- **Marketing site** — `carnivon.io` landing (Next.js App Router)
- **Vault** — `vault.carnivon.io` investor area (same app, subdomain-routed)
- **Smart contracts** — ERC-3643-style permissioned token for a cycle series (`contracts/`, Hardhat)

## Stack

- Next.js 15 (App Router, Turbopack), TypeScript, Tailwind
- Prisma + Postgres (Neon)
- Edge-safe API routes where possible (product / metrics / documents)
- Solidity 0.8.24 + OpenZeppelin (contracts)

## Getting started

```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URL
pnpm db:generate
pnpm dev               # http://localhost:3000
```

### Contracts

```bash
cd contracts
pnpm install
pnpm test
pnpm deploy:local      # requires local hardhat node
```

## Subdomain routing

Production:

- `carnivon.io` → marketing site
- `vault.carnivon.io` → `/vault/*` (rewritten in `middleware.ts`)

Local:

- `http://localhost:3000` → marketing
- `http://localhost:3000/vault` → vault (path-based, dev convenience)

To simulate subdomains locally, add to `/etc/hosts`:

```
127.0.0.1  carnivon.localhost vault.carnivon.localhost
```

Then visit `http://vault.carnivon.localhost:3000`.

## Project layout

```
src/
  app/
    page.tsx                  # Landing
    vault/                    # /vault/* (served on vault.carnivon.io)
    api/
      product/current         # GET active cycle snapshot
      metrics/live            # GET weekly operational metrics
      documents               # GET public doc metadata
      access/request          # POST access request
      kyc/init                # POST KYC session init (stub)
  components/
    landing/*                 # Hero, ProductCard, HowItWorks, etc.
    ui/Section.tsx
  lib/
    db.ts                     # Prisma client singleton
    mock-data.ts              # Dev fixtures

prisma/schema.prisma          # investor / cycle / livestock / cost / sale / distribution
middleware.ts                 # subdomain routing

contracts/
  contracts/CarnivonToken.sol       # ERC-3643-style permissioned token (decimals=0)
  contracts/IdentityRegistry.sol    # KYC wallet registry
  contracts/ComplianceEngine.sol    # transfer rules (lockup, jurisdiction)
  scripts/deploy.ts                 # full-stack deploy
  test/CarnivonToken.test.ts        # compliance + lifecycle tests
```

## Deploy

### Primary: Vercel + Neon

1. Push to GitHub, import into Vercel
2. Add the production domains:
   - `carnivon.io`
   - `vault.carnivon.io`
   - (optional) `www.carnivon.io` → 308 redirect to apex
3. Env vars (Production):
   - `DATABASE_URL` — Neon pooled connection string
   - `NEXT_PUBLIC_ROOT_DOMAIN=carnivon.io`
   - `KYC_PROVIDER_API_KEY`, `KYC_PROVIDER_SECRET` (once integrated)
   - `RESEND_API_KEY`, `ACCESS_REQUEST_TO`
4. Set up Neon:
   - Create project, create `carnivon` database
   - Run `pnpm db:push` from a machine with `DATABASE_URL`

DNS:

```
carnivon.io        A      76.76.21.21     (Vercel apex)
vault.carnivon.io  CNAME  cname.vercel-dns.com
```

### Alternative: Cloudflare Pages + D1/Workers

The marketing site is edge-compatible. To run on Cloudflare:

1. `pnpm add -D @cloudflare/next-on-pages`
2. Build with `npx @cloudflare/next-on-pages`
3. Deploy `.vercel/output/static` via Pages
4. Replace Prisma/Postgres with D1 (or keep Neon via HTTP driver)

Note: The nodejs-runtime API routes (`access/request`, `kyc/init`) will need
`export const runtime = "edge"` and a Workers-compatible rewrite of the
rate-limit store (Upstash or Workers KV).

## Status & next steps

Done:

- Landing site (8 sections) with agro-luxury design system
- API routes with Zod validation and in-memory rate limit
- Prisma schema for off-chain accounting
- Vault skeleton (dashboard + login placeholder)
- ERC-3643-style token + identity + compliance contracts with tests

Next:

- Wire Prisma queries in `/api/product/current` & `/api/metrics/live`
- Plug a real KYC provider (Sumsub / Onfido) into `/api/kyc/init`
- Auth flow for vault (magic link via Resend, or SIWE once wallet is linked)
- Upstash rate limit for `/api/access/request`
- Deploy T-REX suite instead of the simplified token for production
- Legal review before any issuance

## Security & compliance

- No tokens are offered to retail investors. All wallets must be verified via
  `IdentityRegistry` before `mint`/`transfer`.
- Hedge, insurance, mortality reserves, and jurisdiction blocklist are
  enforced in `ComplianceEngine` + off-chain policy.
- Target returns are illustrative, not guaranteed. Landing page copy includes
  appropriate disclaimers; legal counsel must review before launch.

## License

Proprietary. © Carnivon.
