# PHASE — P3 해외선물 mock (ESZ6)

**Status:** COMPLETE  
**Date:** 2026-05-20  
**Prior stable:** `STABLE_23_COIN_MOCK_V1` (unchanged)

## Scope

- `OVERSEAS_FUTURES` · `ESZ6` engine-ready (기존 + 회귀 확장)
- **원웨이만** — 헷지 토글 없음
- `productAdapter` PnL (`contractMultiplier` 50) → `pnlEngine` 라우팅
- 코인 규칙·UI 변경 없음

## Gate A

```bash
npm run lint && npm run build && npm run test && npm run smoke
```

## Files

| Path | Role |
|------|------|
| `src/tests/overseasFuturesP3.test.ts` | P3 회귀 |
| `src/engine/pnlEngine.ts` | ESZ6 adapter PnL |
| `23_ENGINE_RULES.md` | §1 상품 표 갱신 |

## Next

**P4** — US/KR 주식 mock
