# PHASE — P5 통합·동결 (4상품 mock)

**Status:** COMPLETE  
**Date:** 2026-05-20  
**Stable tag:** `STABLE_23_MOCK_V1`  
**Prior stable:** `STABLE_23_COIN_MOCK_V1`

## Scope

- COIN → OVERSEAS → US → KR 전환 스모크 + 회귀
- Theme1 / Theme2 / popup / detach 회귀
- `STABLE_23_MOCK_V1` QA lock · mock HTS 기능 동결 후보

## Gate A

```bash
npm run lint && npm run build && npm run test && npm run smoke
```

## Files

| Path | Role |
|------|------|
| `src/tests/mockIntegrationP5.test.ts` | P5 통합 (9) |
| `src/workspace/stableTag.ts` | `STABLE_23_CURRENT` → `STABLE_23_MOCK_V1` |
| `23_STABLE_MOCK_V1_LOCK.md` | QA lock |
| `23_QA_CHECKLIST.md` | P5 sign-off |

## Post-freeze (백로그)

- 4상품 호가 STOP 열 = 코인 UX 통일 (`23_ENGINE_RULES.md` §6b)
- 분양 스킨만 · 신기능 → 24번
