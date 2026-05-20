# 23 · Engine Rules (canonical)

> 코드와 충돈 시 **본 문서가 우선**한다. 22번 복사 금지.

**제품명:** **테데HTS1** (Tede HTS1) — 동결·분양·24번: `docs/TEDE_HTS1_PRODUCT_POLICY.md`

## 1. 상품

**기본 상품 (확정):** 국내선물 · 해외선물 · 해외주식 · 국내주식 · 코인 · 옵션 — `docs/FIVE_PRODUCT_BASELINE.md`

| # | 한글 | ProductType | mock |
|---|------|-------------|------|
| 1 | 국내선물 | `KOREA_FUTURES` | ✅ KOSPI200F (P6) |
| 2 | 해외선물 | `OVERSEAS_FUTURES` | ✅ ESZ6 (P3) |
| 3 | 해외주식 | `US_STOCK` | ✅ AAPL (P4) |
| 4 | 국내주식 | `KOREA_STOCK` | ✅ 005930 (P4) |
| 5 | 코인 | `COIN_FUTURES` | ✅ (P2) |
| 6 | 옵션 | `COIN_OPTIONS` | ✅ BTC_97000_C (P6) |

**동결:** `STABLE_23_MOCK_V1` · P6 기본 툴 완료 · **24번** = 실연동·대형 신기능

### 해외선물 ESZ6

| Symbol | 기본가 | tick | multiplier |
|--------|--------|------|------------|
| ESZ6 | 5800 | 0.25 | 50 (adapter PnL) |

원웨이만 · 헷지 토글 없음 · 코인과 동일 주문창/호가 UX

### 해외주식 AAPL

| Symbol | 기본가 | tick | multiplier |
|--------|--------|------|------------|
| AAPL | 190 | 0.01 | 1 |

원웨이만 · 호가 STOP 열 = 코인 동일 (`mitEnabled` + `stopEnabled`) · §6b 완료

### 국내주식 005930

| Symbol | 기본가 | tick | multiplier |
|--------|--------|------|------------|
| 005930 | 58000 | 100 | 1 |

원웨이만 · KRX 호가단위 100 · `shortEnabled` registry false (mock 체결은 one-way flip 규칙) · 호가 STOP 열 = 코인 동일 (§6b)

### 국내선물 KOSPI200F

| Symbol | 기본가 | tick | multiplier |
|--------|--------|------|------------|
| KOSPI200F | 385.5 | 0.05 | 250000 (adapter PnL) |

원웨이만 · 호가 STOP = 코인 동일

### 옵션 BTC_97000_C

| Symbol | 기본가 | tick | multiplier |
|--------|--------|------|------------|
| BTC_97000_C | 850 | 0.5 | 1 |

원웨이만 · 코인 옵션 mock · 호가 STOP = 코인 동일

### 코인선물 심볼

| Symbol | 기본가 | tick |
|--------|--------|------|
| BTCUSDT | 97420 | 0.5 |
| ETHUSDT | 3480 | 0.05 |
| SOLUSDT | 172 | 0.01 |

`sharedOrderQty` 기본 **0.05** — 주문창·호가·MIT/STOP·청산 비율 공통.

---

## 2. 포지션 모드 (`docs/POSITION_MODE.md`)

| ProductType | 기본 | 헷지 토글 |
|-------------|------|-----------|
| COIN_FUTURES | **One-way** | ON 시 **Hedge** |
| OVERSEAS_FUTURES / US_STOCK / KOREA_STOCK | **One-way** | 없음 |

### 2a. Hedge — 코인 + `hedgeMode` ON

- LONG/SHORT **동시 보유**, netting 금지
- **positionId** = `productType:symbol:side:createdAt`
- **매수전환**: 오른쪽 `order-right`만 → LONG 신규
- **매도전환**: 왼쪽 `order-left`만 → SHORT 신규
- 반대 칸 클릭 → 차단 + 고정 안내
- 반대 호가로 청산/반대 진입 **금지**
- 헷지 4버튼 (`hedgeOpenLeg` / `hedgeCloseLeg`) **코인만**

### 2b. One-way — 코인(기본)·해외선물·주식 등

