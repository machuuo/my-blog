# Semantic 토큰 계층 완성

## 1. Background & Goals

PR A에서 primitive 토큰(`--sand-*`, `--brown-*` 등)과 semantic 초안(`--nb-paper`, `--nb-ink` 등)을 구축했다. 그러나 semantic 계층이 미완성 상태로, backward-compat alias가 공식 토큰처럼 사용되고 있고 accent 시스템이 CSS 변수 체계 바깥(hex 반환)에 있다.

**목표**: semantic 토큰 계층을 완성하여 컴포넌트가 primitive를 직접 참조하는 일 없이 오직 semantic 토큰만을 소비하도록 만든다.

## 2. Functional Requirements

### In Scope
- `--nb-butter` backward-compat alias를 `--nb-note` 공식 semantic으로 격상
- 코드블록 전용 semantic 토큰 (`--nb-code-bg`, `--nb-code-fg`, `--nb-code-muted`) 추가
- `accentVar()` 반환값을 신규 semantic 이름(`--nb-tape/memo/note`)으로 교체
- `accentTint()` 반환값을 hex에서 primitive CSS 변수(`var(--green-2)` 등)로 교체
- `tailwind.config.ts` nb 객체에 신규 토큰 노출 및 backward-compat 항목 제거

### Out of Scope
- 컴포넌트 내 하드코딩 hex 치환 (PR C 범위)
- `--nb-sage`, `--nb-pink`, `--nb-sky` alias 제거 (컴포넌트 치환 PR에서 동시 제거)
- 폰트 상수(`NB_HAND` 등) CSS 변수화 (PR C 범위)
- 포스트/태그 데이터 CMS 이전

## 3. Acceptance Criteria

- [ ] `--nb-note: var(--yellow-1)` 가 `:root`에 정의되어 있다
- [ ] `--nb-butter` backward-compat alias가 `globals.css`에서 제거되어 있다
- [ ] `tailwind.config.ts`에서 `nb.butter`가 제거되고 `nb.note`가 추가되어 있다
- [ ] `--nb-code-bg`, `--nb-code-fg`, `--nb-code-muted`가 `:root`에 정의되어 있다
- [ ] `[data-nb-theme="dark"]` 재정의 없이도 dark mode에서 코드블록 색상이 primitive cascade를 통해 올바르게 추종한다
- [ ] `accentVar("sage")`가 `var(--nb-tape)`를 반환한다
- [ ] `accentVar("plum")`이 `var(--nb-memo)`를 반환한다
- [ ] `accentVar("terracotta")`가 `var(--nb-note)`를 반환한다
- [ ] `accentTint("sage")`가 `var(--green-2)`를 반환한다
- [ ] `accentTint("plum")`이 `var(--pink-2)`를 반환한다
- [ ] `accentTint("terracotta")`가 `var(--yellow-2)`를 반환한다
- [ ] `tsc --noEmit` 통과
- [ ] 기존 `accentVar()`, `accentTint()` 호출처 5곳이 시각적으로 동일하게 동작한다

## 4. Functional Flow

변경은 순수 CSS 변수 정의 및 JS 함수 반환값 교체이므로 사용자 인터랙션 플로우 없음.

**적용 흐름**:
```
globals.css (:root)
  └── primitive: --yellow-1, --green-2, --brown-4 등
  └── semantic: --nb-note → var(--yellow-1)
               --nb-code-bg → var(--brown-4)
               --nb-code-fg → var(--sand-3)
               --nb-code-muted → var(--sand-5)

tailwind.config.ts
  └── nb.note → "var(--nb-note)"
  └── nb.code-bg → "var(--nb-code-bg)"
  └── nb.code-fg → "var(--nb-code-fg)"
  └── nb.code-muted → "var(--nb-code-muted)"

design-data.ts
  └── accentVar("terracotta") → "var(--nb-note)"
  └── accentTint("sage") → "var(--green-2)"
```

