# 23 · Phase Report — QA Lock (`STABLE_23_PRO_TRADER_V1`)

**Date:** 2026-05-19  
**Status:** **FROZEN BASELINE** — 기능 추가 중단  
**Tag / commit name:** `STABLE_23_PRO_TRADER_V1`  
**Suggested commit:** `chore(23): QA lock STABLE_23_PRO_TRADER_V1`

---

## 1. QA Lock scope

| # | Task | Done |
|---|------|------|
| 1 | `23_PHASE_REPORT.md` 최종 업데이트 | ✅ |
| 2 | `23_PROJECT_STATUS.md` 업데이트 | ✅ |
| 3 | `23_QA_CHECKLIST.md` 수동 검증 칸 추가 | ✅ |
| 4 | `STABLE_23_PRO_TRADER_V1` 태그/커밋명 기록 | ✅ |
| 5 | 핵심 시나리오 smoke 강화 | ✅ |

**금지 준수:** 새 기능 없음 · UI 대수정 없음 · 엔진 변경 없음

---

## 2. Smoke 강화 (`src/tests/smoke.test.ts`)

| Scenario | Coverage |
|----------|----------|
| 매수전환 + 오른쪽 = LONG | `placeLadderOrder('order-right')` |
| 매수전환 + 왼쪽 = 차단 | `validateLadderDirection` + `fillLadderLimit` reject |
| 매도전환 + 왼쪽 = SHORT | `placeLadderOrder('order-left')` |
| 매도전환 + 오른쪽 = 차단 | `validateLadderDirection` + reject |
| sharedOrderQty +0.05 | session state |
| LONG 50% 청산, SHORT 유지 | `closePosition` 50% |
| MIT marker | `registerMit` + `markersForSymbol` |
| 미체결 취소 / 전체취소 | `cancelOrder` / `cancelAllOrders` |
| 호가고정 ON/OFF | `buildLadderRows` pinned vs follow |
| 원클릭 OFF 2회 체결 | engine-equivalent double `placeLadderOrder` |
| self-test + dist | existing gates |

**Manual-only (문서 M1–M10):** 원클릭 OFF glow UI, F1/F2 CSS, wheel, middle-click, quick-close overlay, tape animation, risk glow CSS.

---

## 3. Phase history (cumulative)

| Phase | Summary |
|-------|---------|
| 0–6 | Rule-first engine + HTS shell |
| HTS UX | 12/63/25 layout, mock depth, neon ladder |
| Trading Feel | Click delay, tape, keyboard Q/A, toast |
| Pro Trader | One-click modes, pin, speed qty, markers, status bar |
| **QA Lock** | Freeze + smoke + docs |

---

## 4. Test results (lock gate)

```text
npm run lint   → PASS
npm run build  → PASS
npm run test   → PASS (all vitest files)
npm run smoke  → PASS (build + smoke.test.ts, 17+ assertions)
```

Run locally after any doc-only change to confirm gates still green.

---

## 5. Baseline capabilities (frozen)

- **Product:** COIN_FUTURES live mock; others «준비중»
- **Engine:** Hedge legs, ladder direction lock, MIT/STOP, protection, audit
- **UI:** 7-col ladder, pro trader toolbar, dock tabs, diagnostics float
- **No:** TGX, WebSocket, real API, chart, 22번 code copy

---

## 6. 미구현 (unchanged at lock)

- Overseas / US / Korea adapters
- Real order book depth feed
- One-way margin
- Monorepo CI wiring
- Chart panel

---

## 7. 수동 검증 방법

1. `npm run dev` → http://localhost:5123  
2. `23_QA_CHECKLIST.md` **Manual M1–M10** 체크  
3. Lock scenarios L1–L14는 `npm run smoke`로 자동 확인  

---

## 8. 남은 위험

| Risk | Severity | Mitigation |
|------|----------|------------|
| UI-only confirm flow | Low | Manual M1 each release |
| Auto demo tick in dev | Low | Documented; mock only |
| MIT ref price semantics | Low | Engine doc + smoke marker test |

---

## 9. 다음 작업 (post-lock only)

1. Git tag: `STABLE_23_PRO_TRADER_V1` on passing commit  
2. New features → new branch + new Phase report  
3. Optional: GitHub Actions running `lint` / `test` / `smoke`  

---

*23번은 22번 복구가 아닌 규칙 기반 기준본이다. QA Lock 이후 변경은 엔진 규칙 문서 갱신 + 전체 gate 필수.*
