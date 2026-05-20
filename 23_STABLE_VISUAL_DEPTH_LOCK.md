# 23 · STABLE_VISUAL_DEPTH_LOCK

**Stable:** `STABLE_23_VISUAL_DEPTH_V1`  
**Prior stable:** `STABLE_23_PRO_WORKFLOW_V1`  
**Date:** 2026-05-19  
**Policy:** 기능 추가 중단 · Visual depth UI 동결 (engine unchanged)

---

## Included in this stable

| Layer | Content |
|-------|---------|
| Engine / orders | `STABLE_23_PRO_WORKFLOW_V1` baseline — no engine changes |
| **Visual depth** | DOM heatmap, cum bar, iceberg mock, agg pulse, spread flash, walls, vol animation |
| **Velocity ticker** | VEL / SP / buy·sell pulse |
| **Modes** | normal · volatile (panic) · ultra-dom (μDOM) |
| **Prefs** | `tether23.visual_depth_v1` |

---

## Recommended git

```bash
git tag -a STABLE_23_VISUAL_DEPTH_V1 -m "23 Speed Order V2 visual depth QA lock"
# commit message:
# chore(23): QA lock STABLE_23_VISUAL_DEPTH_V1
```

---

## Automated gate (required before tag)

```bash
npm run lint    # PASS
npm run build   # PASS
npm run test    # PASS — 84 tests
npm run smoke   # PASS — 25 lock scenarios + stable assertion
```

---

## Test inventory (fixed at lock)

| Suite | File | Count |
|-------|------|-------|
| Unit + integration | `src/tests/*.test.ts` | 84 |
| Smoke / QA lock | `src/tests/smoke.test.ts` | 25 |
| Visual depth unit | `visualDepth.test.ts` | 4 |

---

## Forbidden until next phase

- New trading or visual features
- Engine hedge rule changes
- WebSocket / live depth feed
- Editing this stable without new tag

---

## Docs index

- [23_PHASE_VISUAL_DEPTH_ENGINE.md](./23_PHASE_VISUAL_DEPTH_ENGINE.md)
- [23_QA_CHECKLIST.md](./23_QA_CHECKLIST.md)
