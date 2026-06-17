# 공용 컴포넌트 기반 마련 — SectionHeader / NbChip / Spinner / Toast

## 1. Background & Goals

여러 페이지에 동일한 JSX 패턴이 인라인 스타일로 흩어져 있어, 디자인 시스템 토큰이 완성돼도 수정 시 다수 파일을 개별로 건드려야 한다.

**목표**: `SectionHeader`, `NbChip`, `Spinner` 세 컴포넌트를 `shared/ui/notebook`에 신규 정의하고, `sonner` 라이브러리를 도입해 노트북 테마로 커스터마이징한 Toast를 세팅한다. 기존 페이지 치환은 다음 PR 범위이며, 이번은 기반 마련만 한다.

## 2. Functional Requirements

### In Scope
- `SectionHeader` — 점선 구분선 + 한글 제목 + 선택적 영문 subtitle
- `NbChip` — active/inactive 두 상태를 외부 제어로 표현하는 필터 칩
- `Spinner` — sm/md/lg 세 가지 크기 variant를 가진 로딩 인디케이터
- `Toast` — `sonner` 설치 + `<Toaster />` 레이아웃 배치 + 노트북 테마 스타일 적용

### Out of Scope
- 기존 페이지(`HomePage`, `TechListPage` 등) 코드 치환
- `chipStyle()` 인라인 함수 제거
- 기타 공용 컴포넌트 추출 (PostCard, PolaroidGallery 등)

## 3. Acceptance Criteria

- [ ] `SectionHeader`가 `title` prop 필수, `subtitle` prop 선택적으로 렌더링된다
- [ ] `subtitle` 없을 때 subtitle 영역이 렌더링되지 않는다
- [ ] `SectionHeader` 하단에 점선 구분선(`var(--nb-rule)`)이 표시된다
- [ ] `NbChip`이 `active={true}`일 때 배경 `var(--nb-ink)` / 텍스트 `var(--nb-paper)`로 반전된다
- [ ] `NbChip`이 `active={false}`일 때 배경 투명 / 텍스트 `var(--nb-ink)` / border `var(--nb-ink)`
- [ ] `NbChip`의 `onClick` prop이 클릭 시 호출된다
- [ ] `Spinner`가 `size="sm"(16px)` / `size="md"(32px)` / `size="lg"(48px)` variant를 지원한다
- [ ] `Spinner`의 기본 size는 `md`이다
- [ ] 세 컴포넌트 모두 디자인 시스템 CSS 변수(`var(--nb-*)`)와 폰트 상수(`NB_HAND` 등)만 사용한다 — 하드코딩 hex 없음
- [ ] `tsc --noEmit` 통과
- [ ] `src/shared/ui/notebook/index.ts` barrel export에 세 컴포넌트가 추가된다
- [ ] `sonner` 패키지가 설치된다
- [ ] 루트 레이아웃(`src/app/layout.tsx`)에 `<Toaster />` 가 추가된다
- [ ] `<Toaster />`가 노트북 테마 CSS 변수(`--nb-paper`, `--nb-ink`, `--nb-rule`)로 스타일링된다
- [ ] `toast("메시지")` 호출 시 화면에 노트북 스타일 토스트가 표시된다

### Accessibility
- [ ] `NbChip`에 `role="button"` 또는 `<button>` 태그 사용, `aria-pressed={active}` 적용
- [ ] `Spinner`에 `role="status"`, `aria-label="로딩 중"` 적용

## 4. Functional Flow

해당 없음 — 신규 컴포넌트 파일 생성만. 기존 페이지 동작 변경 없음.

**컴포넌트 사용 흐름 (향후 치환 시)**:
```
부모 페이지
  └── <SectionHeader title="테크 노트" subtitle="tech notes" />
  └── <NbChip active={filter === "react"} onClick={() => setFilter("react")}>리액트</NbChip>
  └── <Spinner size="md" />  ← 로딩 시 조건부 렌더

// Toast (sonner)
import { toast } from "sonner"
toast("복사됨")
toast.success("저장됨")
toast.error("실패")
```

## 5. UI Design

### SectionHeader

```
// subtitle 있을 때
┌─────────────────────────────────────────────────────
│ 테크 노트  tech notes                               ← NB_HAND(42px) + NB_HAND2(18px, ink-soft)
└╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  ← 2px dashed var(--nb-rule)

// subtitle 없을 때
┌─────────────────────────────────────────────────────
│ 테크 노트                                            ← change: subtitle 미렌더
└╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
```

### NbChip