- 심볼당 롱 **또는** 숏 (동시 보유 불가)
- 반대 주문: `청산 = min(주문수량, 반대보유)` → **잔량**만 새 방향 체결
- **선물 예:** 매수 20 → 매도 10 ⇒ 10청산, **최종 매수 10**
- **주식 예:** 삼성 100주 매수 → 130주 매도 ⇒ **100주 청산 + 30주 매도** 체결
- 구현: `fillOneWayLeg` — `docs/POSITION_MODE.md`
- 헷지 4버튼 **없음**

---

## 3. 청산

- **포지션 행 버튼** (25/50/75/100%)
- **Hedge(코인)**: LONG 청산 시 SHORT 유지
- **One-way**: 해당 방향 레그만 감소
- Hedge 코인: 호가 반대 클릭 청산 **금지**

---

## 4. 호가창

7열: STOP | 주문 | 매도잔량 | 가격 | 매수잔량 | 주문 | STOP  
31줄 (현재가 ±15), 현재가 강조, 호가고정, 현재가 버튼.  
상단 **sharedOrderQty** 표시 = 체결 수량과 일치.

---

## 5. Mock Ticker

- `manualTick(symbol, price)` 필수 (테스트)
- auto tick: interval (기본 1000ms), deterministic walk
- MIT/STOP·평가손익은 **lastPrice** 기준
- WebSocket / 거래소 API **금지**

---

## 6. MIT / STOP

- pending → lastPrice 조건 충족 → filled → 포지션 반영
- MIT LONG: trigger > ref → `last >= trigger`
- MIT SHORT: trigger < ref → `last <= trigger`
- 호가 클릭 가격 = trigger (임의 가격 금지)
- 종목/전체 취소 API: `cancelAllStop`, `cancelAllOrders`

### 6b. 상품 간 호가 MIT/STOP (완료 · 2026-05-20)

| 항목 | 정책 |
|------|------|
| **4상품** | COIN · ESZ6 · AAPL · 005930 — 호가 STOP 열 클릭 → MIT 등록 (코인과 동일) |
| **엔진** | `mitStopEngine` · 원웨이 · `registerMit` / `processTick` 동일 |
| **테스트** | `bookMitUnifyPostFreeze.test.ts` |
| **헷지** | 해외·주식 — 헷지 토글 없음 (변경 없음) |

---

## 7. 자동익절/손절

- **선택 포지션** 없으면 등록 금지
- LONG: TP = 평단 + tick×익절틱, SL = 평단 − tick×손절틱
- SHORT: 반대
- 25/50/75/100% 보호 수량
- 조건 도달 시 mock close

---

## 8. 금지 (전 Phase)

- 22번 소스 복붙
- 실거래·브로커 API·온체인
- TGX-CEX (`02`) 연결
- uncontrolled realtime loop

---

## 9. 테데HTS1 · 동결·분양 (확정)

> 전문: `docs/TEDE_HTS1_PRODUCT_POLICY.md`

| 구분 | 규칙 |
|------|------|
| **23 (테데HTS1)** | 기능·엔진 완성 후 **동결** — 이후 버그 수정·스킨만 |
| **분양** | 색·위치·로고·레이아웃 preset·브랜드 문구만 — **동일 동작 100%** |
| **24+** | 신규 기능·연동 — 23에 기능 추가 **금지** |
| **테마** | Shell/ CSS만 — `tradingSession`·주문 규칙 테마별 복사 **금지** |

동결 태그 후보: `STABLE_TEDE_HTS1_V1` (P2 Gate 통과 후).

---

## 10. 코드 매핑

| 규칙 | 모듈 |
|------|------|
| Hedge leg | `engine/hedgeEngine.ts` |
| Ladder fill | `engine/orderExecution.ts` |
| Session | `engine/tradingSession.ts` |
| Ticker | `engine/mockTicker.ts` |
| MIT | `engine/mitStopEngine.ts` |
| TP/SL | `engine/protectionEngine.ts` |
| PnL | `engine/pnlEngine.ts` |
| Audit | `engine/auditEngine.ts` |
| Coin adapter | `adapters/coinFuturesAdapter.ts` |
