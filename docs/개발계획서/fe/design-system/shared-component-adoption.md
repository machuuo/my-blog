# 공용 컴포넌트 적용 및 CSS Alias 제거

## 1. Background & Goals

PR #5에서 `SectionHeader`, `NbChip`, `Spinner`, `Toast`를 `shared/ui/notebook`에 정의했으나, 각 페이지에는 동일한 인라인 패턴이 그대로 남아 있다. 또한 `globals.css`에는 이전 PR(semantic token 완성)에서 backward-compat으로 남겨둔 CSS alias(`--nb-sage`, `--nb-pink`, `--nb-sky`)가 여전히 정의되어 있어, 디자인 시스템 일관성이 깨진 상태다.

**목표**:
- 각 페이지의 인라인 `chipStyle()` / `tagChipStyle()` 함수를 `<NbChip>`으로 치환
- 인라인 섹션 헤더 패턴을 `<SectionHeader>`로 치환 (이를 위해 `titleColor` prop 추가)
- `--nb-sage`, `--nb-pink`, `--nb-sky` alias를 `globals.css`에서 삭제하고 사용처를 semantic/primitive 토큰으로 교체

## 2. Functional Requirements

### In Scope
- `SectionHeader`에 `titleColor?: string` prop 추가 (기본값 `var(--nb-ink)`)
- `TechListPage` — `tagChipStyle()` 제거 → `<NbChip>` 치환
- `HobbyListPage` — `chipStyle()` 제거 → `<NbChip>` 치환
- `TagsPage` — 공부 태그 / 취미 태그 / 달력으로 보기 헤더 → `<SectionHeader>` 치환
- `AboutPage` — "이 노트를 만든 것들" 헤더 → `<SectionHeader>` 치환
- `TechDetailPage` — "이어 읽기" 헤더 → `<SectionHeader>` 치환
- `globals.css` — `--nb-sage`, `--nb-pink`, `--nb-sky` 정의 삭제
- 전체 페이지에서 alias 사용처를 `var(--nb-tape)` / `var(--nb-memo)` / `var(--sky-1)`으로 교체

### Out of Scope
- `HobbyDetailPage` "현장 사진" 헤더 치환 (오른쪽 extra `<span>` 포함, 구조 다름)
- `HomePage` `NbColumn` 헤더 치환 (`HandArrow` 포함된 별도 구조)
- `--nb-butter` 처리 (별도 확인 필요)
- `design-data.ts` 폰트 상수 제거 (PR D 범위)
- 레이아웃/시각 디자인 변경

## 3. Acceptance Criteria

### SectionHeader titleColor prop
- [ ] `titleColor` prop이 없을 때 h2 색상이 `var(--nb-ink)`로 렌더된다
- [ ] `titleColor="var(--nb-memo)"` 전달 시 h2가 해당 색상으로 렌더된다

### NbChip 치환
- [ ] `TechListPage`에서 `tagChipStyle` 함수가 제거되고 `<NbChip>`으로 대체된다
- [ ] `HobbyListPage`에서 `chipStyle` 함수가 제거되고 `<NbChip>`으로 대체된다
- [ ] 필터 동작(active 상태 토글)이 치환 전후 동일하게 작동한다

### SectionHeader 치환
- [ ] `TagsPage` 공부 태그 헤더가 `<SectionHeader title="공부 태그" subtitle="· tech" titleColor="var(--nb-memo)" />`로 교체된다
- [ ] `TagsPage` 취미 태그 헤더가 `<SectionHeader title="취미 태그" subtitle="· hobby" titleColor="var(--nb-tape)" />`로 교체된다
- [ ] `TagsPage` 달력으로 보기 헤더가 `<SectionHeader title="달력으로 보기" subtitle="· archive · 2026" />`로 교체된다
- [ ] `AboutPage` "이 노트를 만든 것들" 헤더가 `<SectionHeader>`로 교체된다
- [ ] `TechDetailPage` "이어 읽기" 헤더가 `<SectionHeader>`로 교체된다

### Alias 제거
- [ ] `globals.css`에서 `--nb-sage`, `--nb-pink`, `--nb-sky` 정의가 삭제된다
- [ ] 전체 `.tsx` 파일에서 `var(--nb-sage)` 사용처가 `var(--nb-tape)`로 교체된다
- [ ] 전체 `.tsx` 파일에서 `var(--nb-pink)` 사용처가 `var(--nb-memo)`로 교체된다
- [ ] 전체 `.tsx` 파일에서 `var(--nb-sky)` 사용처가 `var(--sky-1)`으로 교체된다
- [ ] `tsc --noEmit` 통과
- [ ] 브라우저 시각 확인 — 색상 변화 없음 (alias → semantic 동일값)

