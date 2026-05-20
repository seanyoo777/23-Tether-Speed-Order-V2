# 23 · 단독 개발 스케줄 (MOCK · 이관 없음)

**제품명:** **테데HTS1** (Tede HTS1)  
**목표:** `23-Tether Speed Order V2` 안에서만 안전·견고하게 완성 → **기능 동결** 후 분양은 스킨만.  
**정책:** `23_ENGINE_RULES.md` · `docs/TEDE_HTS1_PRODUCT_POLICY.md` 우선 · MOCK ONLY · 02-TGX-CEX **보류** · 신기능은 **24번**  
**업데이트:** 2026-05-20

---

## 0. 안전 개발 원칙 (매일)

| # | 원칙 |
|---|------|
| 1 | 규칙 변경 시 **문서 먼저** (`23_ENGINE_RULES.md`, `docs/POSITION_MODE.md` 등) |
| 2 | 엔진 변경 시 **테스트 먼저** 또는 같은 PR에 테스트 추가 |
| 3 | UI만 바꿀 때도 **회귀 게이트** 필수 (아래 Gate A) |
| 4 | Phase 끝날 때 **QA 체크리스트 + 검증 보고** (`23_VERIFICATION_REPORTS.md`) |
| 5 | 실 API / WebSocket / 02 import **금지** (`AGENTS.md`) |
| 6 | **Gate 실패 시 즉시 중단** — 원인 수정 후 같은 Phase만 재개 |
| 7 | 동결 후·분양: `docs/TEDE_HTS1_PRODUCT_POLICY.md` — 23에 **신기능 PR 금지** |

### Gate A — merge·Phase 완료 전 (필수)

```bash
cd "23-Tether Speed Order V2"
npm run lint && npm run build && npm run test && npm run smoke
```

### Gate B — 수동 QA (코인·헷지 Phase마다)

`23_MANUAL_QA_COIN.md` 시나리오 전부 체크.

---

## 1. 로드맵 (8주 · 여유 있게)

| Phase | 기간 | 범위 | 산출물 |
|-------|------|------|--------|
| **P0** | 완료 | 기반 잠금 | 엔진·워크스페이스·비주얼 depth·현실적 체결(mock) |
| **P1** | 1주 | **코인 mock 안정화** | 문서 동기화, 수동 QA, 헷지/청산주문/원웨이 회귀 0 |
| **P2** | 2주 | **코인 규칙 완결** | MIT≡STOP, TP/SL, 보호주문, 테스트·QA lock |
| **P3** | 2주 | **해외선물 mock** | ESZ6 엔진·원웨이·호가 (헷지 없음) |
| **P4** | 2주 | **주식 mock (UI+규칙)** | US/KR 원웨이, «준비중» 제거, 주문 금지 없이 mock |
| **P5** | 1주 | **통합·동결** | 전 상품 회귀, `STABLE_23_MOCK_V1` 태그 후보 |

> 일정은 **Phase Gate 통과 후** 다음 주로 넘깁니다. 실패 시 해당 Phase 연장.

---

## 2. Phase 상세

### P1 — 코인 mock 안정화 (1주)

**할 일**

