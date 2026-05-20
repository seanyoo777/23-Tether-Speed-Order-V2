# QA Lock — `STABLE_23_MOCK_V1`

**Date:** 2026-05-20  
**Phase:** P5 통합·동결 (4상품 mock HTS)  
**Prior stable:** `STABLE_23_COIN_MOCK_V1`

## Frozen scope (mock HTS · 테데HTS1)

| Product | Symbols | Mode |
|---------|---------|------|
| COIN_FUTURES | BTC/ETH/SOL | One-way default · hedge optional |
| OVERSEAS_FUTURES | ESZ6 | One-way |
| US_STOCK | AAPL | One-way |
| KOREA_STOCK | 005930 | One-way |

- Panel 시장가/지정가 · 호가 클릭 · MIT/STOP 엔진 (원웨이 동일)
- 해외·주식: 호가 STOP **등록**만 P4 임시 비활성 (`23_ENGINE_RULES.md` §6b)
- Theme1/2 · workspace · popup · detach
- Order flow: **default OFF**
- **신기능 PR 금지** — `docs/TEDE_HTS1_PRODUCT_POLICY.md`

## Gate (required)

```bash
npm run lint && npm run build && npm run test && npm run smoke
```

## Tag

```text
git tag -a STABLE_23_MOCK_V1 -m "23 P5 four-product mock HTS freeze"
```

## Regression suites

- `mockIntegrationP5.test.ts` — 4상품 전환 · theme/popup
- `bookMitUnifyPostFreeze.test.ts` — §6b 호가 STOP 4상품
- `coinRulesP2.test.ts` · `coinOneWayPrimary.test.ts`
- `overseasFuturesP3.test.ts` · `stockMockP4.test.ts`
- `workspaceOrderAccuracy.test.ts` · `theme2OrderAccuracy.test.ts`
- `smoke.test.ts` — stable tag + product chain
