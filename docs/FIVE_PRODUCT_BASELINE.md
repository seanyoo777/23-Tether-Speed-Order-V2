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

## 호가 STOP / MIT (23 동결)

| 열 | 역할 |
|----|------|
| 왼쪽 STOP | 예약 MIT · **무포지션** 돌파·추격 (전환 방향 연동) |
| 오른쪽 TP/SL | 보유 포지션 익절·손절 (**포지션 선택 필수**) |

상세·24 설계 선택지: **`docs/24_LADDER_STOP_UX.md`** (DRAFT · §追加 가능)

## 24번 (킥오프)

| 우선순위 | 범위 |
|----------|------|
| 1 | 호가 STOP UX — **양쪽 STOP** vs **진입 후 3종만** (`24_LADDER_STOP_UX.md` DEC-001~003) |
| 2 | 국내선물 UI — 선물｜옵션 하위 탭 |
| 3 | 실 API · WebSocket · 심볼 대량 · 신규 주문 유형 |

23 = mock baseline·버그·스킨만 · 검증 후 24 Phase K0→K5 (`24_LADDER_STOP_UX.md` §3)
