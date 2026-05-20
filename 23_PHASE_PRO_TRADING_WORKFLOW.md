# 23 · PHASE_PRO_TRADING_WORKFLOW

**Status:** LOCKED at **`STABLE_23_PRO_WORKFLOW_V1`**  
**Policy:** 주문 정확도 최우선 · `bindSymbol` / 심볼 가드 유지

## Delivered

| Feature | Implementation |
|---------|----------------|
| Keyboard ultra-fast | `useProTradingHotkeys` — Q/A, 1-3, B/V mid, R, +/-, X/P, F9 |
| Ladder hotkey trading | B/V → `placeLadderOrder` @ last price |
| Drag close | Position markers on ladder → `closePosition(100, price)` |
| Drag TP/SL resize | `PROTECTION_TP`/`SL` draggable in `OrderBookLadder` |
| Quick reverse | `reversePosition` — close 100% + opposite leg |
| Scale in/out | `scaleIn` / `closePosition` partial |
| Multi-position row actions | Dock: R / + / − / 25·50·100·X |
| Detachable position dock | `ProWorkflowBar` → `detachPanel('dock')` |
| Compact tape | `TradeTapePanel compact` + prefs |
| Workspace auto-restore | Debounced `saveWorkspace` on layout commit |
| Emergency flatten | `flattenAll` + F9 / FLATTEN button |
| Symbol sync / unsync | `setWorkspaceSymbol` + prefs toggle |

## Code map

| Path | Role |
|------|------|
| `src/engine/tradingSession.ts` | reverse, scaleIn, flattenAll |
| `src/ui/useProTradingHotkeys.ts` | hotkeys |
| `src/ui/useTradingWorkflow.ts` | pane callbacks |
| `src/ui/ProWorkflowBar.tsx` | SYNC / auto-restore / tape / FLATTEN |
| `src/proWorkflow/workflowPrefs.ts` | `tether23.pro_workflow_v1` |
| `src/app/WorkspaceContext.tsx` | symbol sync, auto-save |

## Gate

```bash
npm run lint && npm run build && npm run test && npm run smoke
```
