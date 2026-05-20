# 원웨이 우선 정책 (테데HTS1)

**확정:** 2026-05-20 · P1 코인 mock 안정화

## 방향

| 우선순위 | 모드 | 스탑 · TP/SL · MIT |
|----------|------|---------------------|
| **1** | **원웨이** (코인 기본, 4상품 공통) | 기본 개발·QA·문서 축 |
| 2 | 헷지 (코인만, 토글) | 유지하되 후순위·회귀만 |

- 신규 Phase는 **원웨이 + 보호주문** 경로를 먼저 통과시킨 뒤 헷지 시나리오를 추가한다.
- 헷지는 `docs/POSITION_MODE.md` 규칙을 깨지 않는 범위에서만 수정한다.

## 구현 기준

- 체결: `fillOneWayLeg` (`useHedgeLegs: false`)
- 코인 기본: `hedgeMode: false` (`createTradingSession`)
- 테스트: `coinOneWayPrimary.test.ts`, `oneWayFill.test.ts`, `protectionBook.test.ts`, `mitStopEngine.test.ts`

## 우측 주문창 (거래소식)

- **시장가 / 지정가** 탭 + **매수 / 매도** (`CoinOrderPanel` · `placePanelOrder`)
- 원웨이: `fillOneWayLeg` · 헷지: `fillHedgeExchange`
- 호가 클릭: 지정가 체결 + `limitEntryPrice`·방향 자동 설정 (매수전환/매도전환 버튼 제거)
- 단축키 Q/A/B/V: 방향 전환 유지

## 하지 않을 것 (P1)

- 02-TGX-CEX 연동
- 헷지 모드 기본값 ON 변경
- 실거래·WebSocket
