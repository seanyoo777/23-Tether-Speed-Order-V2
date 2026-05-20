# 23 · 테데HTS1 — P6 세션 보고 (2026-05-20)

**Phase:** P6 국내선물 baseline (선물+옵션, 5탭)  
**Stable tag:** `STABLE_23_MOCK_V1` (유지 · P6는 baseline 확장)

---

## Gate A — PASS

| Check | Result |
|-------|--------|
| lint | PASS |
| build | PASS |
| test | PASS (**212**) |
| smoke | PASS (**36**) |

---

## Delivered

- **5탭 확정** — 옵션 별도 탭 제거 · `COIN_OPTIONS` / `BTC_97000_C` 제거
- **국내선물** — 선물 4 (KOSPI200F, KOSPI200FM, USDF, KTB03F) + 옵션 3 (K200W, K200WM, K200M)
- `koreaFuturesDomesticP6.test.ts` · `docs/FIVE_PRODUCT_BASELINE.md`
- UI: 국내선물 탭 → 아래 심볼 버튼 7개 (선물/옵션 UI 분리는 **24번**)

---

## Frozen (mock HTS · 5상품)

| Product | Symbols |
|---------|---------|
| KOREA_FUTURES | 선물 4 + 옵션 3 (한 탭) |
| OVERSEAS_FUTURES | ESZ6 |
| US_STOCK | AAPL |
| KOREA_STOCK | 005930 |
| COIN_FUTURES | BTC/ETH/SOL |

---

## Manual QA (국내선물)

- [ ] 국내선물 → KOSPI200F 주문·호가 STOP
- [ ] K200W / K200WM / K200M 각 1회
- 사용자 서명: ___________

---

## Next

- **23:** 동결 유지 — 버그·스킨만
- **24:** 국내선물 선물｜옵션 UI · 실연동·신기능
