# PHASE — P2 코인 규칙 완결

**Status:** COMPLETE  
**Date:** 2026-05-20  
**Prior:** P1 · `STABLE_23_VISUAL_DEPTH_V1`  
**Lock tag:** `STABLE_23_COIN_MOCK_V1`

## Scope

- `oneWayFill` / `hedgeExchangeFill` / MIT·STOP / panel order 엣지 회귀 (`coinRulesP2.test.ts`)
- Order flow prefs: **기본 OFF** 유지 (`docs/ORDER_FLOW_PREFS.md`)
- 코인 주문 규칙 QA lock 후보

## Gate A

```bash
npm run lint && npm run build && npm run test && npm run smoke
```

## Gate B

`23_MANUAL_QA_COIN.md` A~F — P1에서 확인된 항목 유지 · P2는 자동 회귀 우선

## Files

| Path | Role |
|------|------|
| `src/tests/coinRulesP2.test.ts` | P2 회귀 |
| `docs/ORDER_FLOW_PREFS.md` | FLOW 기본 OFF |
| `23_STABLE_COIN_MOCK_LOCK.md` | QA lock |
| `23_VERIFICATION_REPORTS.md` | VR-002 |

## Next

**P3** — 해외선물 mock (ESZ6)
