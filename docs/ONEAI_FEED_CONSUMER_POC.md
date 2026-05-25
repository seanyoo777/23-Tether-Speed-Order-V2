# 23-SpeedOrder-V2 — OneAI Signal Feed Consumer POC

**Status:** Contract validator + sample JSON test · **UI wiring = Step 3** (see 03 `ONEAI_DEVELOPMENT_ORDER.md`)

---

## Files

| File | Role |
|------|------|
| `src/integration/oneaiResearchFeedContract.ts` | Wire types + validate (sync with 03 contract) |
| `src/tests/oneaiResearchFeedContract.test.ts` | Loads `03-OneAI/exports/research_demo_feed.sample.json` |

---

## Regenerate sample (03)

```bash
cd 03-OneAI
npm run export:research-feed
```

---

## Rules

- **Read-only** — display signals; no order mapping  
- **No** import from `03-OneAI/src` in production bundle (copy contract or shared package later)  
- **research_demo** workspace only

---

*mockOnly · STABLE_23_MOCK_V1*
