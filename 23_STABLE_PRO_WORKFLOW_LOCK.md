# 23 · STABLE_PRO_WORKFLOW_LOCK



**Stable:** `STABLE_23_PRO_WORKFLOW_V1`  

**Prior stable:** `STABLE_23_MULTI_WORKSPACE_V1`  

**Date:** 2026-05-19  

**Policy:** 기능 추가 중단 · Pro workflow + 주문 정확도 동결



---



## Included in this stable



| Layer | Content |

|-------|---------|

| Engine baseline | `STABLE_23_MULTI_WORKSPACE_V1` — hedge, `bindSymbol`, tab sessions |

| THEME2 | THEME1/2 toggle, floating shell, per-theme workspace |

| THEME2 QA | 8-scenario order accuracy |

| **Pro workflow** | Hotkeys, drag close/TP·SL, reverse, scale, flatten, symbol sync, auto-restore, compact tape, detachable dock |



---



## Recommended git



```bash

git tag -a STABLE_23_PRO_WORKFLOW_V1 -m "23 Speed Order V2 pro workflow QA lock"

# commit message:

# chore(23): QA lock STABLE_23_PRO_WORKFLOW_V1

```



---



## Automated gate (required before tag)



```bash

npm run lint    # PASS

npm run build   # PASS

npm run test    # PASS — 77 tests

npm run smoke   # PASS — 22 lock scenarios + stable assertion

```



---



## Test inventory (fixed at lock)



| Suite | File | Count |

|-------|------|-------|

| Unit + integration | `src/tests/*.test.ts` | 77 |

| Smoke / QA lock | `src/tests/smoke.test.ts` | 22 |

| Workspace order accuracy | `workspaceOrderAccuracy.test.ts` | 10 |

| THEME2 order accuracy | `theme2OrderAccuracy.test.ts` | 8 |

| Pro workflow | `proWorkflow.test.ts` | 5 |



---



## Storage keys (mock)



| Key | Purpose |

|-----|---------|

| `tether23.pro_workflow_v1` | Symbol sync, auto-restore, compact tape |

| `tether23.sessions_v1` | Per-tab positions, orders (theme-agnostic) |

| `tether23.workspace.theme1_v1` / `theme2_v1` | Layout per theme |

| `tether23.theme_v1` | Active theme id |



---



## Forbidden until next phase



- New trading features

- Engine hedge rule changes

- WebSocket / live API

- Editing this stable without new tag



---



## Docs index



- [23_PHASE_PRO_TRADING_WORKFLOW.md](./23_PHASE_PRO_TRADING_WORKFLOW.md)

- [23_THEME2_ORDER_ACCURACY_QA.md](./23_THEME2_ORDER_ACCURACY_QA.md)

- [23_QA_CHECKLIST.md](./23_QA_CHECKLIST.md)


