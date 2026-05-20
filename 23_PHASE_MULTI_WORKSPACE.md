# 23 · PHASE_MULTI_WORKSPACE

**Baseline:** `STABLE_23_PRO_TRADER_V1` (unchanged)  
**Policy:** mock-only · per-tab `TradingSession` · no WebSocket / external API

## Delivered

| Feature | Implementation |
|---------|----------------|
| Detachable DOM | `DetachablePanel` + portal → `FloatingPanel` |
| Popup window | `?popup=1&tabId=&panel=` · `PopupWorkspace` |
| Multi tab | `WorkspaceTabBar` · `SessionRegistry` per tab |
| Workspace save | `tether23.workspace_v1` localStorage |
| BTC/ETH/SOL | `multi-coin` preset + tab add buttons |
| Layout preset | default / scalper / multi-coin / wide-ladder / floating-ladder |
| Floating ladder | `floating-ladder` preset + detach ↗ |
| Panel docking | dock zones left/center/right/bottom + ⊞ |
| Monitor preset | single / dual / triple CSS width simulation |

## Code map

| Path | Role |
|------|------|
| `src/workspace/` | types, presets, storage, registry, popupBridge |
| `src/app/WorkspaceContext.tsx` | state + BroadcastChannel sync |
| `src/ui/workspace/` | Shell, toolbar, tabs, floating/dock |
| `src/ui/SpeedOrderPane.tsx` | panel slots + detach wrappers |
| `src/app/App.tsx` | main vs popup routing |

## Gate

```bash
npm run lint && npm run build && npm run test && npm run smoke
```
