# Order flow prefs (`tether23.order_flow_v1`)

**P2 policy:** 기본 **OFF** — 일반 체결·호가·주문창은 즉시 mock fill.

## Defaults

| Field | Default |
|-------|---------|
| `enabled` | `false` |
| `latencyMode` | `normal` |

## When OFF (recommended)

- `placeLadderOrder` → `fillLadderLimit` / `fillOneWayLeg`
- `placePanelOrder` → `fillPanelOrder` (시장가/지정가)
- 원웨이 규칙 100% 적용

## When ON

- HUD **FLOW ON** 또는 `saveOrderFlowPrefs({ enabled: true, ... })`
- Ladder: partial slices · slippage · maker/taker metadata
- **원웨이:** still `fillLadderLimit` (hedge slice path disabled)
- **헷지 ON:** exchange-style slice fill + visuals

## Storage

`localStorage` key: `tether23.order_flow_v1`

## Tests

`src/tests/orderFlow.test.ts` · `src/tests/coinRulesP2.test.ts` (default OFF)
