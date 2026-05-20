# 23 · 중간 검증 보고

형식: Phase 종료 시 한 블록 추가. **이관·실거래 범위 없음.**

---

## VR-000 — Baseline (2026-05-20)

**범위:** P0 완료 직후 · 헷지 UI(청산주문 바, 호가 하단 시장체결) 반영 후

### Gate A (자동)

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ PASS |
| `npm run build` | ✅ PASS |
| `npm run test` | ✅ PASS (134) |
| `npm run smoke` | ✅ PASS (27) |

### 기능 기준선

| 영역 | 상태 |
|------|------|
| COIN_FUTURES mock | ✅ 동작 (BTC/ETH/SOL) |
| 원웨이 체결 | ✅ `oneWayFill` + 테스트 |
| 헷지 (코인) | ✅ exchange fill + 청산주문 모드 |
| MIT ≡ STOP | ✅ 문서·엔진 정렬 |
| OVERSEAS / 주식 | ⏳ UI·준비중 (ESZ6 스펙만) |
| 02 / WebSocket / 실거래 | 🚫 범위 외 (의도적) |

### 완성도 (mock HTS)

| | % |
|--|---|
| 코인 | ~70 |
| 전체 mock | ~55 |

### 알려진 이슈 / 부채

- (해소) gate 수 — test **146** · smoke **28** (`23_QA_CHECKLIST.md` 동기화)
- 수동 QA 시트(`23_MANUAL_QA_COIN.md`) P1에서 전량 실행 예정
- 주식·해외선물 엔진 미완

### 다음 Phase

**P1** — 코인 mock 안정화 (1주) → **VR-001**

---

## VR-001 — P1 코인 안정화 (코드 완료 · Gate B 대기)

### P1-① 문서 동기화 (2026-05-20) — ✅

- `docs/POSITION_MODE.md` — 헷지 체결·청산주문·시장체결·취소 안내
- `23_QA_CHECKLIST.md` · `AGENTS.md` — test 134 / smoke 27
- `23_MANUAL_QA_COIN.md` — §F 취소 시나리오
- **코드 변경 없음** · Gate A 재실행 예정

**사용자 확인:** 호가·주문 정상 (2026-05-20)

### P1-② MIT DIAG 트리거 (2026-05-20) — ✅

- `MitTriggerDiag.tsx` — DIAG 내 대기 MIT/STOP 목록 + **트리거** / 가격 **적용**
- `SpeedOrderPane` — `` ` `` 로 열리는 diag에 `session.manualTick` 연결
- Gate A: lint / test PASS

### P1-③ 원웨이 회귀 (2026-05-20) — ✅

- `docs/ONE_WAY_PRIMARY.md` — 원웨이 우선 정책
- `src/tests/coinOneWayPrimary.test.ts` — flip / MIT / STOP / TP·SL OCO / 상품 전환
- smoke: coin default `hedgeMode` false

### P1-④ HQ · 문서 (2026-05-20) — ✅

- `docs/HQ_REPORTING.md` — 20번 연동 절차
- `LAST_SESSION_REPORT.md` — import용 세션 보고
- `20-TetherTeam-HQ` registry **id 23** · doc path override
- `MASTER_CONTEXT.md` · `MASTER_MANUAL.md` §23 동기화

### P1-⑤ Gate B — 수동 QA (대기)

- [ ] `23_MANUAL_QA_COIN.md` A~F (`http://localhost:5123/`)
- [ ] VR-001 **CLOSED** · 코인 ~80% (Gate B 후)

**P1 Gate A (2026-05-20)** — ✅ test **146** · smoke **28**

### P1 산출물 맵

| HQ 역할 | 경로 |
|---------|------|
| 현황 한눈에 | `20-TetherTeam-HQ/MASTER_MANUAL.md` → 23-SpeedOrder-V2 |
| Import 보고 | `23-Tether Speed Order V2/LAST_SESSION_REPORT.md` |
| Phase 상세 | `23_PHASE_P1_COIN_MOCK_STABILIZATION.md` |
| 연동 안내 | `docs/HQ_REPORTING.md` |

---

## VR-002 — P2 코인 규칙 완결 (2026-05-20) — ✅

### Gate A

| Check | Result |
|-------|--------|
| lint / build / test / smoke | ✅ PASS (164 / 29) |

### Delivered

- `coinRulesP2.test.ts` (11) — one-way, hedge, MIT/STOP, flow default OFF
- `docs/ORDER_FLOW_PREFS.md`
- `STABLE_23_COIN_MOCK_V1` · `23_STABLE_COIN_MOCK_LOCK.md`

### Next

**P3** — 해외선물 mock

---

## VR-003 — P3 해외선물 (2026-05-20) — ✅

- `overseasFuturesP3.test.ts` (8)
- `pnlEngine` → `overseas_future` adapter for ESZ6
- Gate A: test 173 · smoke 30

**Next:** P4

---

## VR-004 — P4 주식 mock (2026-05-20) — ✅

- `stockMockP4.test.ts` (10) — AAPL panel/ladder, 005930 one-way flip, KRX tick, PnL
- `US_STOCK` / `KOREA_STOCK` in `ENGINE_SYMBOLS_BY_PRODUCT` · bridge · watchlist tradable
- `pnlEngine` — all non-`COIN_FUTURES` with core spec → adapter
- Gate A: test **185** · smoke **32**
- Stable tag unchanged: `STABLE_23_COIN_MOCK_V1`

**Next:** P5 — 4상품 통합 · `STABLE_23_MOCK_V1`

---

## VR-006 — Post-freeze §6b (2026-05-20) — ✅

- 호가 STOP 4상품 = 코인 (`bookMitUnifyPostFreeze.test.ts`)
- Gate: test **204** · smoke **34**
- 사용자: 주문·미국/국내 MIT 정상 · 이슈 없음

---

## VR-005 — P5 통합·동결 (2026-05-20) — ✅

- `mockIntegrationP5.test.ts` (10) — 4상품 전환 · coin MIT after cycle · theme/popup/detach
- `STABLE_23_MOCK_V1` · `STABLE_23_CURRENT` 갱신 · `23_STABLE_MOCK_V1_LOCK.md`
- Gate A: test **197** · smoke **34**
- **기능 동결 후보** — 신기능·호가 STOP 통일은 §6b 백로그

---
