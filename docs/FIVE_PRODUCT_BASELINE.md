# 테데HTS1 · 기본 상품 (23 mock)

**확정:** 2026-05-20

## UI 탭 순서

| # | 한글 | ProductType | 심볼 (mock) | P6 |
|---|------|-------------|-------------|-----|
| 1 | **국내선물** | `KOREA_FUTURES` | KOSPI200F | ✅ |
| 2 | **해외선물** | `OVERSEAS_FUTURES` | ESZ6 | ✅ |
| 3 | **해외주식** | `US_STOCK` | AAPL | ✅ |
| 4 | **국내주식** | `KOREA_STOCK` | 005930 | ✅ |
| 5 | **코인** | `COIN_FUTURES` | BTC/ETH/SOL | ✅ |
| 6 | **옵션** | `COIN_OPTIONS` | BTC_97000_C | ✅ |

거래 방식: **2~6 원웨이** (코인만 헷지 선택) · 주문창·호가·MIT/STOP 동일 엔진.

## 24번

실 API · WebSocket · 02-TGX · 대량 심볼 · 신규 주문 유형 → **24번** (`docs/TEDE_HTS1_PRODUCT_POLICY.md`)

## 테스트

- `koreaFuturesCoinOptionsP6.test.ts`
- `mockIntegrationP5.test.ts` (6상품 cycle)