- [x] **P1-①** `docs/POSITION_MODE.md` — 청산주문·헷지·취소·시장체결
- [x] **P1-①** `23_QA_CHECKLIST.md` / `AGENTS.md` — test 146 / smoke 28
- [x] **P1-①** `23_MANUAL_QA_COIN.md` §F 취소 시나리오
- [x] **P1-②** DIAG MIT 트리거 (`MitTriggerDiag` + `` ` `` diag)
- [x] **P1-③** 원웨이 회귀 테스트 + `docs/ONE_WAY_PRIMARY.md`
- [x] **P1-④** `23_PROJECT_STATUS.md` · `MASTER_MANUAL` 갱신
- [x] **P1-④b** `docs/HQ_REPORTING.md` · HQ registry id 23 · `LAST_SESSION_REPORT.md`
- [x] **P1-⑤** `23_MANUAL_QA_COIN.md` — 사용자 확인 (주문·취소)
- [ ] 깨진 한글·aria-label 전수 점검 (필요 시만)

**하지 않을 것**

- 02 연동, WebSocket, 새 상품 대량 추가

**검증 보고:** `VR-001` (P1)

---

### P2 — 코인 규칙 완결 (2주)

**할 일**

- [x] `oneWayFill` / `hedgeExchangeFill` 엣지 — `coinRulesP2.test.ts`
- [x] MIT/STOP 트리거·드래그·호가 — P2 자동 회귀
- [x] `docs/ORDER_FLOW_PREFS.md` (기본 OFF)
- [x] `STABLE_23_COIN_MOCK_V1` · `23_STABLE_COIN_MOCK_LOCK.md`

**검증 보고:** `VR-002` (P2)

---

### P3 — 해외선물 mock (2주)

**할 일**

- [x] `OVERSEAS_FUTURES` + ESZ6 — `isProductEngineReady` true
- [x] tick/lot/PnL `productAdapter` → `pnlEngine` (ESZ6)
- [x] 원웨이만 — 헷지 토글 없음
- [x] `overseasFuturesP3.test.ts` 회귀

**검증 보고:** `VR-003` (P3)

---

### P4 — 주식 mock (2주)

**할 일**

- [x] `US_STOCK` / `KOREA_STOCK` 심볼·mock ticker (AAPL · 005930)
- [x] 원웨이 체결·호가 (코인과 동일 규칙, 헷지 없음)
- [x] 워치리스트·상품 전환 — `stockMockP4.test.ts`

**검증 보고:** `VR-004` (P4) ✅

**Next:** P5

---

### P5 — 통합·동결 (1주)

**할 일**

- [x] 4상품 전환 스모크 (COIN → OVERSEAS → US → KR)
- [x] Theme1 / Theme2 / popup / detach 회귀 — `mockIntegrationP5.test.ts`
- [x] `23_QA_CHECKLIST.md` 최종판
- [x] `STABLE_23_MOCK_V1` 태그 + `23_STABLE_MOCK_V1_LOCK.md`

**동결 후 (완료):** §6b 호가 STOP 4상품 통일 — `bookMitUnifyPostFreeze.test.ts` · `23_ENGINE_RULES.md` §6b

**검증 보고:** `VR-005` (P5) ✅ · **mock HTS 기능 동결 후보**

---

## 3. 중간 검증 보고 일정

| 보고 ID | 시점 | 내용 |
|---------|------|------|
| **VR-000** | 지금 | 기준선 (Baseline) |
| **VR-001** | P1 종료 | 코인 수동 QA + Gate A |
| **VR-002** | P2 종료 | 코인 규칙·테스트 lock |
| **VR-003** | P3 종료 | 해외선물 mock |
| **VR-004** | P4 종료 | 주식 mock |
| **VR-005** | P5 종료 | 전체 mock HTS 동결 |

상세 기록: **`23_VERIFICATION_REPORTS.md`**

---

## 4. 완성도 추적 (mock HTS 기준)

| 시점 | COIN | OVERSEAS | US/KR | 전체 mock |
|------|------|----------|-------|-----------|
| VR-000 (현재) | ~70% | ~20% | ~10% | ~55% |
| VR-002 목표 | ~90% | — | — | ~65% |
| VR-005 목표 | ~95% | ~80% | ~75% | ~85% |

*실전(실거래) %는 이 스케줄 범위 밖.*

---

## 5. 리스크 · 연장 조건

- Gate A 실패 → 해당 Phase **완료 처리 금지**
- `23_ENGINE_RULES.md`와 코드 불일치 발견 → 문서 수정 후 재검증
- 대규모 UI 리라이트 → 별도 Phase로 분리 (한 Phase에 엔진+UI 동시 대변경 금지)

---

*이관(02)은 VR-005 이후 별도 로드맵으로만 검토.*
