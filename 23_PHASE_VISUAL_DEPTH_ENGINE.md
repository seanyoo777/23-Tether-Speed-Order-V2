# 23 · PHASE_VISUAL_DEPTH_ENGINE

**Status:** LOCKED at **`STABLE_23_VISUAL_DEPTH_V1`**  
**Baseline:** `STABLE_23_PRO_WORKFLOW_V1` (engine unchanged)  
**Policy:** UI/visualization only · mock depth · no order engine changes

## Delivered

| Feature | Implementation |
|---------|----------------|
| Depth visualization | `buildDepthBookVisual` heatmap via `--ask-int` / `--bid-int` |
| DOM pressure heatmap | Row gradients on ask/bid sides |
| Cumulative volume bar | `.depth-cum-bar` + `--ask-cum` / `--bid-cum` |
| Iceberg mock | `isIcebergMock` + 🧊 tag |
| Aggressive pulse | `agg-pulse-buy/sell` + tape border |
| Spread compression flash | `spreadFlash` + `.spread-flash` |
| Large order wall | `wall-ask` / `wall-bid` row classes |
| Ladder volume animation | `volPulse` keyframes on `.depth-qty` |
| Velocity ticker | `VelocityTicker` component |
| Panic/volatile mode | `volatile` → `depth-panic` |
| Ultra compact DOM | `ultra-dom` density on ladder rows |

## Code map

| Path | Role |
|------|------|
| `src/visualDepth/depthEngine.ts` | Mock book visual builder |
| `src/visualDepth/visualDepthPrefs.ts` | `tether23.visual_depth_v1` |
| `src/ui/OrderBookLadder.tsx` | Integration |
| `src/ui/DepthModeToolbar.tsx` | DEPTH ON / mode cycle |
| `src/ui/VelocityTicker.tsx` | VEL + spread + pulse |

## Gate

```bash
npm run lint && npm run build && npm run test && npm run smoke
```
