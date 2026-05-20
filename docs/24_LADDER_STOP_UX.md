# 24 · 호가 STOP / MIT / TP·SL UX (킥오프 초안)

**상태:** DRAFT — 24번 저장소·Phase 착수 전 설계 메모  
**기준선:** 23 `STABLE_23_MOCK_V1` · `docs/FIVE_PRODUCT_BASELINE.md`  
**정책:** 검증(Gate A/B) 통과 후에만 항목 확정 · 필요 시 §追加

**작성:** 2026-05-20 · P6 QA 피드백 반영

---

## 0. 23번 현재 호가 (동결 · 변경 없음)

```
[STOP] | SELL주문 | 매도 | 가격 | 매수 | BUY주문 | [TP/SL]
```

| 열 | 동작 | 포지션 |
|----|------|--------|
| 왼쪽 STOP | 매수/매도**전환**에 연동 MIT (`buy`→LONG, `sell`→SHORT) | **없어도 됨** (예약·돌파·추격) |
| 오른쪽 TP/SL | 선택 포지션 기준 익절/손절 (평단 위·아래 자동) | **필수** |
| 오른쪽 BUY / 왼쪽 SELL 주문 | 전환과 반대 칸 **차단** (원웨이 UX) |

**한계 (24에서 해결 후보):** STOP이 한쪽뿐이라 “양방향 예약 스탑”·실전 HTS 체감과 어긋남.  
**엔진:** 무포지션 MIT 체결 → `fillOneWayLeg` 신규 진입 (`orderExecution.fillMitStopOrder`).

코드: `OrderBookLadder.tsx` · `ladderMitBridge.ts` · `protectionBook.ts`

---

## 1. 24 설계 선택지 (택 1 또는 하이브리드)

검증 단계마다 **결정(DEC-xxx)** 기록 후 구현. 미결은 §7 백로그.

### 옵션 A — **양쪽 STOP** (HTS 대칭)

| 위치 | 제안 역할 |
|------|-----------|
| **왼쪽 STOP** | 진입 전·무포지션 MIT (상향/하향 돌파, 전환과 **독립** 또는 명시 방향) |
| **오른쪽 STOP** | 보유 포지션 **트레이딩 스탑**·추격 손절 (포지션 `positionId` 연동) |
| TP/SL | A안에서도 유지할지 **DEC-001** (아래) |

**장점:** 실전 “위·아래 스탑” 직관 · 무포지션·보유 후 역할 분리 가능  
**단점:** 호가 열 증가 · 7→8칸 이상 · Theme1/2·popup 레이아웃 회귀 큼

### 옵션 B — **진입 후 3종만** (단순)

진입은 기존 호가 주문·패널. **포지션 생긴 뒤**만:

1. **트레이딩 스탑** (추격·MIT/STOP 계열)  
2. **익절 (TP)**  
3. **손절 (SL)**

무포지션 돌파 MIT는 **패널·워치·별도 “예약” 탭**으로 이관 (호가 열 확장 최소).

**장점:** 23 엔진 재사용 비율 높음 · QA 범위 작음  
**단점:** 무포지션 추격 돌파는 호가 한눈에 안 보일 수 있음 → 보조 UI 필요

### 옵션 C — **하이브리드 (권장 검토 순)**

1. **Phase 24-1:** 옵션 B (진입 후 3종 + 기존 왼쪽 STOP 유지)  
2. **Phase 24-2:** 사용자·QA 후 옵션 A의 **오른쪽 STOP**만 추가  
3. **Phase 24-3:** 국내선물 선물｜옵션 하위 탭 (`FIVE_PRODUCT_BASELINE.md`)

| DEC ID | 질문 | 후보 | 결정일 |
|--------|------|------|--------|
| DEC-001 | TP/SL 열 유지 vs STOP에 통합 | 유지 / 통합 / B만 패널 | — |
| DEC-002 | 무포지션 MIT 위치 | 왼쪽 STOP / 예약탭 / 양쪽 STOP | — |
| DEC-003 | 매수·매도전환 vs 방향 독립 | 23 유지 / 24 독립 | — |

---

## 2. 공통 요구 (23 엔진 유지)

- MOCK only · `23_ENGINE_RULES.md` 원웨이·코인 헷지 규칙 **변경 없이** UI만
- `registerMit` · `positionId` optional · 돌파=`shouldFillMitStopAtPrice`
- TP/SL · OCO · `registerProtectionAtBook` — 포지션 필수 유지
- Gate A: `lint && build && test && smoke` (24 repo 동일)

---

## 3. 24 검증 로드맵 (천천히)

| 단계 | 내용 | Gate |
|------|------|------|
| **K0** | 이 문서 + DEC 표 확정 | 문서 리뷰 |
| **K1** | 24 repo/브랜치 · 23 copy baseline | 빌드 |
| **K2** | 선택지 스펙 1페이지 확정 (DEC-001~003) | — |
| **K3** | UI mock (호가만) · 수동 QA 시나리오 | Gate B 확장 |
| **K4** | 자동 테스트 (`ladderStop*.test.ts`) | Gate A |
| **K5** | 국내선물 선물/옵션 탭 (별도 Phase) | 회귀 |

수동 QA 초안: `23_MANUAL_QA_COIN.md` §D·§G 확장 → `24_MANUAL_QA_LADDER.md` (24 착수 시 생성)

---

## 4. 수동 QA 체크 (23 동결 중 · 참고)

23 사용 시 until 24:

- [ ] 무포지션 · **왼쪽 STOP** · 매도전환 → SHORT MIT 등록·트리거  
- [ ] 무포지션 · 매수전환 → LONG MIT  
- [ ] 숏 보유 · **오른쪽 TP/SL** · 평단 **위**=SL · **아래**=TP  
- [ ] 매도전환 · **오른쪽 BUY 주문** 차단 메시지 (정상)  
- [ ] KOSPI200FM 포함 5상품 1회씩

이슈는 **버그(23)** vs **UX(24 DEC)** 구분 기록.

---

## 5. §追加 (킥오프 후 여기에 추가)

<!-- 예: DEC-001 결정, 와이어프레임 링크, API 스펙 -->

| 날짜 | 추가 내용 |
|------|-----------|
| 2026-05-20 | 초안 · 옵션 A/B/C · DEC-001~003 |

---

## 6. 관련 문서

| 문서 | 용도 |
|------|------|
| `docs/FIVE_PRODUCT_BASELINE.md` | 5탭 · 24 범위 인덱스 |
| `docs/POSITION_MODE.md` | 원웨이·헷지·호가 열 설명 |
| `23_ENGINE_RULES.md` | 엔진·상품 규칙 |
| `docs/TEDE_HTS1_PRODUCT_POLICY.md` | 23 동결·분양 |

---

*24 구현 PR 시 이 파일 상단 **상태**를 `ACTIVE`로 바꾸고 DEC 표를 채운 뒤 진행.*
