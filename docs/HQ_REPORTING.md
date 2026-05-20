# 20-TetherTeam-HQ · 보고 연동 (23 테데HTS1)

**목적:** Phase/세션 끝날 때 **어디에 무엇을** 남길지 고정 (import·타임라인·현황판).

---

## 1. 필수 (매 Phase)

| 순서 | 문서 | 경로 | 내용 |
|------|------|------|------|
| 1 | **HQ 현황** | `20-TetherTeam-HQ/MASTER_MANUAL.md` | `[CURRENT STATUS]` → `23-SpeedOrder-V2` 블록 (status, gate, next) |
| 2 | **세션 보고** | `23-Tether Speed Order V2/LAST_SESSION_REPORT.md` | Gate 표 · 산출물 · 수동 QA · next |
| 3 | **검증** | `23-Tether Speed Order V2/23_VERIFICATION_REPORTS.md` | `VR-00n` 블록 추가 |

---

## 2. Phase별 (23 폴더)

| 종류 | 패턴 | 예 (P1) |
|------|------|---------|
| Phase 상세 | `23_PHASE_<NAME>.md` | `23_PHASE_P1_COIN_MOCK_STABILIZATION.md` |
| 정책/규칙 | `docs/*.md` | `docs/ONE_WAY_PRIMARY.md` |
| 상태 요약 | `23_PROJECT_STATUS.md` | gate 수 · CURRENT phase |
| 개발 스케줄 | `23_DEV_SCHEDULE.md` | 체크박스 · P1~P5 |

---

## 3. HQ 앱 (localhost:5120)

- 프로젝트 **23** 레지스트리 등록 · 문서 경로 override → `20-TetherTeam-HQ/src/mock/documents.js`
- **Report Import:** `LAST_SESSION_REPORT.md` 붙여넣기 또는 파일 경로
- **MASTER_MANUAL:** monorepo `20-TetherTeam-HQ/MASTER_MANUAL.md` (23은 별도 `MASTER_MANUAL` 없음)

---

## 4. Gate

**Gate A (자동, 필수)**

```bash
cd "23-Tether Speed Order V2"
npm run lint && npm run build && npm run test && npm run smoke
```

**Gate B (수동, P1~P2 코인)**

`23_MANUAL_QA_COIN.md` A~F — 브라우저 http://localhost:5123/

---

## 5. 짧은 맥락

`20-TetherTeam-HQ/MASTER_CONTEXT.md` — 23 블록 (MASTER_MANUAL과 동기화)
