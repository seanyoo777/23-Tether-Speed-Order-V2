# 23 · PHASE_REALISTIC_ORDER_FLOW

**Baseline:** `STABLE_23_VISUAL_DEPTH_V1` (engine hedge rules unchanged)  
**Policy:** Mock execution realism · per-session flow · `bindSymbol` preserved

## Delivered

| Feature | Implementation |
|---------|----------------|
| Realistic fill flow | `sessionOrderFlow` wraps ladder entry |
| Partial fill | Multi-slice plan + `addToLeg` |
| Queue priority | `queuePriority` on pending LIMIT |
| Slippage mock | Taker tick slippage on fill price |
| Order latency | `instant` / `normal` / `slow` / `volatile` |
| Maker/taker visual | `OrderFlowHud` + dock column |
| Cancel race | `cancelWithRace` on partial fill |
| Market sweep / vacuum / stop hunt / fake breakout / liq cascade | `FlowVisualTag` + HUD flash |
| High vol mode | `volatile` latency |

## Code map

| Path | Role |
|------|------|
| `src/orderFlow/flowEngine.ts` | Fill planning |
| `src/orderFlow/sessionOrderFlow.ts` | Per-session controller |
| `src/orderFlow/flowPrefs.ts` | `tether23.order_flow_v1` |
| `src/ui/OrderFlowHud.tsx` | FLOW / LAT toggles + status |
| `src/engine/tradingSession.ts` | Integration |

## Gate

```bash
npm run lint && npm run build && npm run test && npm run smoke
```

## Usage

1. 상단 **FLOW ON** → realistic path active  
2. **LAT** cycles latency (INST → NORM → SLOW → VOL)  
3. 미체결 탭: maker/taker · flow tag
