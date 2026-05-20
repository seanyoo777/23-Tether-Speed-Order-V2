# HTS Core Architecture (23-SpeedOrder-V2)

**Status:** Foundation prep — mock only, no live API/WebSocket/order execution.  
**Goal:** Fix structure before UI so multi-symbol, multi-product, hedge, MIT, popups, and resize survive production wiring.

---

## Project boundaries

| # | Project | Role |
|---|---------|------|
| **23** | `23-Tether Speed Order V2` | **Pro HTS target** — this document |
| **02** | `02-TGX-CEX` | Current operational HTS baseline |
| **05** | `05-SpeedOrder` | Order engine / StopMIT / book lab |
| **03** | `03-OneAI` | AI signals / research — **no direct import** into 23 |

---

## Layer map

```
src/core/
├── contracts/          mockOnly, noRealApi guards
├── symbolSpec/         per-symbol rules (registry + engine)
├── productAdapter/     market-type tick/qty/pnl/order rules
├── orderIntent/        OPEN/CLOSE/MIT/STOP/TP intents (no net shortcut)
├── positionLeg/         LONG leg + SHORT leg (hedge)
├── conditionalOrder/   MIT/STOP queue, trigger lock
├── layout/             pro HTS grid + persistence contract
├── detachedWindow/     in-app floating order windows
├── dock/               bottom dock tabs + split/resize
├── marketStream/       single mock router → many workspaces
├── oneaiFeed/          mock JSON adapter (03-shaped, no import)
└── selfTest/           architecture contract runner
```

---

## 1. SymbolSpec Engine

**Path:** `src/core/symbolSpec/`

Unified per-symbol contract. All ladder, order, and PnL UI reads `SymbolSpec` via `getSymbolSpec(symbol)`.

Required fields: `symbol`, `displayName`, `marketType`, `tickSize`, `lotSize`, `priceDecimals`, `qtyDecimals`, `contractMultiplier`, `currency`, `hedgeEnabled`, `mitEnabled`, `stopEnabled`, `shortEnabled`, `leverageEnabled`.

`mockOnly: true` on registry entries until CEX bridge phase.

---

## 2. Product Adapter

**Path:** `src/core/productAdapter/`

One adapter per `marketType`:

- `CoinAdapter`
- `KoreaStockAdapter`
- `UsStockAdapter` — see **`docs/STOCK_TRADING_DESIGN.md`** (양방향·선물형 청산·125×, 미구현)
- `KoreaFutureAdapter`
- `OverseasFutureAdapter`
- `OptionAdapter`

Responsibilities: tick rounding, qty step, book price step, PnL formula, allowed order intents, display format.

Factory: `getProductAdapter(marketType)`.

---

## 3. Order Intent Model

**Path:** `src/core/orderIntent/`

Intents (never infer close from sell in hedge mode):

| Intent | Meaning |
|--------|---------|
| `OPEN_LONG` / `OPEN_SHORT` | Hedge entry / add |
| `CLOSE_LONG` / `CLOSE_SHORT` | Leg reduce / close (`reduceOnly`) |
| `MIT_OPEN_*` / `MIT_CLOSE_*` | MIT at **fixed** `triggerPrice` |
| `STOP_LOSS_*` / `TAKE_PROFIT_*` | Protection triggers |

`isCloseIntent()`, `isMitIntent()`, `hedgeSideFromIntent()` helpers.

---

## 4. Position Leg Model

**Path:** `src/core/positionLeg/`

`HedgePositionBook`: `longLeg?`, `shortLeg?` per `(productKey, symbol)` — **no netPosition**.  
**Product rule:** **one-way** default (all products). **Hedge legs** only when `COIN_FUTURES` + `hedgeMode` ON (`docs/POSITION_MODE.md`).

Each leg: `qty`, `avgPrice`, `unrealizedPnl`, `tpPrice?`, `slPrice?`, `reduceOnly` on close paths.

---

## 5. MIT / STOP Queue Engine

**Semantics:** MIT and STOP are the **same** trigger family (돌파·손절·익절). Up/down breakout use one rule: touch or cross `triggerPrice`. See `docs/MIT_STOP_SEMANTICS.md`.

**Path:** `src/core/conditionalOrder/`

`ConditionalOrderQueue`: register at orderbook click price; `locked: true` by default.

**Forbidden:** auto-moving `triggerPrice` when last price changes. Updates only via explicit user edit or re-click (`relockTriggerPrice`).

Fields: `triggerPrice`, `direction`, `intent`, `hedgeSide`, `reduceOnly`, `source`, `locked`, `mockOnly`.

---

## 6. HTS Layout Engine

**Path:** `src/core/layout/`

Slots: `watchlist` (left), `chart` (center), `orderbook` (center/right), `orderPanel` (right), `dock` (bottom).

Features: panel resize fractions, `localStorage` key `tether23.hts.layout.core.v1`, zoom-safe (`100%`–`120%` browser scale via density tokens, not transform scale).

Bridges existing `workspace/types.ts` without replacing stable workspace storage.

---

## 7. Detached Window / Multi Order Window

**Path:** `src/core/detachedWindow/`

In-app floating windows first (`mode: 'in_app_float'`); `window.open` reserved as `mode: 'browser_popup'` (not used in mock).

Record: `windowId`, `symbol`, `productType`, qty/order presets, position, size, `linkedWorkspaceId`, persistence, `mockOnly: true`.

---

## 8. WebSocket Multiplex (prep only)

**Path:** `src/core/marketStream/`

Single `MarketStreamRouter` — one mock stream, fan-out to subscribers by `workspaceId` / `windowId`.

**Forbidden:** per-tab native WebSocket in production wiring until router is used; tests assert `no-real-api-no-websocket`.

---

## 9. Dock System

**Path:** `src/core/dock/`

Tabs: position, unfilled, fills, orders, balance, liquidation, dailyPnl, risk.

Supports `split2` / `split3`, height ratio resize, inner scroll; page-level scroll minimized by contract.

---

## 10. OneAI Feed Adapter (mock)

**Path:** `src/core/oneaiFeed/`

`fetchMockOneAiSignals()` — JSON-shaped mock. **No** `import` from `03-OneAI`.

Fields: `signalId`, `marketType`, `symbol`, `direction`, `confidenceMock`, `strategyType`, `reasoningSummary`, `marketRegimeRef`, `mockOnly`.

---

## Prohibitions (enforced in code + self-test)

- No real trade API
- No real WebSocket URL connections
- No net-only position for hedge symbols
- No MIT trigger auto-follow
- No deletion of stable tags / existing engine tests

---

## Verification

```bash
cd "23-Tether Speed Order V2"
npm run lint
npm run build
npm run test
npm run smoke
```

Self-test IDs: see `src/core/selfTest/htsCoreSelfTest.ts`.

---

## Next steps (recommended)

1. Wire `SymbolSpec` registry to `ProductSymbolSelector` + ladder tick step.
2. Route `TradingSession` submit paths through `OrderIntent` + `ConditionalOrderQueue`.
3. Replace left tape-only column with `watchlist` slot using layout engine.
4. CEX bridge (02) behind `mockOnly: false` feature flag — separate phase.
