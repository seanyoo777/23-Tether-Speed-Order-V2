# 테데HTS1 · 5대 상품 기준 (확정)

**확정:** 2026-05-20

## UI 상품 탭 (5개)

| # | 한글 | ProductType | 비고 |
|---|------|-------------|------|
| 1 | **국내선물** | `KOREA_FUTURES` | 선물 + **국내 옵션** (한 탭) |
| 2 | **해외선물** | `OVERSEAS_FUTURES` | ESZ6 |
| 3 | **해외주식** | `US_STOCK` | AAPL |
| 4 | **국내주식** | `KOREA_STOCK` | 005930 |
| 5 | **코인** | `COIN_FUTURES` | BTC/ETH/SOL |

## 국내선물 심볼 (mock)

### 선물 (`kr_future`)

| Symbol | 표시명 |
|--------|--------|
| KOSPI200F | KOSPI200 선물 |
| KOSPI200FM | KOSPI200 미니선물 |
| USDF | 달러선물 |
| KTB03F | 국채 3년 선물 |

### 옵션 (`option` — 국내선물 탭 안)

| Symbol | 표시명 |
|--------|--------|
| K200W | KOSPI200 **위클리**옵션 |
| K200WM | KOSPI200 **위클리먼데이** |
| K200M | KOSPI200 **월물**옵션 |

거래 규칙: 다른 상품과 동일 **원웨이** · 주문창·호가·MIT/STOP 동일 엔진.

## 24번

실 API · WebSocket · 심볼 대량 추가 · 신규 주문 유형 → **24번**