**Dark mode cascade** (변경 없이 자동):
```
[data-nb-theme="dark"] 재정의:
  --brown-4: #F7F1E3  (dark mode에서 밝은 값)
  --sand-3:  #1D1B16  (dark mode에서 어두운 값)
  --sand-5:  #0F0E0C

→ --nb-code-bg/fg/muted 가 primitive 재정의를 자동 추종
```

## 5. UI Design

해당 없음 — CSS 변수 정의 및 JS 함수 변경만. 시각적 변화 없음.

**Component tree**: 변경 없음 (설정 파일 및 유틸 함수만 수정)

**Accessibility**: 해당 없음 — 인터랙티브 UI 변경 없음

## 6. Technical Design

### 변경 파일

| 파일 | 역할 | 변경 내용 |
|------|------|---------|
| `src/app/globals.css` | 토큰 정의 SoT | `--nb-note`, `--nb-code-*` 추가; `--nb-butter` 제거 |
| `tailwind.config.ts` | Tailwind 노출 | `nb.note`, `nb.code-*` 추가; `nb.butter` 제거 |
| `src/shared/lib/design-data.ts` | accent 유틸 | `accentVar()`, `accentTint()` 반환값 교체 |

### 신규 semantic 토큰 정의

| 토큰 | 참조 primitive | 의미 |
|------|--------------|------|
| `--nb-note` | `var(--yellow-1)` | 스티커/노트 노란색 (구 `--nb-butter`) |
| `--nb-code-bg` | `var(--brown-4)` | 코드블록 배경 (`#1F1813`) |
| `--nb-code-fg` | `var(--sand-3)` | 코드블록 전경 (`#F1E7D6`) |
| `--nb-code-muted` | `var(--sand-5)` | 코드블록 파일명/흐린 텍스트 (`#C7B89A`) |

### accentVar() 매핑 변경

| accent 값 | 변경 전 | 변경 후 |
|----------|--------|--------|
| `"sage"` | `var(--nb-sage)` | `var(--nb-tape)` |
| `"plum"` | `var(--nb-pink)` | `var(--nb-memo)` |
| `"terracotta"` | `var(--nb-butter)` | `var(--nb-note)` |

### accentTint() 매핑 변경

| accent 값 | 변경 전 | 변경 후 |
|----------|--------|--------|
| `"sage"` | `"#BCCFA4"` | `"var(--green-2)"` |
| `"plum"` | `"#E6BAA9"` | `"var(--pink-2)"` |
| `"terracotta"` | `"#E3CB87"` | `"var(--yellow-2)"` |

### accentTint() 호출처 (영향 확인 필요)

| 파일 | 라인 | 컴포넌트 |
|------|------|---------|
| `src/views/home/ui/HomePage.tsx` | 61 | Polaroid tint |
| `src/views/hobby-detail/ui/HobbyDetailPage.tsx` | 112 | Polaroid tint |
| `src/views/hobby-list/ui/HobbyListPage.tsx` | 135 | StripePlaceholder tint |
| `src/views/tech-detail/ui/TechDetailPage.tsx` | 58, 189 | Polaroid/StripePlaceholder tint |

> `tint` prop이 CSS 변수 문자열을 받을 수 있는지 Polaroid·StripePlaceholder 컴포넌트 확인 필요.
> 현재 `Polaroid.tsx:22`에 `tint.startsWith("var")` 분기가 있으므로 호환 확인.

## 7. Error & Feedback Handling

해당 없음 — 런타임 에러 발생 가능성 없는 정적 설정 변경.

유일한 실패 시나리오: `tsc --noEmit` 타입 에러. 구현 후 즉시 확인.

## 8. Decisions

| # | 결정 | 이유 |
|---|------|------|
| 1 | `--nb-butter` → `--nb-note` | tape/memo/photo 네이밍 패턴과 일관성. StickyNote·WashiTape 사용 의도와 일치 |
| 2 | `accentTint()` → primitive 직접 참조 | globals.css 추가 없이 cascade 자동 추종. 불필요한 추상화 레이어 제거 |
| 3 | 코드블록 → `--nb-code-*` semantic 추가 | dark mode theme-aware 동작. primitive 재정의만으로 자동 추종 |