## 4. Functional Flow

해당 없음 — 기존 페이지 코드 치환만. 사용자 흐름 및 상태 변화 없음.

## 5. UI Design

해당 없음 — 레이아웃 변화 없음. alias → semantic 토큰 교체는 동일 색상값이므로 시각적 변화 없음.

### Component Tree (변경 후)

```text
shared/ui/notebook/
  SectionHeader.tsx     ← titleColor prop 추가
  NbChip.tsx            (변경 없음)

views/
  tags/ui/TagsPage.tsx          ← SectionHeader 치환 3곳
  about/ui/AboutPage.tsx        ← SectionHeader 치환 1곳
  tech-detail/ui/TechDetailPage.tsx  ← SectionHeader 치환 1곳
  tech-list/ui/TechListPage.tsx      ← NbChip 치환, tagChipStyle 제거
  hobby-list/ui/HobbyListPage.tsx    ← NbChip 치환, chipStyle 제거
  home/ui/HomePage.tsx               ← alias 교체만
  hobby-detail/ui/HobbyDetailPage.tsx ← alias 교체만

app/
  globals.css   ← --nb-sage, --nb-pink, --nb-sky 삭제

shared/ui/notebook/SectionHeader.tsx 치환 불가:
  HobbyDetailPage "현장 사진"  (extra span)
  HomePage NbColumn            (HandArrow 포함)
```

### Accessibility

해당 없음 — 인터랙티브 UI 변경 없음. NbChip은 PR #5에서 이미 `aria-pressed`, `type="button"` 적용됨.

## 6. Technical Design

### 변경 파일

| 파일 | 변경 내용 |
|------|---------|
| `src/shared/ui/notebook/SectionHeader.tsx` | `titleColor?: string` prop 추가, 기본값 `var(--nb-ink)` |
| `src/views/tags/ui/TagsPage.tsx` | SectionHeader 치환 3곳, alias → semantic 교체 |
| `src/views/about/ui/AboutPage.tsx` | SectionHeader 치환 1곳 |
| `src/views/tech-detail/ui/TechDetailPage.tsx` | SectionHeader 치환 1곳, alias 교체 |
| `src/views/tech-list/ui/TechListPage.tsx` | NbChip 치환, `tagChipStyle` 함수 삭제 |
| `src/views/hobby-list/ui/HobbyListPage.tsx` | NbChip 치환, `chipStyle` 함수 삭제 |
| `src/views/home/ui/HomePage.tsx` | `--nb-pink` → `--nb-memo`, `--nb-sage` → `--nb-tape` |
| `src/views/hobby-detail/ui/HobbyDetailPage.tsx` | `--nb-sage` → `--nb-tape`, `--nb-pink` → `--nb-memo` |
| `src/app/globals.css` | `--nb-sage`, `--nb-pink`, `--nb-sky` 정의 삭제 |

### 타입 인터페이스

```ts
// SectionHeader.tsx — 변경 전
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

// SectionHeader.tsx — 변경 후
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  titleColor?: string;   // 추가. 기본값: "var(--nb-ink)"
}
```

### Alias 교체 매핑

| 제거 대상 | 교체 값 | 근거 |
|-----------|---------|------|
| `var(--nb-sage)` | `var(--nb-tape)` | 둘 다 `var(--green-1)` |
| `var(--nb-pink)` | `var(--nb-memo)` | 둘 다 `var(--pink-1)` |
| `var(--nb-sky)` | `var(--sky-1)` | semantic 미정의, primitive 직접 참조 |

### 상태 관리

변경 없음 — `TechListPage`의 `activeTag`/`search`, `HobbyListPage`의 `activeCat` 상태는 페이지 컴포넌트가 그대로 소유. `<NbChip>`은 표현만 담당.

## 7. Error & Feedback Handling

해당 없음 — 정적 UI 치환. 런타임 에러 발생 가능성 없음.

## 8. Decisions

| # | 결정 | 이유 |
|---|------|------|
| 1 | `SectionHeader`에 `titleColor` prop 추가 | `TagsPage` 공부/취미 태그 헤더가 `--nb-memo`/`--nb-tape` 색상을 사용. prop 추가로 치환 범위 확대. 기본값 `var(--nb-ink)`으로 기존 동작 유지. |
| 2 | `--nb-sky` → `var(--sky-1)` 직접 참조 | `--nb-sky`에 대응하는 semantic 토큰 미정의. `var(--sky-1)` primitive 직접 참조가 현재 상태에서 가장 정직한 표현. semantic 정의는 PR D에서 검토. |
