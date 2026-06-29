# 하네스 후속 작업 백로그

ESLint 마이그레이션(PR #7) 머지 후 baseline 강화 트래커.

**목표**: 가드레일이 될 수 있는 룰을 식별하여 `warn → error` 승격으로 하네스 엔지니어링을 고도화한다. 룰 위반은 즉시 빌드 차단되도록 만든다.

**제외**: `max-lines-per-function`, `no-console`은 본 사이클에서 다루지 않는다.

진행 상태: ⬜ 대기 / 🟡 진행 중 / ✅ 완료 / ❌ 보류

---

## Tier A — baseline 잡혀 있음, 코드 수정 후 승격

룰별 1 PR. 비용 오름차순.

| # | 상태 | 브랜치 | 룰 | 위반 | 작업 |
|---|---|---|---|---|---|
| A-1 | ✅ | `chore/lint/a11y-lightbox` | `jsx-a11y/click-events-have-key-events` + `jsx-a11y/no-static-element-interactions` | 1 + 1 (같은 위치) | HobbyDetailPage:196 인라인 라이트박스 div를 shadcn `Dialog`/`DialogContent`로 전환 (role=dialog + focus trap + autoFocus + Esc 닫기 모두 base-ui 자동) |
| A-2 | ✅ | `chore/lint/array-index-key` | `react/no-array-index-key` | 2 | breadcrumb path segment + TagsPage 데이터 안정 key |
| A-3 | ✅ | `chore/lint/set-state-in-effect` | `react-hooks/set-state-in-effect` | 1 | NbFrame 테마 영속화 패턴을 `useSyncExternalStore` 기반 `useNbTheme` hook으로 분리 + `<html suppressHydrationWarning>` |
| A-4 | ✅ | `chore/lint/non-null-assertion` | `@typescript-eslint/no-non-null-assertion` | 6 | `shared/lib/env.ts`에 `requireEnv` 가드 헬퍼 도입 + auth/supabase 6곳 교체. 부수로 `shared/lib` 그룹의 `import/no-relative-parent-imports` 해제(슬롯 자기참조 허용) |

각 PR 공통 마무리:
1. 룰 위반 0 확인 (`pnpm lint`)
2. `lint-baseline.json`에서 해당 룰 항목 제거 + `warn_total` 갱신
3. `eslint.config.mjs`에서 해당 룰 `warn → error` 승격
4. 회귀 차단 검증 — 일부러 위반 추가 시 lint 실패하는지 확인 후 되돌리기
5. `eslint-migration.md` Changelog 갱신
6. `backlog.md` 해당 항목 ✅

---

## Tier B — 즉시 승격 (코드 수정 0)

| 상태 | 브랜치 | 룰 | 현재 강도 |
|---|---|---|---|
| ✅ | `fix/check-design-sync` (b-1) | `sonarjs/cognitive-complexity` | error **10** (15→10) |
| ✅ | (위와 묶음) | `unicorn/prefer-string-replace-all` | error |
| ✅ | (위와 묶음) | `react/jsx-no-leaked-render` | error (ternary) |

**b-1로 완료** (사이클 추적). 더불어 제어흐름 스타일 표준 2룰을 함께 도입:
- ✅ `no-else-return` error (early-return 강제, 위반 0)
- ✅ `no-nested-ternary` error (중첩삼항 금지, 위반 3건 해소)
- 프로젝트 `CLAUDE.md`에 영어 "Control Flow & Conditionals" 절 + cognitive-complexity threshold 10 결정. 설계서 `b-1_tier-b-style-standards.md`.

---

## Tier C — 미등록, 추가 도입 (autofix 가능 우선)

도입 방식: warn으로 등록 → `pnpm lint:fix` 일괄 정리 → 위반 0 확인 → error 승격.

### C-1: autofix만 (한 PR로 묶음)

| 룰 | 가치 |
|---|---|
| `react/jsx-no-useless-fragment` | 무의미 fragment 차단 |
| `react/self-closing-comp` | 빈 컴포넌트 자가 닫기 |
| `import/order` | import 그룹별 정렬 |
| `import/first` | import 맨 위 강제 |
| `import/newline-after-import` | import 다음 빈 줄 |
| `prefer-template` | 문자열 + 대신 템플릿 리터럴 |
| `unicorn/throw-new-error` | `new Error()` 강제 |
| `unicorn/no-await-expression-member` | `(await x).y` 직접 접근 금지 |

### C-2: 부분 autofix + 수동

| 룰 | 가치 |
|---|---|
| `@typescript-eslint/prefer-nullish-coalescing` | `\|\|` 대신 `??` (0/''/false 함정 차단) |
| `@typescript-eslint/prefer-optional-chain` | `a && a.b` 대신 `a?.b` |

---

## 진행 순서

```text
A-1 (jsx-a11y 묶음) → A-2 (array-index-key) → A-3 (set-state-in-effect) → A-4 (non-null-assertion)
  → Tier B 묶음 PR
  → Tier C-1 autofix 묶음 PR
  → Tier C-2 부분 autofix PR
```

---

## Tier S, Tier D (보류)

별도 사이클에서 처리. 본 백로그에 포함하지 않음.

- **Tier S** (type-aware 룰): `no-floating-promises`, `no-misused-promises`, `await-thenable` 등 — `parserOptions.project` 사전 점검 필요
- **Tier D**: `jsx-no-bind`, `strict-boolean-expressions`, `no-duplicate-string` 등 — 위반 많아 별도 신중 도입

---

## 변경 이력

- 2026-06-25: 첫 백로그 폐기 → 새 방향성. baseline 승격 중심으로 재정의 (Tier A/B/C).
- 2026-06-25: 작업 순서 A-1 시작.
- 2026-06-25: **A-1 완료** — jsx-a11y 2룰 warn→error 승격 + HobbyDetailPage:196 위반 해소. baseline 24→22.
- 2026-06-26: **A-2 완료** — `react/no-array-index-key` warn→error 승격 + breadcrumb/TagsPage 위반 2건 해소. baseline 22→20.
- 2026-06-26: **Test-1 완료** — vitest + @testing-library 인프라 도입. PR #10 머지.
- 2026-06-26: **A-3 완료** — `react-hooks/set-state-in-effect` warn→error 승격 + NbFrame을 `useSyncExternalStore` 기반 `useNbTheme` hook으로 분리. useNbTheme.test.ts 6 케이스. baseline 20→19.
- 2026-06-26: **A-4 완료** — `@typescript-eslint/no-non-null-assertion` warn→error 승격 + `requireEnv` 가드 헬퍼 도입(`shared/lib/env.ts`, 4 테스트 케이스), auth/supabase 6곳 교체. 설계 D1은 `shared/config` → `shared/lib`로 재고(lint 룰 충돌 회피). `shared/lib` 그룹의 `import/no-relative-parent-imports` 해제. baseline 19→13.
- 2026-06-29: **B-1 완료** — Tier B 3룰 승격(cognitive-complexity warn15→error**10**, prefer-string-replace-all·jsx-no-leaked-render warn→error) + 제어흐름 표준 2룰 신규 error(no-else-return, no-nested-ternary). 중첩삼항 3곳 해소(HomePage·TechDetail `tapeColor`→Record, PostForm 라벨→`submitLabel` early-return). 프로젝트 CLAUDE.md 영어 제어흐름 절 신설. baseline 13 유지(승격 룰 0 warning). 설계서 `b-1_tier-b-style-standards.md`.
