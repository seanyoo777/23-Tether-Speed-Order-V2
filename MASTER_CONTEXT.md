# 23-Tether-Speed-Order-V2 — MASTER_CONTEXT

**Canonical monorepo context:** [../MASTER_CONTEXT.md](../MASTER_CONTEXT.md)

**Architecture (this project):** [docs/HTS_CORE_ARCHITECTURE.md](./docs/HTS_CORE_ARCHITECTURE.md)

---

## Role

Pro HTS target — multi-window, multi-product, hedge legs, MIT/STOP on ladder, mock-only until CEX bridge phase.

| Peer | Role |
|------|------|
| **02-TGX-CEX** | Operational HTS baseline |
| **05-SpeedOrder** | Order engine / StopMIT lab |
| **03-OneAI** | Signals — **no direct import**; use `src/core/oneaiFeed/mockAdapter.ts` |

---

## HTS Core (`src/core/`) — 2026-05-20

| Module | Path |
|--------|------|
| SymbolSpec | `src/core/symbolSpec/` |
| Product adapters | `src/core/productAdapter/` |
| Order intents | `src/core/orderIntent/` |
| Position legs | `src/core/positionLeg/` |
| MIT/STOP queue | `src/core/conditionalOrder/` |
| Layout | `src/core/layout/` |
| Detached windows | `src/core/detachedWindow/` |
| Dock | `src/core/dock/` |
| Market stream router | `src/core/marketStream/` |
| OneAI mock feed | `src/core/oneaiFeed/` |
| Self-test | `src/core/selfTest/htsCoreSelfTest.ts` |

**Guards:** `HTS_CORE_MOCK_ONLY`, no real API/WebSocket, no netPosition, MIT trigger lock.

---

## Verification

```bash
npm run lint && npm run build && npm run test && npm run smoke
```

Self-test IDs: `symbol-spec-schema`, `product-adapter-contract`, `order-intent-separated`, `hedge-position-leg-separated`, `mit-trigger-lock`, `layout-persistence-contract`, `detached-window-contract`, `oneai-feed-contract`, `no-real-api-no-websocket`, `mock-only-contract`.

---

## Stable locks (unchanged)

- `STABLE_23_VISUAL_DEPTH_V1`
- `STABLE_23_PRO_WORKFLOW_V1`
- `STABLE_23_MULTI_WORKSPACE_V1`

---

## Overseas futures phase 2 (2026-05-20)

- `OVERSEAS_FUTURES` engine-ready: **ESZ6** (tick 0.25, mock seed 5800)
- `symbolConfigBridge.ts` — product-aware SymbolSpec (no 02 import)
- MIT / ladder / watchlist same rules as coin

## Coin bridge phase 1 (2026-05-20)

- `src/integration/coreBridge.ts` — tick/lot/meta from `SymbolSpec` for BTC/ETH/SOL
- `getSymbolConfig()` → `resolveCoinSymbolConfig()` (호가 틱 = core)
- UI: `CoreSymbolMeta` in header (`CORE tick … lot …`)
- MIT: `registerMit` also mirrors to `coinMitBridge` + core queue (locked price)
- Tests: `src/tests/coreBridge.test.ts` (5)

## Next steps

1. Ladder click → `OrderIntent` audit (open only, no UX change)
2. Left slot → watchlist panel (layout engine)
3. 02-TGX-CEX hedge embed (separate phase)
