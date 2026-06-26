# A-1: jsx-a11y 라이트박스

**브랜치**: `chore/lint/a11y-lightbox`
**부모 백로그**: [backlog.md](./backlog.md)
**룰 승격**: 사용자가 사전 처리 완료 (`eslint.config.mjs`에서 두 룰 warn → error)
**관련 PR**: TBD

---

## 1. 배경 및 목표

baseline 24건 중 jsx-a11y 2건이 같은 위치(`HobbyDetailPage.tsx:196`)의 동일한 `<div onClick={...}>`에서 동시에 떠 있다. 사용자가 두 룰을 error로 승격해 가드는 이미 작동 중 — 현재 `pnpm lint`가 error 2건으로 빌드를 차단한다.

**본 PR 목표**: 위반 코드를 해소해서 빌드 정상화 + baseline에서 두 룰 항목 제거.

**스코프 변경 (구현 중)**: 초기 설계는 `role="button"` + `tabIndex={0}` + `onKeyDown(Esc)` 최소 조합("룰만 만족")이었으나, 구현 중 사용자 결정으로 **base-ui Dialog 도입**으로 전환. ESLint 룰 통과 + 시멘틱 정확성(role=dialog) + 풀 a11y 패턴(focus trap, autoFocus, 트리거 복귀, Esc/Enter/Space 닫기)이 라이브러리에 의해 자동 제공된다.

---

## 2. 기능 요구사항

### In scope
- HobbyDetailPage 라이트박스 오버레이를 키보드 사용자도 닫을 수 있게 한다 (Esc/Enter/Space — base-ui 자동)
- 스크린리더가 오버레이를 다이얼로그로 인식하게 한다 (role=dialog + aria-modal — base-ui 자동)
- 두 jsx-a11y 룰 error 0건 달성
- 라이트박스 열림 시 자동 포커스 + 닫힘 시 트리거 복귀 (base-ui 자동)

### Out of scope
- ←/→ 사진 순회 — 별도 작업 (신규 기능)
- 다른 페이지 라이트박스 — 현재 hobby 외 없음
- 캡션 문구 변경 — 본 PR 외
- shadcn dialog↔button 컨벤션 정렬 (size="icon-sm" 등) — 별도 PR

---

## 3. 인수 기준

기능
- [x] 오버레이 클릭 시 라이트박스 닫힘 (기존 유지)
- [x] Esc 키 입력 시 라이트박스 닫힘 (base-ui Dialog 자동)
- [x] Enter/Space 키 입력 시 닫힘 (base-ui Dialog 자동, 트리거 button의 기본 동작)
- [x] 폴라로이드 클릭으로 라이트박스 열림 (기존 유지)

접근성 (§5 a11y 미러)
- [x] 오버레이가 `role="dialog"` 시멘틱 보유 (base-ui `Dialog.Popup` 자동)
- [x] 오버레이가 `aria-modal="true"` 보유 (base-ui 자동)
- [x] 다이얼로그 라벨 보유 — `Dialog.Title`에 "사진 확대 보기" (시각적 sr-only)
- [x] 라이트박스 열림 시 다이얼로그로 자동 포커스 (base-ui 자동)
- [x] 라이트박스 닫힘 시 트리거 버튼으로 포커스 복귀 (base-ui 자동)
- [x] 키보드 사용자가 다이얼로그 밖으로 빠져나갈 수 없음 — focus trap (base-ui 자동)

하네스
- [x] `pnpm lint` 실행 시 `jsx-a11y/click-events-have-key-events` error 0건
- [x] `pnpm lint` 실행 시 `jsx-a11y/no-static-element-interactions` error 0건
- [x] `pnpm lint` 전체 통과 (exit 0)
- [x] `lint-baseline.json`에서 두 룰 항목 제거
- [x] `lint-baseline.json` `warn_total: 24 → 22`
- [x] `eslint-migration.md` Changelog 갱신
- [x] `backlog.md` A-1 ✅
- [x] 회귀 차단 검증 — 일부러 위반 추가 시 lint 실패 후 되돌리기

---

## 4. 기능 흐름

### 사용자 시나리오

```
[닫힘]
  ↓ 폴라로이드 클릭 (기존)
[열림]                                  ← base-ui Dialog mount
  ├ 자동 포커스 이동             (base-ui 자동)
  ├ focus trap 활성              (base-ui 자동)
  │
  ├ Backdrop 클릭 → onOpenChange(false) → setLightbox(null) → [닫힘]
  ├ Esc 키          → onOpenChange(false) → setLightbox(null) → [닫힘] (base-ui 자동)
  └ Popup 클릭      → onClick → setLightbox(null)              → [닫힘]
[닫힘]
  └ 포커스 트리거 버튼으로 복귀 (base-ui 자동)
```

