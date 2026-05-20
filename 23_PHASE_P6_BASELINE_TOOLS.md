# PHASE — P6 기본 툴 (국내선물 + 옵션)

**Status:** COMPLETE  
**Date:** 2026-05-20  
**Base stable:** `STABLE_23_MOCK_V1` (unchanged)

## Scope

- `KOREA_FUTURES` · **KOSPI200F** (kr_future)
- `COIN_OPTIONS` · **BTC_97000_C** (option)
- UI `PRODUCT_TAB_ORDER` — 6탭 · 거래 규칙 = 기존 원웨이 mock

## Gate A

```bash
npm run lint && npm run build && npm run test && npm run smoke
```

## Next

- **23:** 동결 유지 (버그·스킨)
- **24:** 실연동·대형 신기능
