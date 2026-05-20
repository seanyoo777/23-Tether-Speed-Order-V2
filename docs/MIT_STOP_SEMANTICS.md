# MIT · STOP — Unified semantics (23 mock)

**Product rule (owner):** MIT and STOP are the **same** conditional order family.

- Use: **breakout (돌파)**, **stop-loss**, **take-profit** — purpose is set by context (open / close / protection), not by kind name.
- **Breakout:** up and down use the **same** trigger rule (price reaches the line from either side).
- **Trigger price:** fixed at registration (book click or manual). No auto-follow.

## Trigger rule (mock engine)

`shouldFillMitStopAtPrice(trigger, last, prev, tick)`:

1. **Touch** — `|last - trigger| <= tick/2`
2. **Cross** — `prev` and `last` straddle `trigger` (상·하 동일)

Applies to both `kind: 'MIT'` and `kind: 'STOP'`.

## UI

- Book **STOP column** → registers conditional (stored as MIT or STOP, same engine).
- **PROTECTION_TP / SL** — separate protection engine (tick-based from position).
