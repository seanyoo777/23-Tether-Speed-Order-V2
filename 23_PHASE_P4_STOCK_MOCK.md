# PHASE — P4 주식 mock (US / KR)

**Status:** COMPLETE  
**Date:** 2026-05-20  
**Prior stable:** `STABLE_23_COIN_MOCK_V1` (unchanged until P5)

## Scope

- `US_STOCK` · **AAPL** engine-ready
- `KOREA_STOCK` · **005930** engine-ready
- 원웨이만 · 헷지 토글 없음 · 호가 «준비중» 제거 (`isProductEngineReady`)
- `pnlEngine` — 비코인 상품 → `productAdapter` (multiplier 1)
- KRX tick 100 (`roundBridgePrice` on 005930)

## Gate A

```bash
npm run lint && npm run build && npm run test && npm run smoke
```

**Result:** test **185** · smoke **32** — PASS

## Files

| Path | Role |
|------|------|
| `src/types/productTypes.ts` | `US_STOCK` / `KOREA_STOCK` symbols + seed config |
| `src/integration/symbolConfigBridge.ts` | `us_stock` / `kr_stock` bridge |
| `src/integration/watchlistBridge.ts` | tradable watchlist rows |
| `src/engine/pnlEngine.ts` | non-coin adapter routing |
| `src/tests/stockMockP4.test.ts` | P4 회귀 (10) |
| `23_ENGINE_RULES.md` | §1 상품 표 |

## Next

**P5** — 4상품 통합 스모크 · `STABLE_23_MOCK_V1` 동결 후보
