# POST-FREEZE — §6b 호가 STOP 4상품 통일

**Status:** COMPLETE  
**Date:** 2026-05-20  
**Base stable:** `STABLE_23_MOCK_V1` (unchanged)

## Scope

- AAPL · 005930 `mitEnabled: true` (ESZ6 · 코인은 기존 동일)
- `canRegisterBookMit` — `stopEnabled && mitEnabled` on engine-ready symbols
- 원웨이 MIT/STOP 엔진 규칙 변경 없음

## Gate A

```bash
npm run lint && npm run build && npm run test && npm run smoke
```

## Manual (optional)

`23_MANUAL_QA_COIN.md` §G2 — 4상품 호가 STOP 열 클릭 → MIT 등록
