# 23 · MULTI_WORKSPACE_ORDER_ACCURACY_QA

**Status:** PASS (automated) · locked at **`STABLE_23_MULTI_WORKSPACE_V1`**  
**Tests:** `src/tests/workspaceOrderAccuracy.test.ts` (10 scenarios)

## Fixes applied

| Issue | Fix |
|-------|-----|
| Cross-symbol ticks in tab session | `createTradingSession({ bindSymbol })` — single-symbol ticker |
| Tick processed for wrong symbol | `processTick` guards `bindSymbol` + `state.symbol` |
| Popup = separate in-memory state | `tether23.sessions_v1` per `tabId` + hydrate on `getOrCreate` |
| Workspace save without trading state | `save()` persists all tab sessions; `load()` reloads registry |
| Broadcast duplicate fills | `session:saved` reloads snapshot only (no re-execute); foreign-source filter |
| Shared global order id seq | `orderSeq` / `auditSeq` per store instance |
| Close/TP on wrong symbol | `closePosition` / `registerAutoProtection` symbol mismatch guard |

## QA matrix

1. BTC LONG 0.05 — isolated `tab-btc` session  
2. ETH SHORT 0.05 — isolated `tab-eth` session  
3. SOL MIT register — pending only on SOL session  
4. BTC close — ETH/SOL positions & orders unchanged  
5. ETH TP/SL — BTC/SOL unchanged  
6. SOL MIT trigger — SOL positions only  
7. Popup — second registry loads same `tabId` snapshot  
8. Floating — same session reference (UI detach does not fork engine)  
9. Save/load — workspace + session storage roundtrip  
10. Reload — hydrate does not add duplicate fills  

## Gate

```bash
npm run lint && npm run build && npm run test && npm run smoke
```
