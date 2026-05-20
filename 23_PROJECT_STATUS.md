# 23 · Project Status



**Updated:** PHASE_P5_INTEGRATION_FREEZE COMPLETE  

**Stable tag:** `STABLE_23_MOCK_V1`  

**Version:** `1.0.0` · mock-only · **4상품 동결 후보**  

**Gate:** lint / build / test **197** / smoke **34** PASS



---



## Release lock



| Item | Value |

|------|--------|

| **Stable tag** | `STABLE_23_MOCK_V1` |

| **Prior stable** | `STABLE_23_COIN_MOCK_V1` |

| **Lock doc** | `23_STABLE_MOCK_V1_LOCK.md` |

| **Next work** | 동결 유지 · §6b 호가 STOP 통일(선택) · 분양 스킨 · 신기능 → 24번 |
| **HQ 보고** | `docs/HQ_REPORTING.md` · `20-TetherTeam-HQ/MASTER_MANUAL.md` §23 |



---



## Phase summary (frozen)



| Phase | Scope | Status |

|-------|--------|--------|

| 0–6 + HTS / Feel / Pro | Core engine + HTS UI | ✅ LOCKED |

| MIT Advanced | Markers, drag, partial TP | ✅ LOCKED |

| Multi Workspace | Tabs, popup, presets | ✅ LOCKED |

| THEME2 Foundation | THEME1/2, floating shell | ✅ LOCKED |

| THEME2 order accuracy QA | 8 scenarios | ✅ LOCKED |

| Pro trading workflow | Hotkeys, reverse, flatten, sync | ✅ LOCKED |

| **STABLE_PRO_WORKFLOW_LOCK** | `STABLE_23_PRO_WORKFLOW_V1` | ✅ |
| **Visual depth engine** | DOM heatmap, velocity, volatile/μDOM | ✅ LOCKED |
| **STABLE_VISUAL_DEPTH_LOCK** | Docs + visual depth smoke freeze | ✅ |
| **REALISTIC_ORDER_FLOW** | Partial fill, slippage, latency, maker/taker, cancel race | ✅ |
| **P1 coin mock stabilize** | One-way primary, MIT/STOP/TP regression | ✅ |
| **P2 coin rules lock** | Edge tests, FLOW doc, STABLE_23_COIN_MOCK_V1 | ✅ |
| **P3 overseas ESZ6** | One-way, adapter PnL | ✅ **CURRENT** |



---



## Automated gate (required)



```bash

npm run lint    # PASS

npm run build   # PASS

npm run test    # PASS — 146 tests

npm run smoke   # PASS — 28 assertions

```



---



## Implemented (at lock)



- Pro workflow: `useProTradingHotkeys`, drag close/TP·SL, reverse, scale, flatten, symbol sync

- `tether23.pro_workflow_v1` prefs

- THEME1/THEME2 + per-theme workspace + session isolation

- `workspaceOrderAccuracy` (10) + `theme2OrderAccuracy` (8) + `proWorkflow` (5)



---



## Deferred (post-lock)



- 해외선물·주식 실 adapter

- TGX-CEX bridge

- Real depth / WebSocket



---



*Do not modify engine rules without updating `23_ENGINE_RULES.md` and re-running full gate.*


