# PHASE — P1 코인 mock 안정화

**Status:** COMPLETE (자동 gate + 원웨이 회귀)  
**Date:** 2026-05-20  
**Stable tag:** `STABLE_23_VISUAL_DEPTH_V1` (unchanged)

## Scope

- 원웨이 우선 정책 문서화 (`docs/ONE_WAY_PRIMARY.md`)
- 코인 원웨이 + MIT/STOP + TP/SL OCO 자동 회귀 (`coinOneWayPrimary.test.ts`)
- Gate A 동기화 (test / smoke counts)

## HQ reporting

See `docs/HQ_REPORTING.md`:

| Role | Path |
|------|------|
| HQ status | `20-TetherTeam-HQ/MASTER_MANUAL.md` §23 |
| Session import | `LAST_SESSION_REPORT.md` |
| HQ app project | registry id **23** |

## Out of scope (P1 잔여)

- **Gate B:** `23_MANUAL_QA_COIN.md` A~F (브라우저)
- `STABLE_23_COIN_MOCK_V1` → **P2** Gate 후

## Gate

```bash
npm run lint && npm run build && npm run test && npm run smoke
```

| Check | Result |
|-------|--------|
| lint | PASS |
| build | PASS |
| test | PASS (see `npm run test` output) |
| smoke | PASS (27) |

## Files

| Path | Role |
|------|------|
| `docs/ONE_WAY_PRIMARY.md` | 제품 방향 |
| `src/tests/coinOneWayPrimary.test.ts` | 원웨이 회귀 |
| `23_VERIFICATION_REPORTS.md` | VR-001 |

## Next

**P2** — 코인 규칙 완결 (`oneWayFill` / `hedgeExchangeFill` 엣지, MIT/STOP QA lock)