### 엣지 케이스
- 다른 키 누름 (Esc/Enter/Space 외) → 핸들러 무시
- 오버레이 클릭과 Esc 입력이 짧은 간격으로 발생 → onOpenChange 두 번 호출, React 상태 동일 → 영향 없음
- Dialog mount 직후 첫 렌더에서 포커스 가능 자식 없음 → base-ui가 Popup(tabIndex 자동 부여)에 포커스

---

## 5. UI 디자인

**UI 시각 변화 없음** — 어두운 오버레이 + 중앙 폴라로이드 + 인덱스 표시 (기존 톤 유지). ASCII 레이아웃 N/A.

### 컴포넌트 트리

```
HobbyDetailPage (변경)
├─ <section> (히어로/본문, 변경 없음)
├─ <section> (폴라로이드 갤러리, 변경 없음)
│   └─ <button onClick={open}> × 4 (변경 없음 — 트리거)
└─ <Dialog open={lightbox !== null} onOpenChange={...}>           ← shadcn 래퍼
    └─ <DialogContent showCloseButton={false} onClick={닫기}>    ← className으로 박스→풀스크린 reset, inline style로 어두운 배경
        ├─ <DialogTitle> "사진 확대 보기" (sr-only 스타일)
        ├─ <Polaroid /> (확대 렌더)
        └─ <div> 인덱스 "N / Total"
```

### 접근성 (§3 인수 기준에 미러됨)

| 요소 | 속성/동작 | 제공 방식 |
|---|---|---|
| 오버레이 | `role="dialog"` + `aria-modal="true"` | base-ui `Dialog.Popup` 자동 |
| 다이얼로그 라벨 | `Dialog.Title` "사진 확대 보기" (sr-only) | 명시 |
| Esc/Enter/Space → 닫기 | base-ui Dialog 자동 |
| 열림 시 자동 포커스 | base-ui Dialog 자동 |
| Focus trap | base-ui Dialog 자동 |
| 닫힘 시 트리거 복귀 | base-ui Dialog 자동 |

---

## 6. 기술 설계

### 신규 파일

| 경로 | 역할 |
|---|---|
| `src/shared/ui/dialog.tsx` | shadcn dialog 컴포넌트 (base-ui 기반). 본 PR에선 base-ui primitive를 직접 사용하나 향후 박스형 모달용으로 보존 |

### 변경 파일

| 경로 | 변경 |
|---|---|
| `src/views/hobby-detail/ui/HobbyDetailPage.tsx` | 인라인 라이트박스 div → shadcn `Dialog` + `DialogContent` + `DialogTitle` 구조로 교체. `DialogContent` className으로 박스 모달 스타일을 풀스크린으로 reset, inline style로 어두운 배경. `showCloseButton={false}`로 X 버튼 숨김. |
| `eslint.config.mjs` | (사용자 직접 처리) `jsx-a11y/click-events-have-key-events`, `jsx-a11y/no-static-element-interactions` 두 룰 `warn → error` 승격 |
| `package.json` + `pnpm-lock.yaml` | `@base-ui/react@1.6.0` 추가 |
| `docs/개발계획서/harness/lint-baseline.json` | 두 룰 항목 제거. `warn_total: 24 → 22`. `decreases`에 A-1 기록. |
| `docs/개발계획서/harness/eslint-migration.md` | Changelog: A-1 — Dialog 도입 + 두 룰 승격 + 위반 1건 해소 |
| `docs/개발계획서/harness/backlog.md` | A-1 ⬜ → ✅ |

### 상태 관리

변경 없음 — `lightbox: number | null` 그대로. Dialog의 open/close 상태를 `open={lightbox !== null}`로 매핑, `onOpenChange`에서 `setLightbox(null)` 호출.

### 키보드 매핑

base-ui Dialog가 자동 처리. 명시 코드 없음.

| 키 | 동작 | 제공 |
|---|---|---|
| `Escape` | 다이얼로그 닫기 | base-ui |
| `Enter` / `" "` | 트리거 버튼에서 다이얼로그 열기 (브라우저 button 기본) | 브라우저 |
| Tab | focus trap — 다이얼로그 내부 순환 | base-ui |

---

## 7. 에러 및 피드백 처리

해당 없음 — 외부 데이터/API 없음, 정적 사진 4장.

피드백:
- 캡션 "아무 곳이나 클릭" 유지 (기존)
- 인덱스 표시 "N / Total" 유지 (기존)

