# 23-Tether-Speed-Order-V2 · 테데HTS1

**제품명:** **테데HTS1** (Tede HTS1) — 한국 HTS식 멀티상품 호가 주문. **규칙 문서 우선**, 엔진 검증 후 UI.

## Product policy (must read)

**`docs/TEDE_HTS1_PRODUCT_POLICY.md`**

- **23 = 완성·동결** — P1~P2 Gate 후 기능 추가 없음 (버그·스킨만).
- **분양** = 색·위치·로고·레이아웃 preset만 — 엔진·주문 규칙 동일.
- **신기능** → **24번** 별도 프로젝트. 분양/고객 요청 기능을 23에 넣지 않음.
- **Gate 실패 시 즉시 중단** — `23_DEV_SCHEDULE.md` Phase 순서만 진행.

## Rules

- **No copy from `22-Korean-HTS-OrderPanel-Lab`**
- MOCK ONLY — no live trade, WebSocket, `02-TGX-CEX`
- Canonical spec: `23_ENGINE_RULES.md` · architecture: `docs/HTS_CORE_ARCHITECTURE.md` · `src/core/`
- `npm run lint` / `build` / `test` / `smoke` must pass before merge

## Phase — P5 통합·동결 (CURRENT)

- Doc: `23_PHASE_P5_INTEGRATION_FREEZE.md` · tests: `mockIntegrationP5.test.ts`
- Stable tag: `STABLE_23_MOCK_V1` · lock: `23_STABLE_MOCK_V1_LOCK.md`
- Gate: `lint` / `build` / `test` (197) / `smoke` (34) all PASS
- **기능 동결 후보** — 신기능 → 24번 · 호가 STOP 통일은 §6b 백로그

## QA Lock — `STABLE_23_MOCK_V1` (CURRENT)

- Prior: `STABLE_23_COIN_MOCK_V1` · `STABLE_23_VISUAL_DEPTH_V1`

## v1 scope

- **4상품 mock:** COIN · OVERSEAS (ESZ6) · US (AAPL) · KR (005930)
- Multi-workspace: tabs, popup, detach, save/load (mock)
- 호가 STOP 등록: 코인만 (해외·주식 §6b 백로그)

## Commands

| Script | Note |
|--------|------|
| `npm run dev` | port **5123** |
| `npm run test` | vitest (173 tests) |
| `npm run smoke` | build + QA lock smoke |
