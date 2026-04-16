# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

No test runner is configured.

## Architecture

This is a **market regime surveillance dashboard** — a single-page Next.js App Router app with one API route and one main component.

### Data flow

1. `app/components/RiskDashboard.tsx` (client component) — fetches all assets on mount and every 5 minutes via `setInterval`. All state lives here via `useState`.
2. `app/api/market-data/route.ts` — server-side route called as `GET /api/market-data?symbol=<SYMBOL>`. Fetches from Yahoo Finance (stocks/indices) or CoinGecko (BTC). Returns `{ price, ma200, change }`. Responses are revalidated every 300 seconds.
3. No database, no auth, no external secrets — both upstream APIs are public.

### Regime logic

`RiskDashboard.tsx` evaluates signals from 4 key assets (SPY, BTC, DX-Y, TNX) to produce an overall regime label: **EASY** / **RISK-OFF** / **CHAOS**. The component also renders a morning checklist derived from those signals.

### Tech stack

- Next.js 16 (App Router), React 19, TypeScript 5
- Tailwind CSS 4 (via `@tailwindcss/postcss`)
- Path alias `@/*` maps to the repo root
