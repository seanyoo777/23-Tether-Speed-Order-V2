# 23-SpeedOrder-V2 — OneAI Signal Feed Consumer POC

**Status:** Step 3 complete — read-only `research_demo` workspace UI

---

## Entry

| URL | UI |
|-----|-----|
| `/?workspace=research_demo` | `OneAiResearchDemoWorkspace` — full-page read-only feed |
| Theme2 toolbar | **OneAI Research** link |

No `PanelId` / order wiring. Back link returns to HTS home (`/`).

---

## Files

| File | Role |
|------|------|
| `src/integration/oneaiResearchFeedContract.ts` | Wire types + validate (sync with 03 contract) |
| `src/integration/oneaiResearchDemoRoute.ts` | `?workspace=research_demo` gate |
| `src/integration/loadOneAiResearchDemoFeed.ts` | `fetch('/oneai/research_demo_feed.sample.json')` |
| `src/ui/research/OneAiResearchDemoWorkspace.tsx` | Loader + error state |
| `src/ui/research/OneAiResearchDemoPanel.tsx` | Signal list (display only) |
| `public/oneai/research_demo_feed.sample.json` | Bundled sample (synced from 03 export) |
| `scripts/sync-oneai-feed-sample.mjs` | Copy `03-OneAI/exports/…` → `public/oneai/` |

---

## Regenerate + sync

```bash
cd 03-OneAI
npm run export:research-feed

cd "../23-Tether Speed Order V2"
npm run sync:oneai-feed
```

---

## Tests

| Test | Checks |
|------|--------|
| `oneaiResearchFeedContract.test.ts` | 03 export path (monorepo CI) |
| `loadOneAiResearchDemoFeed.test.ts` | `public/oneai/` bundled sample |
| `oneaiResearchDemoRoute.test.ts` | URL gate |

```bash
npm run test
npm run build
```

---

## Manual QA

1. `npm run dev`
2. Open `http://localhost:5123/?workspace=research_demo` (Vite port in `vite.config.ts`)
3. Confirm signal rows, market chips, MOCK footer
4. From Theme2 HTS, click **OneAI Research**

---

## Rules

- **Read-only** — display signals; no order mapping  
- **No** import from `03-OneAI/src` in production bundle  
- **research_demo** workspace only (separate from popup/ladder)

---

*mockOnly · STABLE_23_MOCK_V1 · Step 3*
