# 23 · QA Checklist — 테데HTS1

**Current phase:** P5 통합·동결 ✅  
**Stable tag:** `STABLE_23_MOCK_V1`  
**Prior stable:** `STABLE_23_COIN_MOCK_V1`  
**Lock:** `23_STABLE_MOCK_V1_LOCK.md`  
**HQ 보고:** `docs/HQ_REPORTING.md`  
**Automated:** `npm run test` (197) · `npm run smoke` (34)

---

## Build gate

| Check | Auto | Result |
|-------|------|--------|
| `npm run lint` | — | PASS |
| `npm run build` | — | PASS |
| `npm run test` | vitest | PASS (197) |
| `npm run smoke` | vitest | PASS (34) |

---

## P5 — 4상품 mock (automated)

**Suite:** `mockIntegrationP5.test.ts` (10) · smoke `four-product switch`

| ID | Scenario | Auto | Result |
|----|----------|------|--------|
| P5-A | COIN → OVERSEAS → US → KR panel + symbol | ✅ test | PASS |
| P5-B | Reverse cycle · coin hedge restore | ✅ test | PASS |
| P5-C | Ladder per product (one-way) | ✅ test | PASS |
| P5-D | Coin MIT after full cycle | ✅ test | PASS |
| P5-E | Theme2 detached · floating-ladder | ✅ test | PASS |
| P5-F | Popup URL · theme storage | ✅ test | PASS |
| P5-G | Smoke product chain | ✅ smoke | PASS |

---

## P1–P4 regression (frozen)

| Phase | Suite | Result |
|-------|-------|--------|
| P1 one-way | `coinOneWayPrimary.test.ts` | PASS |
| P2 coin rules | `coinRulesP2.test.ts` | PASS |
| P3 overseas | `overseasFuturesP3.test.ts` | PASS |
| P4 stocks | `stockMockP4.test.ts` | PASS |
| Workspace | `workspaceOrderAccuracy` · `theme2OrderAccuracy` | PASS |
| Visual depth | `visualDepth.test.ts` · smoke V1–V2 | PASS |
| Pro workflow | `proWorkflow.test.ts` | PASS |

---

## P1 — Gate B (manual · optional)

`23_MANUAL_QA_COIN.md` — 코인 수동 QA (사용자 확인 완료 핵심 시나리오)

---

## Post-freeze backlog

- 4상품 호가 STOP 열 = 코인 UX (`23_ENGINE_RULES.md` §6b)
- 분양: 스킨만 · 신기능 → **24번**

---

## Sign-off — `STABLE_23_MOCK_V1`

| Role | Gate | Notes |
|------|------|-------|
| Dev | lint/build/test/smoke | 197 / 34 |
| Release | Tag `STABLE_23_MOCK_V1` | `23_STABLE_MOCK_V1_LOCK.md` |

```text
git tag -a STABLE_23_MOCK_V1 -m "23 P5 four-product mock HTS freeze"
```

*기능 추가 PR은 동결 정책(`docs/TEDE_HTS1_PRODUCT_POLICY.md`)에 따라 24번으로.*