```
// inactive (기본)
┌──────────────┐
│  리액트       │  ← 배경 투명, border 2px solid var(--nb-ink), 텍스트 var(--nb-ink)
└──────────────┘

// active ← change
┌──────────────┐
│  리액트       │  ← 배경 var(--nb-ink), 텍스트 var(--nb-paper)
└──────────────┘
```

### Spinner

```
// sm (16px)     md (32px)      lg (48px)
   ◌              ◌              ◌
   ↺              ↺              ↺
 버튼 안         카드/섹션       페이지 레벨
```

### Toast (sonner)

```
// 기본 (우측 하단)
┌──────────────────────────────┐
│  복사됨                       │  ← bg: var(--nb-paper), border: var(--nb-rule)
└──────────────────────────────┘   text: var(--nb-ink), font: NB_HAND2

// success
┌──────────────────────────────┐
│  ✓  저장됨                    │  ← 아이콘 색: var(--nb-tape)
└──────────────────────────────┘

// error
┌──────────────────────────────┐
│  ✕  실패                      │  ← 아이콘 색: var(--nb-memo)
└──────────────────────────────┘
```

### Component Tree

```
shared/ui/notebook/
  SectionHeader.tsx     ← 신규
  NbChip.tsx            ← 신규
  Spinner.tsx           ← 신규
  index.ts              ← 수정 (barrel export 추가)

src/app/
  layout.tsx            ← 수정 (<Toaster /> 추가)
```

### Accessibility

- `NbChip`: `<button>` 태그, `aria-pressed={active}`
- `Spinner`: `role="status"`, `aria-label="로딩 중"`, 애니메이션 텍스트는 `aria-hidden`

## 6. Technical Design

### 변경 파일

| 파일 | 역할 | 변경 내용 |
|------|------|---------|
| `src/shared/ui/notebook/SectionHeader.tsx` | 섹션 헤더 컴포넌트 | 신규 |
| `src/shared/ui/notebook/NbChip.tsx` | 필터 칩 컴포넌트 | 신규 |
| `src/shared/ui/notebook/Spinner.tsx` | 로딩 스피너 컴포넌트 | 신규 |
| `src/shared/ui/notebook/index.ts` | barrel export | SectionHeader, NbChip, Spinner 추가 |
| `src/app/layout.tsx` | 루트 레이아웃 | `<Toaster />` 추가 |
| `package.json` | 의존성 | `sonner` 추가 |

### 타입 인터페이스

```
SectionHeaderProps
  title: string
  subtitle?: string

NbChipProps
  active: boolean
  onClick: () => void
  children: React.ReactNode

SpinnerProps
  size?: "sm" | "md" | "lg"   // 기본값: "md"

// Toast는 sonner 내장 타입 사용 (별도 정의 불필요)
// toast(message) / toast.success(message) / toast.error(message)
```

### 스타일 기준

| 토큰 | 사용처 |
|------|------|
| `var(--nb-ink)` | NbChip border/배경(active), SectionHeader 제목 |
| `var(--nb-paper)` | NbChip 텍스트(active) |
| `var(--nb-ink-soft)` | SectionHeader subtitle |
| `var(--nb-rule)` | SectionHeader 점선 구분선 |
| `NB_HAND` | SectionHeader 제목 폰트 |
| `NB_HAND2` | SectionHeader subtitle 폰트 |

### Spinner 크기 매핑

| size | px |
|------|----|
| sm | 16 |
| md | 32 |
| lg | 48 |

## 7. Error & Feedback Handling

해당 없음 — 정적 UI 컴포넌트. 런타임 에러 발생 가능성 없음.

## 8. Decisions

| # | 결정 | 이유 |
|---|------|------|
| 1 | 기존 페이지 치환 Out of Scope | 기반 마련이 목적. 치환은 별도 PR로 분리해 블라스트 반경 최소화 |
| 2 | NbChip 상태 외부 제어 (active prop) | 컴포넌트는 표현만 담당, 상태는 부모가 소유 — 단일 책임 원칙 |
| 3 | Spinner sm/md/lg 3단계 | 버튼 인라인/카드/페이지 레벨 세 용도를 커버하는 최소 집합 |
| 4 | 하드코딩 hex 금지 | 디자인 시스템 CSS 변수만 사용해 dark mode cascade 자동 추종 |
| 5 | Toast → sonner 외부 라이브러리 채택 | 직접 구현 대비 접근성·애니메이션·큐 관리 무료로 확보. 스타일만 커스터마이징 |
