# 23 · THEME2_ORDER_ACCURACY_QA

**Baseline:** `STABLE_23_MULTI_WORKSPACE_V1` + `PHASE_THEME2_FOUNDATION`  
**Policy:** 기능 추가 없음 · 실패 시 주문 정확도만 수정

## Scenarios (automated)

| # | Scenario | Result |
|---|----------|--------|
| 1 | THEME2 BTC LONG | PASS |
| 2 | THEME2 ETH SHORT | PASS |
| 3 | THEME1↔THEME2 전환 후 포지션 유지 (`tether23.sessions_v1`) | PASS |
| 4 | `theme1_v1` / `theme2_v1` workspace 분리 | PASS |
| 5 | floating ladder — 해당 tab/session만 변경 | PASS |
| 6 | `theme2-multi-chart` — 탭별 세션 미혼합 | PASS |
| 7 | theme remount + reload — 중복 체결 없음 | PASS |
| 8 | THEME1 multi-coin 동작 유지 | PASS |

## Tests

`src/tests/theme2OrderAccuracy.test.ts` (8 cases)

## Gate

```bash
npm run lint && npm run build && npm run test && npm run smoke
```

## Notes

- Sessions are **theme-agnostic** (`tether23.sessions_v1`); workspace layout is per-theme.
- THEME2 charts are display-only; orders flow through active tab `TradingProvider` session.
- `WorkspaceProvider key={themeId}` remounts registry; hydration must not re-fill completed MIT.
