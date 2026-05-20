# 23 · Tether Speed Order V2

한국 HTS식 **멀티상품 호가 주문창 V2** — 규칙 문서 우선, 엔진 검증 후 UI.

**5대 상품:** 국내선물(선물+옵션) · 해외선물 · 해외주식 · 국내주식 · 코인 — `docs/FIVE_PRODUCT_BASELINE.md`  
**P6** · stable `STABLE_23_MOCK_V1` · **24번** = 실연동·대형 신기능
상단 **THEME1 · TGX** / **THEME2 · Next** 버튼으로 전환

## 실행

```bash
cd "23-Tether Speed Order V2"
npm install
npm run dev      # http://localhost:5123
npm run build
npm run lint
npm run test
npm run smoke    # build + QA lock (STABLE_23_VISUAL_DEPTH_V1)
```

## 문서

| 파일 | 용도 |
|------|------|
| [23_ENGINE_RULES.md](./23_ENGINE_RULES.md) | 거래 규칙 (코드보다 우선) |
| [23_PROJECT_STATUS.md](./23_PROJECT_STATUS.md) | 완료/미완료/위험 |
| [23_QA_CHECKLIST.md](./23_QA_CHECKLIST.md) | 수동 검증 |
| [23_PHASE_REPORT.md](./23_PHASE_REPORT.md) | 작업 보고서 |
| [23_STABLE_VISUAL_DEPTH_LOCK.md](./23_STABLE_VISUAL_DEPTH_LOCK.md) | **현재 stable** |
| [23_STABLE_PRO_WORKFLOW_LOCK.md](./23_STABLE_PRO_WORKFLOW_LOCK.md) | prior stable |
| [23_STABLE_MULTI_WORKSPACE_LOCK.md](./23_STABLE_MULTI_WORKSPACE_LOCK.md) | prior stable |
| [23_PHASE_THEME2_FOUNDATION.md](./23_PHASE_THEME2_FOUNDATION.md) | THEME2 기반 |
| [23_THEME2_ORDER_ACCURACY_QA.md](./23_THEME2_ORDER_ACCURACY_QA.md) | THEME2 주문 정확도 QA |
| [23_PHASE_PRO_TRADING_WORKFLOW.md](./23_PHASE_PRO_TRADING_WORKFLOW.md) | Pro 트레이딩 워크플로 |
| [23_PHASE_VISUAL_DEPTH_ENGINE.md](./23_PHASE_VISUAL_DEPTH_ENGINE.md) | DOM 시각화 엔진 |
| [23_PHASE_REALISTIC_ORDER_FLOW.md](./23_PHASE_REALISTIC_ORDER_FLOW.md) | 실전 체결 흐름 mock |
| [docs/ONE_WAY_PRIMARY.md](./docs/ONE_WAY_PRIMARY.md) | 원웨이 우선 정책 |
| [docs/HQ_REPORTING.md](./docs/HQ_REPORTING.md) | **20번 HQ 보고 연동** |
| [LAST_SESSION_REPORT.md](./LAST_SESSION_REPORT.md) | HQ import용 세션 보고 |
| [23_PHASE_P1_COIN_MOCK_STABILIZATION.md](./23_PHASE_P1_COIN_MOCK_STABILIZATION.md) | P1 안정화 |
| [23_PHASE_P2_COIN_RULES.md](./23_PHASE_P2_COIN_RULES.md) | **P2 코인 규칙** |
| [23_STABLE_COIN_MOCK_LOCK.md](./23_STABLE_COIN_MOCK_LOCK.md) | **현재 stable** |
| [23_MULTI_WORKSPACE_ORDER_ACCURACY_QA.md](./23_MULTI_WORKSPACE_ORDER_ACCURACY_QA.md) | 주문 격리 QA |

## 원칙

- **22번 코드 복붙 금지** — 실패 교훈·UI 참고만
- MOCK ONLY — WebSocket·실거래·`02-TGX-CEX` 연결 금지
- Hedge: LONG/SHORT 동시 보유, netting 금지
- 청산: 포지션 행 버튼만
- 수량: `sharedOrderQty` 단일

## 구조

```
src/
  app/           App, TradingContext
  types/         productTypes, tradingTypes
  engine/        hedge, execution, ticker, MIT, PnL, audit
  adapters/      coin + overseas/us/korea stubs
  ui/            HTS layout panels
  tests/         vitest
```
