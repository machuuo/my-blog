# 디자인 시스템 PR 로드맵

> 근거 리서치: [research-design-system-trends-2026.md](./research-design-system-trends-2026.md)
> 작성일: 2026-06-09
> 목표: 커스텀 notebook/journal 디자인 시스템을 2025–2026 트렌드(토큰 우선·CSS-first·3계층)에 맞춰 경량으로 정비

## 현황 (착수 시점 스냅샷)

- **git 이력 0개** — 전체 코드가 untracked 상태 (베이스라인 커밋 선행 필요)
- Tailwind **v3.4.1** (JS config)
- `--nb-*` 토큰이 `globals.css`에 존재하나 **primitive=semantic 혼재** (색값이 곧 이름)
- `var(--nb-*)` **인라인 사용 13개 파일 / 121회** (`ink` 39, `pink` 30, `rule` 14, `sage` 13 …)
- `style={{ fontFamily }}` **인라인 109회** — 손글씨 폰트를 인라인으로 박아씀
- CVA **이미 2개 파일에서 사용 중** (도입이 아니라 패턴 통일 대상)

## 실행 순서

```
#0 ──┬── #1 ──── #2
     │
     └── #3
     │
     └── #4
        (#5, #6 선택)
```

권장 순서: **#0 → (#1 → #2) → #3 → #4**. #1·#3은 서로 독립이라 병렬 가능. #5·#6은 선택.

---

## PR 목록

### [ ] #0 — chore: 베이스라인 초기 커밋

- **내용**: 현재 전체 코드를 git에 최초 기록 (지금 이력 0개)
- **이유**: 이후 모든 PR의 diff 기준점 확보. 지금은 파일이 날아가면 복구 불가.
- **선행**: 없음 (필수 선행)
- **규모**: 필수
- **완료 기준**: `git log`에 초기 커밋 1개 존재, working tree clean

### [ ] #1 — feat(tokens): semantic 토큰 계층 + Tailwind 색상 노출

- **내용**:
  - `globals.css`에 의도 기반 semantic 토큰 추가 (`--nb-surface`, `--nb-text`, `--nb-accent` 등)
  - 기존 primitive(`--nb-paper`, `--nb-ink` 등)를 별칭 참조하도록 연결
  - `tailwind.config.ts`의 `theme.extend.colors.nb`에 등록 → `bg-nb-surface text-nb-text` 사용 가능
- **이유**: semantic 계층 부재 해소. "리팩터를 안전하게 만드는 계층"(트렌드 #1). Tailwind 유틸로 노출(#3).
- **선행**: #0
- **규모**: 소
- **비파괴**: 기존 `var(--nb-*)` 유지하면서 추가만 → 기존 화면 영향 없음
- **완료 기준**: 신규 semantic 클래스가 빌드되고, 샘플 컴포넌트에서 `bg-nb-surface` 렌더 확인

### [ ] #2 — refactor(tokens): nb 색상 인라인 → Tailwind 유틸 치환

- **내용**: 13개 파일의 `var(--nb-*)` 인라인 121회를 `bg-nb-* / text-nb-* / border-nb-*` 유틸 클래스로 교체
- **이유**: 인라인 스타일 제거, 일관성 확보, semantic 토큰 실사용
- **선행**: #1
- **규모**: 중
- **완료 기준**: `grep "var(--nb-" src`가 0건(또는 유틸로 불가한 잔여만 명시), 시각적 회귀 없음

### [ ] #3 — refactor(font): 폰트 토큰화

- **내용**:
  - Caveat/Kalam 등 손글씨 폰트를 `next/font/google`로 옮겨 변수화 (`--font-hand` 등)
  - `tailwind.config.ts`에 `fontFamily.hand` 등 등록
  - `style={{ fontFamily }}` 인라인 109회를 `font-hand` 등 유틸로 교체
- **이유**: 인라인 109회는 현재 최대 부채. `<link>` 로드를 next/font로 전환 시 성능(레이아웃 시프트 방지) 이점도.
- **선행**: #0 (#1과 독립)
- **규모**: 중
- **완료 기준**: `grep "fontFamily" src` 잔여 최소화, 폰트 렌더 동일, next/font 적용

### [ ] #4 — refactor(ui): CVA 변형 패턴 통일

- **내용**: 기존 2개 파일의 CVA 패턴을 기준으로 button/badge 등 변형을 정리·통일
- **이유**: 변형 로직 산재 방지. 1인 블로그엔 CVA로 충분(Tailwind Variants 불필요, 트렌드 #3).
- **선행**: #1
- **규모**: 소
- **완료 기준**: 변형 컴포넌트가 일관된 CVA 패턴 사용, 기존 변형 동작 유지

### [ ] #5 — (선택) chore: Tailwind v4 마이그레이션

- **내용**: v3 → v4 CSS-first(`@theme`). shadcn `:root` + `@theme inline` 패턴 채택
- **이유**: CSS-first가 v4 기본값(트렌드 #2). 단 v3로도 토큰화 핵심은 달성 가능 → 급하지 않음
- **선행**: #1
- **규모**: 대
- **보류 판단**: #1~#4 완료 후 필요성 재평가

### [ ] #6 — (선택) docs: 디자인 시스템 미리보기 페이지

- **내용**: `/design` 라우트에 토큰·컴포넌트 카탈로그 페이지 (스토리북 대안)
- **이유**: 1인 운영엔 스토리북이 과잉일 수 있음. 라이브 페이지가 문서 역할(트렌드 #4 / open question 3)
- **선행**: #1
- **규모**: 소
- **보류 판단**: 컴포넌트가 더 늘어난 뒤 착수
