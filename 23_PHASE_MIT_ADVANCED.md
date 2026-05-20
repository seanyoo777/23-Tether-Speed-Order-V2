# 23 · PHASE_MIT_ADVANCED

**Baseline:** `STABLE_23_PRO_TRADER_V1` (unchanged)  
**Phase:** MIT/STOP advanced UX — mock only, no engine rewrite, no hedge rule changes.

## Delivered

1. **Ladder markers** — MIT/STOP (left STOP), TP/SL (right STOP); color split; hover tooltip (price, qty, status, time).
2. **Drag move** — MIT/STOP markers draggable; `updateOrderTrigger`; drop row flash.
3. **TP/SL linkage panel** — position tree with linked TP/SL rows.
4. **Partial TP** — 25/50/75/100% via protection register; `closeQty` on trigger.
5. **Queued badges** — WAITING / ARMED / TRIGGERED / FILLED / CANCELED.
6. **Trigger flash** — row glow, toast, audit → tape; marker pulse class.
7. **Marker cancel** — right-click or × on MIT/STOP markers + MIT panel cancel.
8. **MIT panel** — right column list with status, price, qty, cancel.
9. **Position close** — `cancelByPositionId` when leg fully closed.
10. **Risk line** — mock liquidation row highlight on ladder.

## Code map

| Area | Path |
|------|------|
| Queued status | `src/mitAdvanced/queuedStatus.ts` |
| Markers VM | `src/mitAdvanced/markers.ts` |
| Risk line | `src/mitAdvanced/riskLine.ts` |
| Order store | `src/engine/orderStore.ts` |
| Session hooks | `src/engine/tradingSession.ts` |
| Ladder UI | `src/ui/OrderBookLadder.tsx` |
| MIT panel | `src/ui/MitOrderPanel.tsx` |
| Linkage | `src/ui/PositionLinkagePanel.tsx` |
| Tests | `src/tests/mitAdvanced.test.ts` |

## QA

- LONG / SHORT MIT register + move + cancel
- Drag trigger update
- Partial TP qty on order; remainder after simulated close path
- Full close removes linked TP/SL
- Trigger emits toast + `getLastTrigger` flash

## Gate

```bash
npm run lint && npm run build && npm run test && npm run smoke
```
