# QA Lock — `STABLE_23_COIN_MOCK_V1`

**Date:** 2026-05-20  
**Phase:** P2 코인 규칙 완결  
**Prior stable:** `STABLE_23_VISUAL_DEPTH_V1`

## Frozen scope (coin)

- One-way · hedge exchange · panel 시장가/지정가 · 호가 클릭
- MIT ≡ STOP · TP/SL · OCO · cancel paths
- Order flow: **default OFF**

## Gate (required)

```bash
npm run lint && npm run build && npm run test && npm run smoke
```

## Tag

```text
git tag -a STABLE_23_COIN_MOCK_V1 -m "23 P2 coin mock rules lock"
```

## Regression suites

- `coinRulesP2.test.ts`
- `coinOneWayPrimary.test.ts` · `coinOrderPanel.test.ts`
- `hedgeExchangeFill.test.ts` · `mitStopEngine.test.ts` · `protectionBook.test.ts`