---

## 8. 결정 사항

| # | 결정 | 선택 | 근거 |
|---|---|---|---|
| D1 | a11y 패턴 | `role="dialog"` + `aria-modal="true"` (base-ui Dialog) | **구현 중 변경.** 초기 설계는 role="button" 최소 패턴이었으나 — (1) 라이트박스의 실제 의미는 다이얼로그, (2) Esc 작동을 위한 ref+useEffect 자체 구현이 base-ui Dialog 한 줄 도입과 동급 비용, (3) focus trap/autoFocus/트리거 복귀까지 자동. 정공법으로 전환. |
| D2 | 키보드 닫기 범위 | Esc/Enter/Space + Tab focus trap (base-ui 자동) | 초기 설계는 Esc 1개. 라이브러리 도입으로 풀 키보드 패턴 자동 보장. |
| D3 | 다이얼로그 라벨 | `Dialog.Title` "사진 확대 보기" (sr-only) | role=dialog 시 라벨 필수. 스크린리더가 "사진 확대 보기 다이얼로그"로 읽음. |
| D4 | `tabIndex` 명시 | 해당 없음 | base-ui `Dialog.Popup`이 자체 tabIndex 부여. |
| D5 | 트리거(폴라로이드 버튼)는 그대로 | 변경 없음 | 이미 `<button type="button">` — a11y OK. |
| D6 | 회귀 차단 검증 방식 | 일부러 위반 추가 → lint error 확인 → 되돌림 | 가드가 진짜 막는지 1회 확인. 자동화 인프라는 본 PR 외. |
| D7 | baseline 갱신 시점 | 코드 수정 후 위반 0 확인 직후 | warn_total 정확성 유지. |
| D8 | base-ui 직접 사용 vs shadcn DialogContent | shadcn `DialogContent` 사용 | **구현 중 변경.** 초기엔 base-ui 직접이 깔끔하다 판단했으나 — (1) 프로젝트 다른 곳도 shadcn 컴포넌트 사용 중이라 컨벤션 통일, (2) 미래 다른 모달 추가 시 동일 패턴 재사용, (3) className `max-w-none w-screen h-screen top-0 left-0 translate-x-0 translate-y-0 rounded-none p-0 ring-0 gap-0` + inline style로 박스→풀스크린 reset. focus trap/autoFocus/Esc 자동은 동일하게 유지. |
| D9 | shadcn dialog vs button 컨벤션 충돌 | 본 PR에선 임시 우회 (`size="icon"`), 별도 PR로 정렬 | dialog.tsx의 `size="icon-sm"`은 base-nova 가정. 우리 button.tsx는 옛 shadcn (`icon`까지만). 라이트박스에선 close button 미사용이라 dead path. 정렬 작업은 별도 트랙. |
| D10 | shadcn dialog.tsx의 `jsx-no-leaked-render` 위반 처리 | ternary로 직접 수정 | 위반 2건(`showCloseButton && (...)` 패턴) ternary로 수정. shadcn 재생성 시 사라지는 부채. 다음 dialog 업데이트 시 재수정 필요. |

---

## 부록: 작업 체크리스트

PR 작업 순서 (완료):

1. [x] 브랜치 생성 `chore/lint/a11y-lightbox`
2. [x] `eslint.config.mjs`에서 두 룰 `warn → error` 승격 (사용자 직접)
3. [x] `pnpm dlx shadcn@latest add dialog` 실행 → dialog.tsx 생성
4. [x] `pnpm add @base-ui/react` 의존성 추가
5. [x] `HobbyDetailPage.tsx:196` 인라인 div → Dialog 구조로 교체
6. [x] dialog.tsx의 `jsx-no-leaked-render` 위반 2건 ternary로 수정
7. [x] dialog.tsx의 `size="icon-sm"` → `size="icon"` (임시 우회)
8. [x] `pnpm lint` 통과 확인 (jsx-a11y 두 룰 error 0)
9. [x] 회귀 차단 검증: 다른 .tsx에 `<div onClick>` 잠깐 추가 → lint 실패 확인 → 되돌리기
10. [x] `lint-baseline.json` 갱신 (두 룰 항목 제거, warn_total 22, decreases A-1)
11. [x] tsc 통과 확인
12. [x] `eslint-migration.md` Changelog 추가
13. [x] `backlog.md` A-1 ✅
14. [ ] 수동 테스트: 폴라로이드 클릭 → 라이트박스 열림 → Esc → 닫힘 / 오버레이 클릭 → 닫힘
15. [ ] 커밋 + PR
