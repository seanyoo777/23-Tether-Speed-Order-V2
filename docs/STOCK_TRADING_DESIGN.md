# 국내·해외 주식 — 사전 설계 (미구현)

**Status:** Planning only.  
**Position mode:** **One-way** (코인만 hedge — `docs/POSITION_MODE.md`).

---

## 1. 상품 정책

| 항목 | 주식 (국내·해외) |
|------|------------------|
| 포지션 모드 | **원웨이** — 심볼당 롱 또는 숏 하나 |
| 헷지 4버튼 | **없음** (코인선물 전용) |
| 양방향 거래 | 가능 (숏 포함) — 단, **동시 롱+숏 보유 불가** |
| 청산 | 반대매매: 예) 100주 매수 후 130주 매도 → **100주 청산 + 30주 매도** (`fillOneWayLeg`) |
| 레버리지 | 최대 **125×** (구현 시 `maxLeverage`) |

주문 UX는 **주식 주문**에 가깝게, 엔진은 **원웨이 선물형**(반대 체결 시 청산) — 일반 HTS처럼 매도=롱청산이 아니라, **원웨이 규칙으로 반대 레그부터 정리**.

---

## 2. 코인과의 차이

| | 코인 (Hedge) | 주식·기타 (One-way) |
|--|--------------|---------------------|
| 롱+숏 동시 | 가능 | 불가 |
| 헷지 패널 | 있음 | 없음 |
| 호가 반대 칸 | 진입 차단 | 매도전환 시 숏(반대) 체결 → 기존 롱 청산 후 전환 |

---

## 3. 구현 체크리스트 (S1 이후)

- [ ] `ENGINE_SYMBOLS_BY_PRODUCT` 시드 (`005930`, `AAPL` …)
- [ ] `hedgeEnabled: false` (registry 유지)
- [ ] `maxLeverage: 125`, `shortEnabled: true` (국내 포함)
- [ ] KRX 호가단위 — `koreaStockAdapter`
- [ ] one-way ladder / MIT — `fillOneWayLeg` 재사용

---

## 4. 관련 문서

- `docs/POSITION_MODE.md`
- `docs/MIT_STOP_SEMANTICS.md`
- `23_ENGINE_RULES.md` — §2 hedge는 코인만
