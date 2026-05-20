# 23 · STABLE_MULTI_WORKSPACE_LOCK

**Stable:** `STABLE_23_MULTI_WORKSPACE_V1`  
**Prior stable:** `STABLE_23_PRO_TRADER_V1` (engine/UI baseline — unchanged in git history)  
**Date:** 2026-05-19  
**Policy:** 기능 추가 중단 · 주문 정확도·멀티워크스페이스 동결

---

## Included in this stable

| Layer | Content |
|-------|---------|
| Engine | Hedge, MIT/STOP, TP/SL, `bindSymbol` per tab session |
| MIT Advanced | Markers, drag, partial TP, queued badges, MIT panel |
| Multi Workspace | Tabs, detach, popup, layout/monitor presets, save/load |
| Order accuracy | 10-scenario QA — tab isolation, persistence, no cross-fill |

---

## Recommended git

```bash
git tag -a STABLE_23_MULTI_WORKSPACE_V1 -m "23 Speed Order V2 multi-workspace QA lock"
# commit message:
# chore(23): QA lock STABLE_23_MULTI_WORKSPACE_V1
```

---

## Automated gate (required before tag)

```bash
npm run lint    # PASS
npm run build   # PASS
npm run test    # PASS — 55 tests (incl. workspaceOrderAccuracy 10)
npm run smoke   # PASS — 18 lock scenarios + stable assertion
```

---

## Test inventory (fixed at lock)

| Suite | File | Count |
|-------|------|-------|
| Unit + integration | `src/tests/*.test.ts` | 55 |
| Smoke / QA lock | `src/tests/smoke.test.ts` | 18 |
| Workspace order accuracy | `src/tests/workspaceOrderAccuracy.test.ts` | 10 |

---

## Storage keys (mock)

| Key | Purpose |
|-----|---------|
| `tether23.workspace_v1` | Layout, tabs, panels |
| `tether23.sessions_v1` | Per-tab positions, orders, audits |

---

## Forbidden until next phase

- New trading features
- Engine hedge rule changes
- WebSocket / live API
- Editing this stable without new tag

---

## Docs index

- [23_MULTI_WORKSPACE_ORDER_ACCURACY_QA.md](./23_MULTI_WORKSPACE_ORDER_ACCURACY_QA.md)
- [23_PHASE_MULTI_WORKSPACE.md](./23_PHASE_MULTI_WORKSPACE.md)
- [23_QA_CHECKLIST.md](./23_QA_CHECKLIST.md)
